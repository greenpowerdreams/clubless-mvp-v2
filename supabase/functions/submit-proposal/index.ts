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

// Helper to log errors to the error_logs table
async function logError(
  supabase: any,
  eventType: string,
  email: string | null,
  userId: string | null,
  errorMessage: string,
  details?: Record<string, unknown>
) {
  try {
    await supabase.from("error_logs").insert({
      event_type: eventType,
      user_email: email,
      user_id: userId,
      error_message: errorMessage,
      details: details || null,
    });
  } catch (logError) {
    console.error("Failed to log error:", logError);
  }
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let submission: ProposalSubmission;
  
  try {
    submission = await req.json();
  } catch (e) {
    console.error("Invalid JSON in request:", e);
    return new Response(
      JSON.stringify({ success: false, error: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const email = submission.submitter_email?.toLowerCase().trim();
  
  if (!email || !submission.submitter_name || !submission.city || !submission.event_concept || !submission.preferred_event_date || !submission.fee_model) {
    console.error("Missing required fields:", { email, name: submission.submitter_name, city: submission.city });
    return new Response(
      JSON.stringify({ success: false, error: "Missing required fields" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  console.log("submit_proposal: Received submission", { email, city: submission.city });

  let userId: string | null = null;
  let isNewUser = false;
  let emailSent = false;
  let emailError: string | null = null;

  try {
    // Check if user already exists
    console.log("submit_proposal: Looking up existing users");
    const { data: existingUsers, error: lookupError } = await supabase.auth.admin.listUsers();
    
    if (lookupError) {
      console.error("submit_proposal: Error looking up users:", lookupError);
      await logError(supabase, "user_lookup_failed", email, null, lookupError.message);
      throw lookupError;
    }

    const existingUser = existingUsers.users.find(
      (u) => u.email?.toLowerCase() === email
    );

    if (existingUser) {
      console.log("submit_proposal: Found existing user:", existingUser.id);
      userId = existingUser.id;
    } else {
      // Create new user with magic link
      console.log("create_or_link_user: Creating new user for:", email);
      
      const tempPassword = crypto.randomUUID();
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: false,
        user_metadata: {
          full_name: submission.submitter_name,
        },
      });

      if (createError) {
        console.error("create_or_link_user: Error creating user:", createError);
        await logError(supabase, "user_creation_failed", email, null, createError.message);
        throw createError;
      }

      userId = newUser.user.id;
      isNewUser = true;
      console.log("create_or_link_user: Created new user:", userId);

      // Generate and send magic link email
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      const siteUrl = Deno.env.get("SITE_URL") || "https://clublesscollective.lovable.app";
      
      try {
        const { data: linkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: email,
          options: {
            redirectTo: `${siteUrl}/portal`,
          },
        });

        if (magicLinkError) {
          console.error("send_email: Error generating magic link:", magicLinkError);
          emailError = magicLinkError.message;
        } else if (linkData?.properties?.action_link && RESEND_API_KEY) {
          console.log("send_email: Sending welcome email to:", email);
          
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Andrew @ Clubless Collective <andrew@clublesscollective.com>",
              reply_to: "andrew@clublesscollective.com",
              to: [email],
              subject: "Welcome to Clubless Collective! Access Your Dashboard",
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0f; color: #ffffff;">
                  <h1 style="color: #bb86fc; margin-bottom: 24px;">Welcome to Clubless Collective, ${submission.submitter_name}!</h1>
                  <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                    Your event proposal for <strong style="color: #ffffff;">${submission.city}</strong> has been submitted successfully.
                  </p>
                  <div style="background: #1a1a2e; border-radius: 12px; padding: 16px; margin: 20px 0;">
                    <p style="color: #a1a1aa; font-size: 14px; margin: 0;">
                      <strong style="color: #ffffff;">Event Date:</strong> ${submission.preferred_event_date}<br/>
                      <strong style="color: #ffffff;">Fee Model:</strong> ${submission.fee_model === 'profit-share' ? 'Profit Share (50/50)' : 'Service Fee (15%)'}<br/>
                      ${submission.projected_profit ? `<strong style="color: #ffffff;">Projected Profit:</strong> $${submission.projected_profit.toLocaleString()}` : ''}
                    </p>
                  </div>
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
            console.log("send_email: Welcome email sent successfully to:", email);
            emailSent = true;
          } else {
            const errorData = await res.json();
            console.error("send_email: Resend API error:", errorData);
            emailError = errorData.message || "Email sending failed";
            await logError(supabase, "email_send_failed", email, userId, emailError || "Unknown email error", { resendError: errorData });
          }
        } else if (!RESEND_API_KEY) {
          console.error("send_email: RESEND_API_KEY not configured");
          emailError = "Email service not configured";
          await logError(supabase, "email_config_error", email, userId, "RESEND_API_KEY not configured");
        }
      } catch (emailErr) {
        console.error("send_email: Error in email flow:", emailErr);
        emailError = emailErr instanceof Error ? emailErr.message : "Unknown email error";
        await logError(supabase, "email_exception", email, userId, emailError);
      }
    }

    // Insert the proposal with user_id
    console.log("submit_proposal: Inserting proposal for user:", userId);
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
      console.error("submit_proposal: Error inserting proposal:", insertError);
      await logError(supabase, "proposal_insert_failed", email, userId, insertError.message, { 
        code: insertError.code,
        details: insertError.details 
      });
      throw insertError;
    }

    console.log("submit_proposal: Proposal created successfully:", proposal.id);

    // Determine response message based on email status
    let message: string;
    if (isNewUser && emailSent) {
      message = "Check your email to access your dashboard.";
    } else if (isNewUser && !emailSent) {
      message = "Proposal submitted! Email delivery pending - please use the portal login to access your dashboard.";
    } else {
      message = "Proposal submitted! Sign in to view your dashboard.";
    }

    return new Response(
      JSON.stringify({
        success: true,
        proposal_id: proposal.id,
        is_new_user: isNewUser,
        email_sent: emailSent,
        message,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("submit_proposal: Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
