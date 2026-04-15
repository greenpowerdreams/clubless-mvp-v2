// Stripe webhook handler — idempotent safety net for checkout.session.completed.
//
// The frontend CheckoutSuccess page also calls verify-payment, but if the
// buyer closes the browser before that fires we'd lose the order finalization.
// This webhook fires from Stripe directly and runs the same finalize logic
// (update order → confirm tickets → create ticket_instances → calc fees →
// send email). Both paths are idempotent: re-running on a completed order
// is a no-op.
//
// Setup:
//   1. STRIPE_WEBHOOK_SECRET env var set on the Supabase project
//   2. Stripe Dashboard → Developers → Webhooks → add endpoint:
//      https://sdnjbzmyayapmseipcvw.supabase.co/functions/v1/stripe-webhook
//      events: checkout.session.completed
//
// TODO: Extract finalizeOrder() into supabase/functions/_shared/ and have
// verify-payment call it too, to remove the inline duplication below.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getPlatformFeePercent } from "../_shared/platform-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const log = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

async function finalizeOrder(
  supabaseAdmin: SupabaseClient,
  stripe: Stripe,
  orderId: string,
  sessionId: string,
) {
  // Fetch order
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error(`Order ${orderId} not found`);
  }

  if (order.status === "completed") {
    log("Order already completed (idempotent skip)", { orderId });
    return;
  }

  // Verify with Stripe
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    throw new Error(`Session ${sessionId} not paid (${session.payment_status})`);
  }

  // Mark order completed
  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({
      status: "completed",
      stripe_payment_intent_id: session.payment_intent as string,
    })
    .eq("id", orderId);

  if (updateError) throw new Error(`Failed to update order: ${updateError.message}`);
  log("Order marked completed", { orderId });

  // Move qty_reserved → qty_sold
  const { error: confirmError } = await supabaseAdmin.rpc("confirm_ticket_sale", {
    p_order_id: orderId,
  });

  if (confirmError) {
    log("Warning: confirm_ticket_sale RPC failed, falling back", { error: confirmError.message });
    const lineItems = order.line_items_json as Array<{ ticket_id: string; quantity: number }>;
    for (const item of lineItems) {
      const { data: t } = await supabaseAdmin
        .from("tickets")
        .select("qty_sold, qty_reserved")
        .eq("id", item.ticket_id)
        .single();
      if (t) {
        await supabaseAdmin
          .from("tickets")
          .update({
            qty_sold: t.qty_sold + item.quantity,
            qty_reserved: Math.max(0, t.qty_reserved - item.quantity),
          })
          .eq("id", item.ticket_id);
      }
    }
  }

  // Create ticket_instances (idempotent)
  const { count: existingCount } = await supabaseAdmin
    .from("ticket_instances")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId);

  if ((existingCount ?? 0) === 0) {
    const lineItems = order.line_items_json as Array<{ ticket_id: string; quantity: number }>;
    const rows: Array<Record<string, unknown>> = [];
    for (const item of lineItems) {
      for (let i = 0; i < item.quantity; i++) {
        rows.push({
          order_id: order.id,
          event_id: order.event_id,
          tier_id: item.ticket_id,
          holder_id: order.buyer_user_id ?? null,
          holder_email: order.buyer_email,
          holder_name: order.buyer_name ?? null,
        });
      }
    }
    if (rows.length > 0) {
      const { error: insError } = await supabaseAdmin.from("ticket_instances").insert(rows);
      if (insError) {
        log("ERROR: Failed to insert ticket_instances", {
          error: insError.message,
          orderId,
          attempted: rows.length,
        });
      } else {
        log("Ticket instances created", { count: rows.length });
      }
    }
  }

  // Calc fees from platform_config
  const platformFeePercent = await getPlatformFeePercent(supabaseAdmin);
  const platformFeeCents = Math.round(order.amount_cents * (platformFeePercent / 100));
  const creatorAmountCents = order.amount_cents - platformFeeCents;
  log("Platform fee resolved", { platformFeePercent });
  await supabaseAdmin
    .from("orders")
    .update({ platform_fee_cents: platformFeeCents, creator_amount_cents: creatorAmountCents })
    .eq("id", orderId);

  // Fire confirmation email (best-effort)
  try {
    const { data: eventData } = await supabaseAdmin
      .from("events")
      .select("title, start_at, city, address")
      .eq("id", order.event_id)
      .single();

    if (eventData) {
      const ticketsForEmail = (order.line_items_json as Array<{
        ticket_name: string;
        quantity: number;
        unit_price_cents: number;
      }>).map((item) => ({
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

      await supabaseAdmin.functions.invoke("send-ticket-email", {
        body: {
          order_id: order.id,
          to_email: order.buyer_email,
          buyer_name: order.buyer_name || "Guest",
          event_title: eventData.title,
          event_date: eventDate,
          event_location: eventData.address
            ? `${eventData.address}, ${eventData.city}`
            : eventData.city,
          tickets: ticketsForEmail,
          total_amount: order.amount_cents,
        },
      });
      log("Ticket email sent");
    }
  } catch (emailError) {
    log("Email send failed (non-fatal)", { error: String(emailError) });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    log("ERROR: STRIPE_WEBHOOK_SECRET not configured");
    return new Response(JSON.stringify({ error: "webhook not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "missing stripe-signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    log("Signature verification failed", { error: String(err) });
    return new Response(JSON.stringify({ error: "invalid signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  log("Event received", { type: event.type, id: event.id });

  if (event.type !== "checkout.session.completed") {
    // Acknowledge but ignore other events
    return new Response(JSON.stringify({ received: true, ignored: event.type }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    log("ERROR: session metadata missing order_id", { sessionId: session.id });
    return new Response(JSON.stringify({ error: "missing order_id metadata" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    await finalizeOrder(supabaseAdmin, stripe, orderId, session.id);
    return new Response(JSON.stringify({ received: true, finalized: orderId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR finalizing order", { orderId, error: msg });
    // Return 500 so Stripe retries
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
