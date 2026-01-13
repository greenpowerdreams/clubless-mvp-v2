import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-TICKET-CHECKOUT] ${step}${detailsStr}`);
};

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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const { event_id, line_items }: CheckoutRequest = await req.json();
    if (!event_id || !line_items || line_items.length === 0) {
      throw new Error("Missing event_id or line_items");
    }
    logStep("Request parsed", { event_id, lineItemCount: line_items.length });

    // Fetch event details
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, title, status")
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

    // Reserve tickets temporarily
    for (const item of line_items) {
      const ticket = tickets.find(t => t.id === item.ticket_id);
      if (ticket) {
        await supabaseAdmin
          .from("tickets")
          .update({ qty_reserved: ticket.qty_reserved + item.quantity })
          .eq("id", item.ticket_id);
      }
      // Note: In production, you'd use a proper reservation system with expiry
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    }

    // Get user profile for name/phone
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name, phone")
      .eq("user_id", user.id)
      .single();

    // Create pending order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        event_id,
        buyer_user_id: user.id,
        buyer_email: user.email,
        buyer_name: profile?.display_name || null,
        buyer_phone: profile?.phone || null,
        amount_cents: totalAmountCents,
        line_items_json: orderLineItems,
        status: "pending",
        currency: "usd",
      })
      .select()
      .single();

    if (orderError) {
      logStep("Error creating order", { error: orderError.message });
      throw new Error("Failed to create order");
    }
    logStep("Order created", { orderId: order.id });

    // Create Stripe checkout session
    const origin = req.headers.get("origin") || "https://localhost:8080";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: stripeLineItems,
      mode: "payment",
      success_url: `${origin}/checkout/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel?order_id=${order.id}`,
      metadata: {
        order_id: order.id,
        event_id: event_id,
        user_id: user.id,
      },
      payment_intent_data: {
        metadata: {
          order_id: order.id,
          event_id: event_id,
        },
      },
    });
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
