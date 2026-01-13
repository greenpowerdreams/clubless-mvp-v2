import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessPayoutRequest {
  payout_id: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-PAYOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("Unauthorized");
    }

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    const body: ProcessPayoutRequest = await req.json();
    logStep("Processing payout", { payout_id: body.payout_id });

    // Get payout details
    const { data: payout, error: payoutError } = await supabaseClient
      .from("payouts")
      .select("*")
      .eq("id", body.payout_id)
      .single();

    if (payoutError || !payout) {
      throw new Error("Payout not found");
    }

    if (payout.status === "completed") {
      throw new Error("Payout already completed");
    }

    // Update to processing
    await supabaseClient
      .from("payouts")
      .update({ status: "processing" })
      .eq("id", body.payout_id);

    logStep("Payout set to processing");

    // Get creator profile for email
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("display_name")
      .eq("user_id", payout.creator_id)
      .maybeSingle();

    // Get event title
    const { data: event } = await supabaseClient
      .from("events")
      .select("title")
      .eq("id", payout.event_id)
      .maybeSingle();

    // Get creator email from auth
    const { data: authUser } = await supabaseClient.auth.admin.getUserById(payout.creator_id);

    // In production, this would use Stripe Connect to transfer funds
    // For now, we simulate successful processing
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Simulated transfer ID (in production, use stripe.transfers.create())
    const transferId = `tr_simulated_${Date.now()}`;
    
    logStep("Transfer created", { transferId });

    // Mark as completed
    const { error: updateError } = await supabaseClient
      .from("payouts")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        stripe_transfer_id: transferId,
      })
      .eq("id", body.payout_id);

    if (updateError) {
      throw new Error("Failed to update payout status");
    }

    logStep("Payout marked as completed");

    // Send notification email
    if (authUser?.user?.email) {
      try {
        await supabaseClient.functions.invoke("send-payout-notification", {
          body: {
            payout_id: body.payout_id,
            to_email: authUser.user.email,
            creator_name: profile?.display_name || "Creator",
            event_title: event?.title || "Event",
            amount_cents: payout.amount_cents,
            status: "completed",
            completed_date: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          },
        });
        logStep("Notification email sent");
      } catch (emailError) {
        console.error("Failed to send notification:", emailError);
        // Don't fail the payout if email fails
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      payout_id: body.payout_id,
      transfer_id: transferId 
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
