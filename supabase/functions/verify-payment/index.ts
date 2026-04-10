import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
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
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Parse request
    const { session_id, order_id } = await req.json();
    if (!session_id || !order_id) {
      throw new Error("Missing session_id or order_id");
    }
    logStep("Request parsed", { session_id, order_id });

    // Fetch order and verify ownership
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }
    if (order.buyer_user_id !== user.id) {
      throw new Error("Order does not belong to this user");
    }
    if (order.status === "completed") {
      logStep("Order already completed", { orderId: order.id });
      return new Response(JSON.stringify({ 
        success: true, 
        status: "completed",
        message: "Order already processed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("Order found", { orderId: order.id, status: order.status });

    // Verify payment with Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Stripe session retrieved", { 
      sessionId: session.id, 
      paymentStatus: session.payment_status 
    });

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Update order status to completed
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ 
        status: "completed",
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq("id", order_id);

    if (updateError) {
      throw new Error("Failed to update order status");
    }
    logStep("Order updated to completed");

    // Confirm ticket sale atomically (moves from reserved to sold)
    const { error: confirmError } = await supabaseAdmin.rpc('confirm_ticket_sale', {
      p_order_id: order_id
    });

    if (confirmError) {
      logStep("Warning: Failed to confirm ticket sale atomically", { error: confirmError.message });
      // Fallback to manual update if RPC fails
      const lineItems = order.line_items_json as Array<{
        ticket_id: string;
        quantity: number;
      }>;

      for (const item of lineItems) {
        const { data: ticket } = await supabaseAdmin
          .from("tickets")
          .select("qty_sold, qty_reserved")
          .eq("id", item.ticket_id)
          .single();

        if (ticket) {
          await supabaseAdmin
            .from("tickets")
            .update({
              qty_sold: ticket.qty_sold + item.quantity,
              qty_reserved: Math.max(0, ticket.qty_reserved - item.quantity),
            })
            .eq("id", item.ticket_id);
        }
      }
    }
    logStep("Ticket quantities updated (reserved → sold)");

    // Create ticket_instances (one row per individual ticket = one QR code)
    // Idempotent: skip if instances already exist for this order
    const { count: existingInstanceCount } = await supabaseAdmin
      .from("ticket_instances")
      .select("id", { count: "exact", head: true })
      .eq("order_id", order_id);

    if ((existingInstanceCount ?? 0) === 0) {
      const lineItems = order.line_items_json as Array<{
        ticket_id: string;
        quantity: number;
      }>;

      const instanceRows: Array<{
        order_id: string;
        event_id: string;
        tier_id: string;
        holder_id: string | null;
        holder_email: string;
        holder_name: string | null;
      }> = [];

      for (const item of lineItems) {
        for (let i = 0; i < item.quantity; i++) {
          instanceRows.push({
            order_id: order.id,
            event_id: order.event_id,
            tier_id: item.ticket_id,
            holder_id: order.buyer_user_id ?? null,
            holder_email: order.buyer_email,
            holder_name: order.buyer_name ?? null,
          });
        }
      }

      if (instanceRows.length > 0) {
        const { error: instanceError } = await supabaseAdmin
          .from("ticket_instances")
          .insert(instanceRows);

        if (instanceError) {
          // Don't fail the whole verification — payment is already settled.
          // Log loudly so the webhook safety net (B3c) can retry.
          logStep("ERROR: Failed to create ticket_instances", {
            error: instanceError.message,
            orderId: order.id,
            attempted: instanceRows.length,
          });
        } else {
          logStep("Ticket instances created", { count: instanceRows.length });
        }
      }
    } else {
      logStep("Ticket instances already exist (idempotent skip)", {
        existingCount: existingInstanceCount,
      });
    }

    // Calculate platform fee and creator amount
    const platformFeePercent = 10; // 10% platform fee
    const platformFeeCents = Math.round(order.amount_cents * (platformFeePercent / 100));
    const creatorAmountCents = order.amount_cents - platformFeeCents;

    await supabaseAdmin
      .from("orders")
      .update({
        platform_fee_cents: platformFeeCents,
        creator_amount_cents: creatorAmountCents,
      })
      .eq("id", order_id);
    logStep("Fees calculated", { platformFeeCents, creatorAmountCents });

    // Fetch event details for email
    const { data: eventData } = await supabaseAdmin
      .from("events")
      .select("title, start_at, city, address")
      .eq("id", order.event_id)
      .single();

    // Send ticket confirmation email
    if (eventData) {
      const ticketsForEmail = (order.line_items_json as Array<{
        ticket_name: string;
        quantity: number;
        unit_price_cents: number;
      }>).map(item => ({
        name: item.ticket_name,
        quantity: item.quantity,
        price: item.unit_price_cents,
      }));

      const eventDate = new Date(eventData.start_at).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      try {
        const emailPayload = {
          order_id: order.id,
          to_email: order.buyer_email,
          buyer_name: order.buyer_name || "Guest",
          event_title: eventData.title,
          event_date: eventDate,
          event_location: eventData.address ? `${eventData.address}, ${eventData.city}` : eventData.city,
          tickets: ticketsForEmail,
          total_amount: order.amount_cents,
        };

        await supabaseAdmin.functions.invoke("send-ticket-email", {
          body: emailPayload,
        });
        logStep("Ticket confirmation email sent");
      } catch (emailError) {
        // Log but don't fail the payment verification if email fails
        logStep("Failed to send ticket email (non-fatal)", { error: String(emailError) });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      status: "completed",
      message: "Payment verified and order completed",
      order_id: order.id,
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
