// Process refund — admin-initiated refund via Stripe Refunds API.
//
// Called from the admin dashboard when approving a refund request.
// Can do full or partial refunds. Updates order + ticket_instances status.
//
// Body: { order_id, reason?, ticket_instance_ids?: string[] }
// - If ticket_instance_ids provided: partial refund for those tickets only
// - If omitted: full refund of the entire order

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PROCESS-REFUND] ${step}${detailsStr}`);
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // --- Auth: admin only ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeKey) {
      log("ERROR", "STRIPE_SECRET_KEY not set");
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin role
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      log("DENIED", { userId: user.id });
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Parse body ---
    const { order_id, reason, ticket_instance_ids } = await req.json();

    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("Processing refund", { order_id, reason, partialTickets: ticket_instance_ids?.length });

    // --- Fetch order ---
    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .select("id, amount_cents, status, stripe_payment_intent_id, refund_amount_cents, event_id, buyer_email, line_items_json")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.status === "refunded") {
      return new Response(JSON.stringify({ error: "Order already fully refunded" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!order.stripe_payment_intent_id) {
      return new Response(JSON.stringify({ error: "No payment intent found — cannot refund" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Calculate refund amount ---
    let refundAmountCents: number;
    let isPartial = false;

    if (ticket_instance_ids && ticket_instance_ids.length > 0) {
      // Partial refund: calculate from ticket tier prices
      const { data: ticketInstances } = await serviceClient
        .from("ticket_instances")
        .select("id, tier_id, status")
        .in("id", ticket_instance_ids)
        .eq("order_id", order_id);

      if (!ticketInstances || ticketInstances.length === 0) {
        return new Response(JSON.stringify({ error: "No valid tickets found for refund" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get tier prices
      const tierIds = [...new Set(ticketInstances.map((ti: any) => ti.tier_id))];
      const { data: tiers } = await serviceClient
        .from("tickets")
        .select("id, price_cents")
        .in("id", tierIds);

      const tierPriceMap = new Map((tiers ?? []).map((t: any) => [t.id, t.price_cents]));
      refundAmountCents = ticketInstances.reduce((sum: number, ti: any) => {
        return sum + (tierPriceMap.get(ti.tier_id) ?? 0);
      }, 0);
      isPartial = true;
    } else {
      // Full refund
      refundAmountCents = order.amount_cents - (order.refund_amount_cents ?? 0);
    }

    if (refundAmountCents <= 0) {
      return new Response(JSON.stringify({ error: "Nothing to refund" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("Refund amount calculated", { refundAmountCents, isPartial });

    // --- Issue Stripe refund ---
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-03-31.basil" });

    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      amount: refundAmountCents,
      reason: "requested_by_customer",
      metadata: {
        order_id: order.id,
        admin_user_id: user.id,
        refund_reason: reason ?? "Admin-initiated refund",
      },
    });

    log("Stripe refund created", { refundId: refund.id, amount: refund.amount, status: refund.status });

    // --- Update order ---
    const totalRefunded = (order.refund_amount_cents ?? 0) + refundAmountCents;
    const isFullyRefunded = totalRefunded >= order.amount_cents;

    await serviceClient
      .from("orders")
      .update({
        status: isFullyRefunded ? "refunded" : "partially_refunded",
        refund_amount_cents: totalRefunded,
        refund_reason: reason ?? "Refund processed by admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    // --- Update ticket_instances ---
    if (ticket_instance_ids && ticket_instance_ids.length > 0) {
      // Mark only specified tickets as refunded
      await serviceClient
        .from("ticket_instances")
        .update({ status: "refunded", updated_at: new Date().toISOString() })
        .in("id", ticket_instance_ids)
        .eq("order_id", order_id);
    } else {
      // Full refund: mark all tickets in this order as refunded
      await serviceClient
        .from("ticket_instances")
        .update({ status: "refunded", updated_at: new Date().toISOString() })
        .eq("order_id", order_id);
    }

    // --- Decrement qty_sold on ticket tiers ---
    const { data: refundedTickets } = await serviceClient
      .from("ticket_instances")
      .select("tier_id")
      .eq("order_id", order_id)
      .eq("status", "refunded");

    if (refundedTickets) {
      const tierCounts = new Map<string, number>();
      for (const t of refundedTickets) {
        tierCounts.set(t.tier_id, (tierCounts.get(t.tier_id) ?? 0) + 1);
      }
      for (const [tierId, count] of tierCounts) {
        // Use RPC or direct update - decrement qty_sold
        const { data: tier } = await serviceClient
          .from("tickets")
          .select("qty_sold")
          .eq("id", tierId)
          .single();
        if (tier) {
          await serviceClient
            .from("tickets")
            .update({ qty_sold: Math.max(0, (tier.qty_sold ?? 0) - count) })
            .eq("id", tierId);
        }
      }
    }

    // --- Insert notification for the buyer ---
    if (order.buyer_email) {
      // Try to find buyer's user_id for in-app notification
      const { data: buyerAuth } = await serviceClient
        .from("profiles")
        .select("id")
        .eq("id", order.buyer_email)
        .maybeSingle();

      // Also try via auth.users email
      const { data: authUsers } = await serviceClient.rpc("get_user_id_by_email", {
        email_input: order.buyer_email,
      }).catch(() => ({ data: null }));

      // Best-effort notification (buyer might be a guest with no account)
      const buyerUserId = authUsers ?? buyerAuth?.id;
      if (buyerUserId) {
        await serviceClient.from("notifications").insert({
          user_id: buyerUserId,
          title: "Refund processed",
          body: `Your refund of $${(refundAmountCents / 100).toFixed(2)} has been processed. It may take 5-10 business days to appear on your statement.`,
        }).catch(() => {}); // best-effort
      }
    }

    log("Refund complete", {
      orderId: order_id,
      stripeRefundId: refund.id,
      amountCents: refundAmountCents,
      newOrderStatus: isFullyRefunded ? "refunded" : "partially_refunded",
    });

    return new Response(
      JSON.stringify({
        success: true,
        refund_id: refund.id,
        amount_cents: refundAmountCents,
        order_status: isFullyRefunded ? "refunded" : "partially_refunded",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    log("ERROR", { message: (err as Error).message, stack: (err as Error).stack });
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
