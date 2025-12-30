import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusEmailRequest {
  proposal_id: string;
  new_status: string;
  status_notes?: string;
}

const STATUS_SUBJECTS: Record<string, string> = {
  under_review: "Your Event Proposal is Under Review",
  needs_info: "Action Required: We Need More Information",
  approved: "Congratulations! Your Event is Approved",
  published: "Your Event is Now Live!",
  completed: "Thank You for Hosting with Clubless Collective",
  rejected: "Update on Your Event Proposal",
};

const STATUS_MESSAGES: Record<string, (name: string, city: string, notes?: string) => string> = {
  under_review: (name, city) => `
    <p>Hi ${name},</p>
    <p>Great news! Your event proposal for <strong>${city}</strong> is now under review by our team.</p>
    <p>We'll be in touch within 24-48 hours with next steps.</p>
  `,
  needs_info: (name, city, notes) => `
    <p>Hi ${name},</p>
    <p>We're reviewing your event proposal for <strong>${city}</strong> and need a bit more information before we can proceed.</p>
    ${notes ? `<div style="background: #1a1a2e; border-radius: 8px; padding: 16px; margin: 16px 0;"><p style="margin: 0;"><strong>Details needed:</strong> ${notes}</p></div>` : ''}
    <p>Please reply to this email with the requested information, or log in to your Host Portal for more details.</p>
  `,
  approved: (name, city) => `
    <p>Hi ${name},</p>
    <p>🎉 Congratulations! Your event proposal for <strong>${city}</strong> has been approved!</p>
    <p>Our team will be in touch shortly to discuss next steps, including venue confirmation and ticketing setup.</p>
    <p>Log in to your Host Portal to see your updated status and prepare for your event.</p>
  `,
  published: (name, city) => `
    <p>Hi ${name},</p>
    <p>Your event in <strong>${city}</strong> is now live and tickets are on sale!</p>
    <p>Here's what you can do now:</p>
    <ul>
      <li>Share your event link with your network</li>
      <li>Promote on social media</li>
      <li>Track ticket sales in your Host Portal</li>
    </ul>
    <p>Let's make this event unforgettable!</p>
  `,
  completed: (name, city) => `
    <p>Hi ${name},</p>
    <p>Thank you for hosting your event in <strong>${city}</strong> with Clubless Collective!</p>
    <p>Your payout has been processed and should arrive within 72 hours.</p>
    <p>We'd love to hear how it went. Your feedback helps us improve for future events.</p>
    <p>Ready to host another event? Head to your Host Portal to get started!</p>
  `,
  rejected: (name, city, notes) => `
    <p>Hi ${name},</p>
    <p>Thank you for your interest in hosting an event in <strong>${city}</strong> with Clubless Collective.</p>
    <p>Unfortunately, we're unable to move forward with this proposal at this time.</p>
    ${notes ? `<div style="background: #1a1a2e; border-radius: 8px; padding: 16px; margin: 16px 0;"><p style="margin: 0;"><strong>Reason:</strong> ${notes}</p></div>` : ''}
    <p>If you have questions or would like to submit a different proposal, please don't hesitate to reach out.</p>
  `,
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (!RESEND_API_KEY) {
    console.error("send_status_email: RESEND_API_KEY not configured");
    return new Response(
      JSON.stringify({ success: false, error: "Email service not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { proposal_id, new_status, status_notes }: StatusEmailRequest = await req.json();

    console.log("send_status_email: Processing", { proposal_id, new_status });

    // Fetch proposal details
    const { data: proposal, error: fetchError } = await supabase
      .from("event_proposals")
      .select("submitter_name, submitter_email, city, preferred_event_date")
      .eq("id", proposal_id)
      .single();

    if (fetchError || !proposal) {
      console.error("send_status_email: Proposal not found:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Proposal not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const subject = STATUS_SUBJECTS[new_status] || "Update on Your Event Proposal";
    const messageBuilder = STATUS_MESSAGES[new_status];
    
    if (!messageBuilder) {
      console.log("send_status_email: No email template for status:", new_status);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "No template for status" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const messageContent = messageBuilder(proposal.submitter_name, proposal.city, status_notes);
    const siteUrl = Deno.env.get("SITE_URL") || "https://clublesscollective.lovable.app";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Andrew @ Clubless Collective <andrew@clublesscollective.com>",
        reply_to: "andrew@clublesscollective.com",
        to: [proposal.submitter_email],
        subject: subject,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0f; color: #ffffff;">
            <h1 style="color: #bb86fc; margin-bottom: 24px;">${subject}</h1>
            <div style="color: #a1a1aa; font-size: 16px; line-height: 1.6;">
              ${messageContent}
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${siteUrl}/portal" 
                 style="background: linear-gradient(135deg, #bb86fc, #ff6bcb); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                View in Host Portal
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;" />
            <p style="color: #52525b; font-size: 12px; text-align: center;">
              Clubless Collective — Host your event, keep your profit.
            </p>
          </div>
        `,
      }),
    });

    if (res.ok) {
      console.log("send_status_email: Email sent successfully to:", proposal.submitter_email);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else {
      const errorData = await res.json();
      console.error("send_status_email: Resend API error:", errorData);
      
      // Log to error_logs
      await supabase.from("error_logs").insert({
        event_type: "status_email_failed",
        user_email: proposal.submitter_email,
        error_message: errorData.message || "Failed to send status email",
        details: { proposal_id, new_status, resendError: errorData },
      });

      return new Response(
        JSON.stringify({ success: false, error: errorData.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  } catch (error) {
    console.error("send_status_email: Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
