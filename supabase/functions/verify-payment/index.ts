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

    // Update ticket quantities (move from reserved to sold)
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
    logStep("Ticket quantities updated");

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
