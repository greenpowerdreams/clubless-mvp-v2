import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Valid status values
const validStatuses = ["submitted", "under_review", "needs_info", "approved", "published", "completed", "rejected"] as const;

// Input validation schema
const StatusEmailRequestSchema = z.object({
  proposal_id: z.string().uuid("Invalid proposal ID format"),
  new_status: z.enum(validStatuses, { errorMap: () => ({ message: "Invalid status value" }) }),
  status_notes: z.string().max(2000, "Status notes too long").optional().nullable(),
});

type StatusEmailRequest = z.infer<typeof StatusEmailRequestSchema>;

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

// Verify admin role
async function verifyAdminRole(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return !!data;
  } catch (error) {
    console.error("Failed to verify admin role:", error);
    return false;
  }
}

// Status-specific email content - personal, plain-text style
const getStatusEmail = (
  status: string,
  firstName: string,
  city: string,
  portalLink: string,
  statusNotes?: string
): { subject: string; body: string } | null => {
  const notesSection = statusNotes 
    ? `<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;"><strong>Notes:</strong> ${statusNotes}</p>` 
    : "";

  switch (status) {
    case "under_review":
      return {
        subject: `Your ${city} event is under review`,
        body: `
<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hey ${firstName},</p>

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Good news — I am reviewing your event proposal for ${city}. I will be in touch within the next 24-48 hours with next steps.</p>

${notesSection}

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Track your proposal here:<br/>
<a href="${portalLink}" style="color: #7c3aed;">${portalLink}</a></p>

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 8px;">— Andrew</p>
        `,
      };

    case "needs_info":
      return {
        subject: `Quick question about your ${city} event`,
        body: `
<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hey ${firstName},</p>

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">I have been looking at your ${city} event proposal and have a few questions before we can move forward.</p>

${notesSection}

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Just reply to this email with the details and I will get back to you quickly.</p>

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Your proposal:<br/>
<a href="${portalLink}" style="color: #7c3aed;">${portalLink}</a></p>

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 8px;">— Andrew</p>
        `,
      };

    case "approved":
      return {
        subject: `Your ${city} event is approved!`,
        body: `
<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hey ${firstName},</p>

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Great news — your event in ${city} is approved! We are moving forward.</p>

${notesSection}

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">I will be setting up your Eventbrite page shortly and will send you the link once it is live.</p>

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">View your dashboard:<br/>
<a href="${portalLink}" style="color: #7c3aed;">${portalLink}</a></p>

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 8px;">— Andrew</p>
        `,
      };

    case "published":
      return {
        subject: `Your ${city} event is LIVE!`,
        body: `
<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hey ${firstName},</p>

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Your event in ${city} is now live and tickets are on sale!</p>

${notesSection}

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Time to start promoting. Share the event link with your audience and let us make this happen.</p>

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">View your event details:<br/>
<a href="${portalLink}" style="color: #7c3aed;">${portalLink}</a></p>

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 8px;">— Andrew</p>
        `,
      };

    case "completed":
      return {
        subject: `Congrats on your ${city} event!`,
        body: `
<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hey ${firstName},</p>

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Your event in ${city} is complete. You did it!</p>

${notesSection}

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Check your dashboard for the final numbers. Your payout will be processed within 5 business days.</p>

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">View your stats:<br/>
<a href="${portalLink}" style="color: #7c3aed;">${portalLink}</a></p>

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Ready for the next one? I am here when you are.</p>

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 8px;">— Andrew</p>
        `,
      };

    case "rejected":
      return {
        subject: `Update on your ${city} event proposal`,
        body: `
<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hey ${firstName},</p>

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">I reviewed your ${city} event proposal and unfortunately we can not move forward with this one right now.</p>

${notesSection}

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">This is not the end — if you have other ideas or want to adjust your concept, reply to this email and let us talk.</p>

<p style="font-size: 16px; line-height: 1.6; margin-bottom: 8px;">— Andrew</p>
        `,
      };

    default:
      return null;
  }
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  // ============================================
  // AUTHENTICATION CHECK - Admin only
  // ============================================
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    console.error("send_status_email: No authorization header");
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // Create client with user's auth token to verify identity
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
  if (authError || !user) {
    console.error("send_status_email: Invalid auth token:", authError?.message);
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // Verify admin role using service role client
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const isAdmin = await verifyAdminRole(supabaseAdmin, user.id);
  if (!isAdmin) {
    console.error("send_status_email: User is not admin:", user.id);
    return new Response(
      JSON.stringify({ success: false, error: "Forbidden - Admin access required" }),
      { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  console.log("send_status_email: Admin verified:", user.email);
  // ============================================

  if (!RESEND_API_KEY) {
    console.error("send_status_email: RESEND_API_KEY not configured");
    return new Response(
      JSON.stringify({ success: false, error: "Email service not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

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
  const validationResult = StatusEmailRequestSchema.safeParse(rawBody);
  
  if (!validationResult.success) {
    const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    console.error("Validation failed:", errors);
    return new Response(
      JSON.stringify({ success: false, error: `Validation failed: ${errors}` }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const { proposal_id, new_status, status_notes } = validationResult.data;

  try {
    console.log("send_status_email: Processing", { proposal_id, new_status, admin: user.email });

    // Fetch proposal details using service role
    const { data: proposal, error: fetchError } = await supabaseAdmin
      .from("event_proposals")
      .select("submitter_name, submitter_email, city, id")
      .eq("id", proposal_id)
      .single();

    if (fetchError || !proposal) {
      console.error("send_status_email: Proposal not found:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Proposal not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const firstName = proposal.submitter_name?.split(" ")[0] || "there";
    const siteUrl = Deno.env.get("SITE_URL") || "https://clublesscollective.lovable.app";
    const portalLink = `${siteUrl}/portal/events/${proposal.id}`;

    const emailContent = getStatusEmail(new_status, firstName, proposal.city, portalLink, status_notes ?? undefined);
    
    if (!emailContent) {
      console.log("send_status_email: No email template for status:", new_status);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "No template for status" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Andrew Green <andrew@clublesscollective.com>",
        reply_to: "andrew@clublesscollective.com",
        to: [proposal.submitter_email],
        subject: emailContent.subject,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  ${emailContent.body}
  
  <p style="font-size: 13px; color: #888; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
    Clubless Collective — Host your event, keep your profit.
  </p>
</div>
        `,
      }),
    });

    const resData = await res.json();

    if (res.ok) {
      console.log("send_status_email: Email sent successfully to:", proposal.submitter_email);
      await logEmail(supabaseAdmin, proposal.submitter_email, `status_${new_status}`, "sent", resData.id, undefined, { proposal_id, new_status });
      
      return new Response(
        JSON.stringify({ success: true, message_id: resData.id }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else {
      console.error("send_status_email: Resend API error:", resData);
      await logEmail(supabaseAdmin, proposal.submitter_email, `status_${new_status}`, "failed", undefined, resData.message, { proposal_id, new_status });
      
      // Log to error_logs (no user_email for PII protection)
      await supabaseAdmin.from("error_logs").insert({
        event_type: "status_email_failed",
        error_message: resData.message || "Failed to send status email",
        details: { proposal_id, new_status, resendError: resData },
      });

      return new Response(
        JSON.stringify({ success: false, error: resData.message }),
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
