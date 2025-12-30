import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Declare EdgeRuntime for background tasks
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "aj33green7@gmail.com";

// Input validation schema
const ProposalSubmissionSchema = z.object({
  submitter_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  submitter_email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  instagram_handle: z.string().max(50, "Instagram handle too long").optional().nullable(),
  city: z.string().trim().min(2, "City must be at least 2 characters").max(100, "City name too long"),
  event_concept: z.string().trim().min(20, "Event concept must be at least 20 characters").max(5000, "Event concept too long"),
  preferred_event_date: z.string().min(1, "Preferred event date is required"),
  fee_model: z.enum(["service-fee", "profit-share"], { errorMap: () => ({ message: "Invalid fee model" }) }),
  full_calculator_json: z.record(z.unknown()).optional().nullable(),
  projected_revenue: z.number().nonnegative("Revenue cannot be negative").optional().nullable(),
  projected_costs: z.number().nonnegative("Costs cannot be negative").optional().nullable(),
  projected_profit: z.number().optional().nullable(),
  user_id: z.string().uuid("Invalid user ID").optional().nullable(),
});

type ProposalSubmission = z.infer<typeof ProposalSubmissionSchema>;

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour window
const MAX_SUBMISSIONS_PER_WINDOW = 5; // Max 5 submissions per hour per user/email

// Rate limiter using Deno KV
async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const kv = await Deno.openKv();
  const key = ["rate_limit", "submit_proposal", identifier];
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  
  // Get existing submissions in the window
  const entry = await kv.get<{ timestamps: number[] }>(key);
  const timestamps = entry.value?.timestamps ?? [];
  
  // Filter to only timestamps within the current window
  const recentTimestamps = timestamps.filter(ts => ts > windowStart);
  
  if (recentTimestamps.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    // Rate limit exceeded
    const oldestInWindow = Math.min(...recentTimestamps);
    const resetAt = oldestInWindow + RATE_LIMIT_WINDOW_MS;
    kv.close();
    return { allowed: false, remaining: 0, resetAt };
  }
  
  // Add current timestamp and save
  recentTimestamps.push(now);
  await kv.set(key, { timestamps: recentTimestamps }, { expireIn: RATE_LIMIT_WINDOW_MS });
  kv.close();
  
  return { 
    allowed: true, 
    remaining: MAX_SUBMISSIONS_PER_WINDOW - recentTimestamps.length,
    resetAt: now + RATE_LIMIT_WINDOW_MS
  };
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

// Helper to log emails
async function logEmail(
  supabase: any,
  toEmail: string,
  templateName: string,
  status: string,
  providerMessageId?: string,
  error?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await supabase.from("email_logs").insert({
      to_email: toEmail,
      template_name: templateName,
      status,
      provider_message_id: providerMessageId,
      error: error,
      metadata: metadata,
    });
  } catch (err) {
    console.error("Failed to log email:", err);
  }
}

// Send admin notification for new event submission (non-blocking)
async function sendAdminEventNotification(
  supabase: any,
  RESEND_API_KEY: string,
  submission: ProposalSubmission,
  proposalId: string
) {
  const siteUrl = Deno.env.get("SITE_URL") || "https://clublesscollective.lovable.app";
  const adminLink = `${siteUrl}/admin`;
  const feeModelLabel = submission.fee_model === "profit-share" ? "Profit Share (50/50)" : "Service Fee (15%)";
  const projectedProfitText = submission.projected_profit 
    ? `$${submission.projected_profit.toLocaleString()}` 
    : "TBD";

  try {
    console.log("send_admin_notification: Sending event submission notification to admin");
    
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Clubless Collective System <andrew@clublesscollective.com>",
        reply_to: "andrew@clublesscollective.com",
        to: [ADMIN_EMAIL],
        subject: `New event submitted – ${submission.city} | ${submission.preferred_event_date}`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hey Andrew,</p>
  
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">A new event proposal was just submitted.</p>
  
  <div style="background: #f8f8f8; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 15px; line-height: 1.8;">
    <strong>Submitted by:</strong> ${submission.submitter_name}<br/>
    <strong>Email:</strong> ${submission.submitter_email}<br/>
    <strong>City:</strong> ${submission.city}<br/>
    <strong>Preferred date:</strong> ${submission.preferred_event_date}<br/>
    <strong>Projected profit:</strong> ${projectedProfitText}<br/>
    <strong>Fee model:</strong> ${feeModelLabel}
  </div>
  
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Review and respond here:<br/>
  <a href="${adminLink}" style="color: #7c3aed;">${adminLink}</a></p>
  
  <p style="font-size: 14px; color: #888; margin-top: 24px;">— Clubless System</p>
</div>
        `,
      }),
    });

    const resData = await res.json();

    if (res.ok) {
      console.log("send_admin_notification: Event notification sent to admin");
      await logEmail(supabase, ADMIN_EMAIL, "admin_notification", "sent", resData.id, undefined, { 
        trigger: "event_submission", 
        proposal_id: proposalId,
        submitter_email: submission.submitter_email
      });
    } else {
      console.error("send_admin_notification: Failed to send:", resData);
      await logEmail(supabase, ADMIN_EMAIL, "admin_notification", "failed", undefined, resData.message, { 
        trigger: "event_submission", 
        proposal_id: proposalId,
        submitter_email: submission.submitter_email
      });
    }
  } catch (error) {
    console.error("send_admin_notification: Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await logEmail(supabase, ADMIN_EMAIL, "admin_notification", "failed", undefined, errorMessage, { 
      trigger: "event_submission", 
      proposal_id: proposalId,
      submitter_email: submission.submitter_email
    });
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

  let rawBody: unknown;
  
  try {
    rawBody = await req.json();
  } catch (e) {
    console.error("Invalid JSON in request:", e);
    return new Response(
      JSON.stringify({ success: false, error: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // Validate input with Zod schema
  const validationResult = ProposalSubmissionSchema.safeParse(rawBody);
  
  if (!validationResult.success) {
    const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    console.error("Validation failed:", errors);
    return new Response(
      JSON.stringify({ success: false, error: `Validation failed: ${errors}` }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const submission = validationResult.data;
  const email = submission.submitter_email.toLowerCase();
  const firstName = submission.submitter_name.split(" ")[0] || "there";

  console.log("submit_proposal: Received submission", { email, city: submission.city, user_id: submission.user_id });

  // Use the user_id passed from frontend (user is already logged in)
  const userId = submission.user_id || null;

  // Rate limiting: use user_id if available, otherwise fall back to email
  const rateLimitIdentifier = userId || email;
  
  try {
    const rateLimitResult = await checkRateLimit(rateLimitIdentifier);
    
    if (!rateLimitResult.allowed) {
      const resetDate = new Date(rateLimitResult.resetAt);
      console.warn("submit_proposal: Rate limit exceeded for:", rateLimitIdentifier);
      
      await logError(supabase, "rate_limit_exceeded", email, userId, "Too many submissions", {
        identifier: rateLimitIdentifier,
        reset_at: resetDate.toISOString()
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Too many submissions. Please wait before submitting another proposal.",
          retry_after: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
            ...corsHeaders 
          } 
        }
      );
    }
    
    console.log("submit_proposal: Rate limit check passed, remaining:", rateLimitResult.remaining);
  } catch (rateLimitError) {
    // If rate limiting fails, log but continue (fail open for better UX)
    console.error("submit_proposal: Rate limit check failed, continuing:", rateLimitError);
  }

  let emailSent = false;
  let emailError: string | undefined = undefined;

  try {
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

    // Send admin notification in background (non-blocking)
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY) {
      EdgeRuntime.waitUntil(sendAdminEventNotification(supabase, RESEND_API_KEY, submission, proposal.id));
    }

    // Send confirmation email to user
    const siteUrl = Deno.env.get("SITE_URL") || "https://clublesscollective.lovable.app";
    const portalLink = `${siteUrl}/portal/events/${proposal.id}`;
    const feeModelLabel = submission.fee_model === "profit-share" ? "Profit Share (50/50)" : "Service Fee (15%)";
    const projectedProfitText = submission.projected_profit 
      ? `$${submission.projected_profit.toLocaleString()}` 
      : "TBD";

    if (RESEND_API_KEY) {
      try {
        console.log("send_email: Sending confirmation email to:", email);
        
        // Personal, plain-text style email from Andrew
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Andrew Green <andrew@clublesscollective.com>",
            reply_to: "andrew@clublesscollective.com",
            to: [email],
            subject: `Got your event proposal for ${submission.city}`,
            html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hey ${firstName},</p>
  
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Just confirming I got your event proposal. Here are the details:</p>
  
  <div style="background: #f8f8f8; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 15px; line-height: 1.8;">
    <strong>City:</strong> ${submission.city}<br/>
    <strong>Preferred Date:</strong> ${submission.preferred_event_date}<br/>
    <strong>Fee Model:</strong> ${feeModelLabel}<br/>
    <strong>Projected Profit:</strong> ${projectedProfitText}
  </div>
  
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">I review every submission personally. You will hear back from me within 48 hours.</p>
  
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Track your proposal here:<br/>
  <a href="${portalLink}" style="color: #7c3aed;">${portalLink}</a></p>
  
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 8px;">Talk soon,</p>
  <p style="font-size: 16px; line-height: 1.6; margin: 0;"><strong>Andrew</strong></p>
  
  <p style="font-size: 13px; color: #888; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
    Clubless Collective — Host your event, keep your profit.
  </p>
</div>
            `,
          }),
        });
        
        const resData = await res.json();
        
        if (res.ok) {
          console.log("send_email: Confirmation email sent successfully to:", email);
          emailSent = true;
          await logEmail(supabase, email, "event_submission_confirmation", "sent", resData.id);
        } else {
          console.error("send_email: Resend API error:", resData);
          emailError = resData.message || "Email sending failed";
          await logEmail(supabase, email, "event_submission_confirmation", "failed", undefined, emailError);
        }
      } catch (emailErr) {
        console.error("send_email: Error in email flow:", emailErr);
        emailError = emailErr instanceof Error ? emailErr.message : "Unknown email error";
        await logEmail(supabase, email, "event_submission_confirmation", "failed", undefined, emailError);
      }
    } else {
      console.error("send_email: RESEND_API_KEY not configured");
      emailError = "Email service not configured";
    }

    return new Response(
      JSON.stringify({
        success: true,
        proposal_id: proposal.id,
        email_sent: emailSent,
        message: emailSent 
          ? "Proposal submitted! Check your email for confirmation." 
          : "Proposal submitted! View your dashboard to track status.",
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
