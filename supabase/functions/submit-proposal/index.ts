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

      // Send welcome email with magic link
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      const siteUrl = Deno.env.get("SITE_URL") || "https://epzdbinxjqhjjgrhynpr.lovable.app";
      
      // Generate magic link for the user
      const { data: linkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: email,
        options: {
          redirectTo: `${siteUrl}/portal`,
        },
      });

      if (magicLinkError) {
        console.error("Error generating magic link:", magicLinkError);
      } else if (linkData?.properties?.action_link) {
        // Send the email via Resend
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Clubless Collective <onboarding@resend.dev>",
              to: [email],
              subject: "Welcome to Clubless Collective! Access Your Dashboard",
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0f; color: #ffffff;">
                  <h1 style="color: #bb86fc; margin-bottom: 24px;">Welcome to Clubless Collective, ${submission.submitter_name}!</h1>
                  <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                    Your event proposal for <strong style="color: #ffffff;">${submission.city}</strong> has been submitted successfully.
                  </p>
                  <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                    Click the button below to access your Host Portal and track your proposal:
                  </p>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${linkData.properties.action_link}" 
                       style="background: linear-gradient(135deg, #bb86fc, #ff6bcb); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                      Access Your Dashboard
                    </a>
                  </div>
                  <p style="color: #71717a; font-size: 14px;">
                    This link will expire in 24 hours. If you didn't submit an event proposal, you can safely ignore this email.
                  </p>
                  <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;" />
                  <p style="color: #52525b; font-size: 12px; text-align: center;">
                    Clubless Collective — Host your event, keep your profit.
                  </p>
                </div>
              `,
            }),
          });
          
          if (res.ok) {
            console.log("Welcome email sent to:", email);
          } else {
            const errorData = await res.json();
            console.error("Resend API error:", errorData);
          }
        } catch (emailError) {
          console.error("Error sending welcome email:", emailError);
        }
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
