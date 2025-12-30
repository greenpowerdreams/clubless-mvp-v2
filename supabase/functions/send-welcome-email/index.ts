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
const SITE_URL = "https://clublesscollective.com";

// Input validation schema
const WelcomeEmailRequestSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  user_id: z.string().uuid("Invalid user ID"),
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

// Check for duplicate welcome emails (idempotency)
async function hasWelcomeEmailBeenSent(supabase: any, email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("email_logs")
      .select("id")
      .eq("to_email", email.toLowerCase())
      .eq("template_name", "welcome")
      .eq("status", "sent")
      .limit(1);
    
    if (error) {
      console.error("Error checking for duplicate welcome email:", error);
      return false; // Proceed if we can't check
    }
    
    return data && data.length > 0;
  } catch (err) {
    console.error("Exception checking for duplicate:", err);
    return false;
  }
}

// Send admin notification (non-blocking)
async function sendAdminNotification(
  supabase: any,
  RESEND_API_KEY: string,
  userEmail: string,
  userName: string
) {
  const adminLink = `${SITE_URL}/admin`;
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
        text: `Hey Andrew,

A new user just created an account on Clubless Collective.

Name: ${userName}
Email: ${userEmail}
Signup time: ${createdAt}

View in admin: ${adminLink}

— Clubless System`,
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
      await logEmail(supabase, ADMIN_EMAIL, "admin_signup_notification", "sent", resData.id, undefined, { 
        trigger: "signup", 
        user_email: userEmail 
      });
    } else {
      console.error("send_admin_notification: Failed to send:", resData);
      await logEmail(supabase, ADMIN_EMAIL, "admin_signup_notification", "failed", undefined, resData.message, { 
        trigger: "signup", 
        user_email: userEmail 
      });
    }
  } catch (error) {
    console.error("send_admin_notification: Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await logEmail(supabase, ADMIN_EMAIL, "admin_signup_notification", "failed", undefined, errorMessage, { 
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
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  // Service role client for all operations (no JWT required - function is called internally)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
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
    console.error("send_welcome_email: Invalid JSON in request:", e);
    return new Response(
      JSON.stringify({ success: false, error: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // Validate input with Zod schema
  const validationResult = WelcomeEmailRequestSchema.safeParse(rawBody);
  
  if (!validationResult.success) {
    const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    console.error("send_welcome_email: Validation failed:", errors);
    return new Response(
      JSON.stringify({ success: false, error: `Validation failed: ${errors}` }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const { email, name, user_id } = validationResult.data;

  // Verify user exists in auth.users using service role
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
  
  if (userError || !userData.user) {
    console.error("send_welcome_email: User not found:", user_id, userError?.message);
    return new Response(
      JSON.stringify({ success: false, error: "User not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // Verify email matches
  if (userData.user.email?.toLowerCase() !== email.toLowerCase()) {
    console.error("send_welcome_email: Email mismatch - db:", userData.user.email, "requested:", email);
    return new Response(
      JSON.stringify({ success: false, error: "Email mismatch" }),
      { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // Idempotency check: skip if welcome email already sent
  const alreadySent = await hasWelcomeEmailBeenSent(supabase, email);
  if (alreadySent) {
    console.log("send_welcome_email: Welcome email already sent to:", email);
    return new Response(
      JSON.stringify({ success: true, message: "Welcome email already sent", skipped: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const firstName = name.split(" ")[0] || "there";
  const portalLink = `${SITE_URL}/portal`;

  console.log("send_welcome_email: Sending to:", email);

  // Log attempt
  await logEmail(supabase, email, "welcome", "attempted", undefined, undefined, { user_id });

  // Send admin notification in background (non-blocking)
  EdgeRuntime.waitUntil(sendAdminNotification(supabase, RESEND_API_KEY, email, name));

  try {
    // Personal welcome email from Andrew - EXACT copy as specified
    const plainText = `Hey ${firstName},

Thanks for taking this step. You're taking back control as a creative — the venue, the money, the experience — all on your terms.

Your account is ready. You can submit events and track everything here:
${portalLink}

If you ever need help, just reply to this email.

— Andrew`;

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
        subject: "Welcome to Clubless Collective",
        text: plainText,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.7;">
  <p style="font-size: 17px; margin-bottom: 20px;">Hey ${firstName},</p>
  
  <p style="font-size: 17px; margin-bottom: 20px;">Thanks for taking this step. You're taking back control as a creative — the venue, the money, the experience — all on your terms.</p>
  
  <p style="font-size: 17px; margin-bottom: 20px;">Your account is ready. You can submit events and track everything here:<br/>
  <a href="${portalLink}" style="color: #7c3aed;">${portalLink}</a></p>
  
  <p style="font-size: 17px; margin-bottom: 20px;">If you ever need help, just reply to this email.</p>
  
  <p style="font-size: 17px; margin-bottom: 4px;">— Andrew</p>
</div>
        `,
      }),
    });

    const resData = await res.json();

    if (res.ok) {
      console.log("send_welcome_email: Email sent successfully to:", email, "message_id:", resData.id);
      await logEmail(supabase, email, "welcome", "sent", resData.id, undefined, { user_id });
      
      return new Response(
        JSON.stringify({ success: true, message_id: resData.id }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else {
      console.error("send_welcome_email: Resend API error:", resData);
      await logEmail(supabase, email, "welcome", "failed", undefined, resData.message, { user_id });
      
      return new Response(
        JSON.stringify({ success: false, error: resData.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  } catch (error) {
    console.error("send_welcome_email: Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await logEmail(supabase, email, "welcome", "failed", undefined, errorMessage, { user_id });
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
