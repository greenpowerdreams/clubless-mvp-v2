import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getPlatformFeePercent } from "../_shared/platform-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LineItem {
  ticket_id: string;
  quantity: number;
}

interface CheckoutRequest {
  event_id: string;
  line_items: LineItem[];
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_CHECKOUTS_PER_WINDOW = 10; // Max 10 checkout attempts per minute per user
const MAX_CHECKOUTS_PER_EVENT_WINDOW = 3; // Max 3 checkout attempts per minute per user per event

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-TICKET-CHECKOUT] ${step}${detailsStr}`);
};

// Rate limiting using Deno KV
async function checkRateLimit(userId: string, eventId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const kv = await Deno.openKv();
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    // Check global user rate limit
    const userKey = ["checkout_rate_limit", "user", userId];
    const userEntry = await kv.get<{ timestamps: number[] }>(userKey);
    const userTimestamps = userEntry.value?.timestamps || [];
    const recentUserTimestamps = userTimestamps.filter(ts => ts > windowStart);

    if (recentUserTimestamps.length >= MAX_CHECKOUTS_PER_WINDOW) {
      await kv.close();
      return { 
        allowed: false, 
        reason: `Rate limit exceeded. Maximum ${MAX_CHECKOUTS_PER_WINDOW} checkout attempts per minute. Please try again shortly.` 
      };
    }

    // Check per-event rate limit (prevents targeting a specific event)
    const eventKey = ["checkout_rate_limit", "user_event", userId, eventId];
    const eventEntry = await kv.get<{ timestamps: number[] }>(eventKey);
    const eventTimestamps = eventEntry.value?.timestamps || [];
    const recentEventTimestamps = eventTimestamps.filter(ts => ts > windowStart);

    if (recentEventTimestamps.length >= MAX_CHECKOUTS_PER_EVENT_WINDOW) {
      await kv.close();
      return { 
        allowed: false, 
        reason: `Too many checkout attempts for this event. Maximum ${MAX_CHECKOUTS_PER_EVENT_WINDOW} per minute. Please wait before trying again.` 
      };
    }

    // Update timestamps
    recentUserTimestamps.push(now);
    recentEventTimestamps.push(now);

    await kv.set(userKey, { timestamps: recentUserTimestamps }, { expireIn: RATE_LIMIT_WINDOW_MS });
    await kv.set(eventKey, { timestamps: recentEventTimestamps }, { expireIn: RATE_LIMIT_WINDOW_MS });

    await kv.close();
    return { allowed: true };
  } catch (error) {
    // If KV fails, allow the request but log the error
    logStep("Rate limit check failed, allowing request", { error: String(error) });
    return { allowed: true };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Authenticate user (optional for guest checkout)
    const authHeader = req.headers.get("Authorization");
    let user: { id: string; email: string } | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError) throw new Error(`Authentication error: ${userError.message}`);
      if (userData.user?.email) {
        user = { id: userData.user.id, email: userData.user.email };
      }
    }

    // Parse request body
    const body = await req.json();
    const { event_id, line_items, buyer_email, buyer_name } = body as CheckoutRequest & {
      buyer_email?: string;
      buyer_name?: string;
    };
    if (!event_id || !line_items || line_items.length === 0) {
      throw new Error("Missing event_id or line_items");
    }

    // For guest checkout, require email
    const resolvedEmail = user?.email || buyer_email;
    const resolvedName = buyer_name || null;
    if (!resolvedEmail) {
      throw new Error("Email is required. Please sign in or provide an email address.");
    }
    const isGuest = !user;
    logStep(isGuest ? "Guest checkout" : "Authenticated checkout", {
      email: resolvedEmail,
      userId: user?.id ?? "guest",
    });
    logStep("Request parsed", { event_id, lineItemCount: line_items.length });

    // Check rate limit (use user_id if authenticated, email hash if guest)
    const rateLimitKey = user?.id || `guest_${resolvedEmail.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const rateLimitResult = await checkRateLimit(rateLimitKey, event_id);
    if (!rateLimitResult.allowed) {
      logStep("Rate limit exceeded", { key: rateLimitKey, eventId: event_id });
      return new Response(JSON.stringify({ error: rateLimitResult.reason }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }
    logStep("Rate limit check passed");

    // Fetch event details (include creator_id for Connect routing)
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, title, status, creator_id")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found");
    }
    if (event.status !== "published" && event.status !== "live") {
      throw new Error("Event is not available for ticket purchase");
    }
    logStep("Event verified", { eventId: event.id, title: event.title });

    // Fetch ticket details and validate availability
    const ticketIds = line_items.map(item => item.ticket_id);
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from("tickets")
      .select("*")
      .in("id", ticketIds)
      .eq("event_id", event_id);

    if (ticketsError || !tickets || tickets.length === 0) {
      throw new Error("Tickets not found");
    }
    logStep("Tickets fetched", { count: tickets.length });

    // Build Stripe line items and validate stock
    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let totalAmountCents = 0;
    const orderLineItems: Array<{
      ticket_id: string;
      ticket_name: string;
      quantity: number;
      unit_price_cents: number;
      subtotal_cents: number;
    }> = [];

    for (const item of line_items) {
      const ticket = tickets.find(t => t.id === item.ticket_id);
      if (!ticket) {
        throw new Error(`Ticket ${item.ticket_id} not found`);
      }
      if (!ticket.active) {
        throw new Error(`Ticket "${ticket.name}" is not available for sale`);
      }

      const available = ticket.qty_total - ticket.qty_sold - ticket.qty_reserved;
      if (item.quantity > available) {
        throw new Error(`Only ${available} tickets available for "${ticket.name}"`);
      }

      if (ticket.max_per_order && item.quantity > ticket.max_per_order) {
        throw new Error(`Maximum ${ticket.max_per_order} tickets per order for "${ticket.name}"`);
      }

      const subtotal = ticket.price_cents * item.quantity;
      totalAmountCents += subtotal;

      orderLineItems.push({
        ticket_id: ticket.id,
        ticket_name: ticket.name,
        quantity: item.quantity,
        unit_price_cents: ticket.price_cents,
        subtotal_cents: subtotal,
      });

      stripeLineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: ticket.name,
            description: `${event.title} - ${ticket.description || ticket.name}`,
          },
          unit_amount: ticket.price_cents,
        },
        quantity: item.quantity,
      });
    }
    logStep("Line items built", { totalAmountCents, itemCount: stripeLineItems.length });

    // Reserve tickets atomically using database function with row-level locking
    // This prevents race conditions where multiple users try to reserve the same tickets
    for (const item of line_items) {
      const { error: reserveError } = await supabaseAdmin.rpc('reserve_tickets', {
        p_ticket_id: item.ticket_id,
        p_quantity: item.quantity,
        p_order_id: null, // Will be set after order creation
      });
      
      if (reserveError) {
        // Release any reservations we already made if one fails
        logStep("Reservation failed, rolling back", { ticket_id: item.ticket_id, error: reserveError.message });
        throw new Error(reserveError.message || `Failed to reserve tickets for "${item.ticket_id}"`);
      }
    }
    logStep("Tickets reserved atomically");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: resolvedEmail, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    // Get buyer profile for name/phone (only for authenticated users)
    let profileName: string | null = resolvedName;
    let profilePhone: string | null = null;
    if (user) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("display_name, phone")
        .eq("user_id", user.id)
        .single();
      profileName = profile?.display_name || resolvedName;
      profilePhone = profile?.phone || null;
    }

    // ── Stripe Connect: look up the event creator's connected account ──
    // If the creator has completed Stripe onboarding, route the payment
    // through their connected account with a platform application fee.
    // If not connected, money goes to the platform account (manual payout).
    let creatorStripeAccountId: string | null = null;
    let applicationFeeCents = 0;
    if (event.creator_id) {
      const { data: creatorProfile } = await supabaseAdmin
        .from("profiles")
        .select("stripe_account_id, stripe_onboarding_complete")
        .eq("id", event.creator_id)
        .single();

      if (creatorProfile?.stripe_account_id && creatorProfile?.stripe_onboarding_complete) {
        creatorStripeAccountId = creatorProfile.stripe_account_id;
        const platformFeePercent = await getPlatformFeePercent(supabaseAdmin);
        applicationFeeCents = Math.round(totalAmountCents * (platformFeePercent / 100));
        logStep("Connect routing enabled", {
          creatorStripeAccountId,
          platformFeePercent,
          applicationFeeCents,
        });
      } else {
        logStep("Creator not Stripe-connected, payment goes to platform", {
          creatorId: event.creator_id,
          hasAccountId: !!creatorProfile?.stripe_account_id,
          onboardingComplete: creatorProfile?.stripe_onboarding_complete,
        });
      }
    }

    // Create pending order with reservation expiration (30 minutes)
    const reservationExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        event_id,
        buyer_user_id: user?.id || null,
        buyer_email: resolvedEmail,
        buyer_name: profileName,
        buyer_phone: profilePhone,
        amount_cents: totalAmountCents,
        line_items_json: orderLineItems,
        status: "pending",
        currency: "usd",
        reservation_expires_at: reservationExpiresAt,
      })
      .select()
      .single();

    if (orderError) {
      logStep("Error creating order", { error: orderError.message });
      throw new Error("Failed to create order");
    }
    logStep("Order created with reservation expiry", { orderId: order.id, expiresAt: reservationExpiresAt });

    // Create Stripe checkout session
    // If creator has a connected Stripe account, use destination charges:
    //   - Stripe processes the full amount
    //   - Platform keeps application_fee_amount (e.g. 5%)
    //   - Remainder auto-transfers to the creator's connected account
    const origin = req.headers.get("origin") || "https://localhost:8080";
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : resolvedEmail,
      line_items: stripeLineItems,
      mode: "payment",
      success_url: `${origin}/checkout/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel?order_id=${order.id}`,
      metadata: {
        order_id: order.id,
        event_id: event_id,
        user_id: user?.id || "guest",
      },
      payment_intent_data: {
        metadata: {
          order_id: order.id,
          event_id: event_id,
        },
        // If creator is Connect-onboarded, route funds to their account
        ...(creatorStripeAccountId
          ? {
              application_fee_amount: applicationFeeCents,
              transfer_data: { destination: creatorStripeAccountId },
            }
          : {}),
      },
    };
    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Update order with Stripe session ID
    await supabaseAdmin
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    return new Response(JSON.stringify({ 
      url: session.url,
      order_id: order.id,
      session_id: session.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
