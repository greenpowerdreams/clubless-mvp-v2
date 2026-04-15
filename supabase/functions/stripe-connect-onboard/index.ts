import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-CONNECT-ONBOARD] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // JWT auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse body
    const body = await req.json().catch(() => ({}));
    const origin = req.headers.get("origin") ?? "https://clublesscollective.com";
    const return_url: string = body.return_url || `${origin}/settings/payments?onboarding=complete`;
    const refresh_url: string = body.refresh_url || `${origin}/settings/payments`;

    // Fetch profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, stripe_account_id, stripe_onboarding_complete")
      .eq("id", user.id)
      .single();
    if (profileError) throw new Error(`Profile lookup failed: ${profileError.message}`);
    logStep("Profile loaded", { hasStripeAccount: !!profile.stripe_account_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let accountId = profile.stripe_account_id as string | null;

    // Create Stripe Express account if needed
    if (!accountId) {
      logStep("Creating new Stripe Express account");
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { supabase_user_id: user.id },
      });
      accountId = account.id;

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", user.id);
      if (updateError) throw new Error(`Failed to persist stripe_account_id: ${updateError.message}`);
      logStep("Stripe account created and persisted", { accountId });
    }

    // Refresh status from Stripe
    const account = await stripe.accounts.retrieve(accountId);
    const onboardingComplete =
      account.charges_enabled && account.details_submitted && account.payouts_enabled;
    logStep("Account status retrieved", {
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted,
      payouts_enabled: account.payouts_enabled,
      onboardingComplete,
    });

    // Sync status to DB if changed
    if (onboardingComplete !== profile.stripe_onboarding_complete) {
      const { error: syncError } = await supabaseAdmin
        .from("profiles")
        .update({ stripe_onboarding_complete: onboardingComplete })
        .eq("id", user.id);
      if (syncError) logStep("Warning: failed to sync onboarding status", { error: syncError.message });
      else logStep("Synced onboarding status", { onboardingComplete });
    }

    // Branch: manage (already onboarded) vs onboard
    let url: string;
    let status: "active" | "onboarding";
    if (onboardingComplete) {
      const loginLink = await stripe.accounts.createLoginLink(accountId);
      url = loginLink.url;
      status = "active";
      logStep("Returning login link for active account");
    } else {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        return_url,
        refresh_url,
        type: "account_onboarding",
      });
      url = accountLink.url;
      status = "onboarding";
      logStep("Returning onboarding link");
    }

    return new Response(
      JSON.stringify({ url, status, account_id: accountId, onboarding_complete: onboardingComplete }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
