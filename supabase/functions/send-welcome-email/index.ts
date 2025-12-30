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

const ADMIN_EMAIL = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "aj33green7@gmail.com";

// Input validation schema
const WelcomeEmailRequestSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
});

type WelcomeEmailRequest = z.infer<typeof WelcomeEmailRequestSchema>;

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

// Send admin notification (non-blocking)
async function sendAdminNotification(
  supabase: any,
  RESEND_API_KEY: string,
  userEmail: string,
  userName: string
) {
  const siteUrl = Deno.env.get("SITE_URL") || "https://clublesscollective.lovable.app";
  const adminLink = `${siteUrl}/admin`;
  const createdAt = new Date().toLocaleString("en-US", { 
    timeZone: "America/Los_Angeles",
    dateStyle: "medium",
    timeStyle: "short"
  });

  try {
    console.log("send_admin_notification: Sending signup notification to admin");
    
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
        subject: `New signup – ${userEmail}`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hey Andrew,</p>
  
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">A new user just created an account on Clubless Collective.</p>
  
  <div style="background: #f8f8f8; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 15px; line-height: 1.8;">
    <strong>Name:</strong> ${userName}<br/>
    <strong>Email:</strong> ${userEmail}<br/>
    <strong>Signup time:</strong> ${createdAt}
  </div>
  
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">View in admin:<br/>
  <a href="${adminLink}" style="color: #7c3aed;">${adminLink}</a></p>
  
  <p style="font-size: 14px; color: #888; margin-top: 24px;">— Clubless System</p>
</div>
        `,
      }),
    });

    const resData = await res.json();

    if (res.ok) {
      console.log("send_admin_notification: Signup notification sent to admin");
      await logEmail(supabase, ADMIN_EMAIL, "admin_notification", "sent", resData.id, undefined, { 
        trigger: "signup", 
        user_email: userEmail 
      });
    } else {
      console.error("send_admin_notification: Failed to send:", resData);
      await logEmail(supabase, ADMIN_EMAIL, "admin_notification", "failed", undefined, resData.message, { 
        trigger: "signup", 
        user_email: userEmail 
      });
    }
  } catch (error) {
    console.error("send_admin_notification: Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await logEmail(supabase, ADMIN_EMAIL, "admin_notification", "failed", undefined, errorMessage, { 
      trigger: "signup", 
      user_email: userEmail 
    });
  }
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  // ============================================
  // AUTHENTICATION CHECK - User must be authenticated
  // ============================================
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    console.error("send_welcome_email: No authorization header");
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
    console.error("send_welcome_email: Invalid auth token:", authError?.message);
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  console.log("send_welcome_email: User verified:", user.email);
  // ============================================

  // Service role client for email logging
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (!RESEND_API_KEY) {
    console.error("send_welcome_email: RESEND_API_KEY not configured");
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
  const validationResult = WelcomeEmailRequestSchema.safeParse(rawBody);
  
  if (!validationResult.success) {
    const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    console.error("Validation failed:", errors);
    return new Response(
      JSON.stringify({ success: false, error: `Validation failed: ${errors}` }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const { email, name } = validationResult.data;

  // ============================================
  // SECURITY: Verify user's email matches requested email
  // Prevent users from sending welcome emails to arbitrary addresses
  // ============================================
  if (user.email?.toLowerCase() !== email.toLowerCase()) {
    console.error("send_welcome_email: Email mismatch - user:", user.email, "requested:", email);
    return new Response(
      JSON.stringify({ success: false, error: "Cannot send welcome email to different address" }),
      { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
  // ============================================

  const firstName = name.split(" ")[0] || "there";
  const siteUrl = Deno.env.get("SITE_URL") || "https://clublesscollective.lovable.app";
  const portalLink = `${siteUrl}/portal`;

  console.log("send_welcome_email: Sending to:", email);

  // Send admin notification in background (non-blocking)
  EdgeRuntime.waitUntil(sendAdminNotification(supabaseAdmin, RESEND_API_KEY, email, name));

  try {
    // Personal welcome email from Andrew - optimized for deliverability
    // Using both HTML and plain text versions to improve deliverability
    const plainText = `Hey ${firstName},

You just took the first step toward reclaiming your power as a creative.

No more splitting the door with venues that do nothing. No more guessing if the numbers will work. No more waiting for permission.

Clubless Collective exists because creatives like you deserve to own the full experience — the event, the audience, the profit. All of it.

Your account is ready. When you have an idea, bring it here:
${portalLink}

We handle the venue, the ticketing, the backend — you bring the vision. And when the night is over, the money goes where it belongs: to you.

If you ever get stuck or just want to talk through an idea, hit reply. This goes straight to my inbox.

Let's build something.

— Andrew
Founder, Clubless Collective`;

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
        subject: "You're in — let's reclaim your power",
        text: plainText,
        html: `
<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.7;">
  <p style="font-size: 17px; margin-bottom: 20px;">Hey ${firstName},</p>
  
  <p style="font-size: 17px; margin-bottom: 20px;"><strong>You just took the first step toward reclaiming your power as a creative.</strong></p>
  
  <p style="font-size: 17px; margin-bottom: 20px;">No more splitting the door with venues that do nothing. No more guessing if the numbers will work. No more waiting for permission.</p>
  
  <p style="font-size: 17px; margin-bottom: 20px;">Clubless Collective exists because creatives like you deserve to own the full experience — the event, the audience, the profit. <em>All of it.</em></p>
  
  <p style="font-size: 17px; margin-bottom: 20px;">Your account is ready. When you have an idea, bring it here:</p>
  
  <p style="margin: 28px 0;">
    <a href="${portalLink}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 28px; text-decoration: none; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; border-radius: 4px;">Open Your Dashboard</a>
  </p>
  
  <p style="font-size: 17px; margin-bottom: 20px;">We handle the venue, the ticketing, the backend — you bring the vision. And when the night is over, the money goes where it belongs: <strong>to you.</strong></p>
  
  <p style="font-size: 17px; margin-bottom: 20px;">If you ever get stuck or just want to talk through an idea, hit reply. This goes straight to my inbox.</p>
  
  <p style="font-size: 17px; margin-bottom: 20px;">Let's build something.</p>
  
  <p style="font-size: 17px; margin-bottom: 4px;">— Andrew</p>
  <p style="font-size: 14px; color: #666; margin-top: 0;">Founder, Clubless Collective</p>
  
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0 16px 0;" />
  <p style="font-size: 13px; color: #888;">
    Clubless Collective · Host your event, keep your profit<br/>
    <a href="${portalLink}" style="color: #888;">clublesscollective.com</a>
  </p>
</div>
        `,
      }),
    });

    const resData = await res.json();

    if (res.ok) {
      console.log("send_welcome_email: Email sent successfully to:", email);
      await logEmail(supabaseAdmin, email, "welcome", "sent", resData.id);
      
      return new Response(
        JSON.stringify({ success: true, message_id: resData.id }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else {
      console.error("send_welcome_email: Resend API error:", resData);
      await logEmail(supabaseAdmin, email, "welcome", "failed", undefined, resData.message);
      
      return new Response(
        JSON.stringify({ success: false, error: resData.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  } catch (error) {
    console.error("send_welcome_email: Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await logEmail(supabaseAdmin, email, "welcome", "failed", undefined, errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
