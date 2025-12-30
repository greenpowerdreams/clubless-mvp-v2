import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProposalSubmission {
  submitter_name: string;
  submitter_email: string;
  instagram_handle?: string;
  city: string;
  event_concept: string;
  preferred_event_date: string;
  fee_model: string;
  full_calculator_json?: Record<string, unknown>;
  projected_revenue?: number;
  projected_costs?: number;
  projected_profit?: number;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const submission: ProposalSubmission = await req.json();
    console.log("Received proposal submission:", { email: submission.submitter_email, city: submission.city });

    const email = submission.submitter_email.toLowerCase().trim();
    let userId: string | null = null;
    let isNewUser = false;

    // Check if user already exists
    const { data: existingUsers, error: lookupError } = await supabase.auth.admin.listUsers();
    
    if (lookupError) {
      console.error("Error looking up users:", lookupError);
      throw lookupError;
    }

    const existingUser = existingUsers.users.find(
      (u) => u.email?.toLowerCase() === email
    );

    if (existingUser) {
      console.log("Found existing user:", existingUser.id);
      userId = existingUser.id;
    } else {
      // Create new user with magic link
      console.log("Creating new user for:", email);
      
      // Generate a random password (user will use magic link to sign in)
      const tempPassword = crypto.randomUUID();
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: false, // Don't auto-confirm, send magic link
        user_metadata: {
          full_name: submission.submitter_name,
        },
      });

      if (createError) {
        console.error("Error creating user:", createError);
        throw createError;
      }

      userId = newUser.user.id;
      isNewUser = true;
      console.log("Created new user:", userId);

      // Send magic link email
      const siteUrl = Deno.env.get("SITE_URL") || supabaseUrl.replace(".supabase.co", ".lovable.app");
      const { error: magicLinkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: email,
        options: {
          redirectTo: `${siteUrl}/portal`,
        },
      });

      if (magicLinkError) {
        console.error("Error sending magic link:", magicLinkError);
        // Don't throw - we still want to save the proposal
      }
    }

    // Insert the proposal with user_id
    const { data: proposal, error: insertError } = await supabase
      .from("event_proposals")
      .insert({
        user_id: userId,
        submitter_name: submission.submitter_name,
        submitter_email: email,
        instagram_handle: submission.instagram_handle || null,
        city: submission.city,
        event_concept: submission.event_concept,
        preferred_event_date: submission.preferred_event_date,
        fee_model: submission.fee_model,
        full_calculator_json: submission.full_calculator_json || null,
        projected_revenue: submission.projected_revenue || null,
        projected_costs: submission.projected_costs || null,
        projected_profit: submission.projected_profit || null,
        status: "submitted",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting proposal:", insertError);
      throw insertError;
    }

    console.log("Proposal created successfully:", proposal.id);

    return new Response(
      JSON.stringify({
        success: true,
        proposal_id: proposal.id,
        is_new_user: isNewUser,
        message: isNewUser 
          ? "Check your email to access your dashboard." 
          : "Proposal submitted! Sign in to view your dashboard.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in submit-proposal:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "An error occurred" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
