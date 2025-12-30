import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Declare EdgeRuntime for background tasks
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "aj33green7@gmail.com";

interface WelcomeEmailRequest {
  email: string;
  name: string;
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
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  if (!RESEND_API_KEY) {
    console.error("send_welcome_email: RESEND_API_KEY not configured");
    return new Response(
      JSON.stringify({ success: false, error: "Email service not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  let request: WelcomeEmailRequest;
  
  try {
    request = await req.json();
  } catch (e) {
    console.error("Invalid JSON in request:", e);
    return new Response(
      JSON.stringify({ success: false, error: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const { email, name } = request;
  const firstName = name?.split(" ")[0] || "there";
  const siteUrl = Deno.env.get("SITE_URL") || "https://clublesscollective.lovable.app";
  const portalLink = `${siteUrl}/portal`;

  if (!email) {
    return new Response(
      JSON.stringify({ success: false, error: "Email is required" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  console.log("send_welcome_email: Sending to:", email);

  // Send admin notification in background (non-blocking)
  EdgeRuntime.waitUntil(sendAdminNotification(supabase, RESEND_API_KEY, email, name));

  try {
    // Personal, plain-text style welcome email from Andrew
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
        subject: "Welcome to Clubless Collective",
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hey ${firstName},</p>
  
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Thanks for taking this step. You are taking back control as a creative — the venue, the money, the experience — all on your terms.</p>
  
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Your account is set up. Whenever you are ready, submit an event idea and track it in your dashboard here:</p>
  
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;"><a href="${portalLink}" style="color: #7c3aed;">${portalLink}</a></p>
  
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">If you ever get stuck, just reply to this email and it will come straight to me.</p>
  
  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 8px;">— Andrew</p>
  
  <p style="font-size: 13px; color: #888; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
    Clubless Collective — Host your event, keep your profit.
  </p>
</div>
        `,
      }),
    });

    const resData = await res.json();

    if (res.ok) {
      console.log("send_welcome_email: Email sent successfully to:", email);
      await logEmail(supabase, email, "welcome", "sent", resData.id);
      
      return new Response(
        JSON.stringify({ success: true, message_id: resData.id }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else {
      console.error("send_welcome_email: Resend API error:", resData);
      await logEmail(supabase, email, "welcome", "failed", undefined, resData.message);
      
      return new Response(
        JSON.stringify({ success: false, error: resData.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  } catch (error) {
    console.error("send_welcome_email: Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await logEmail(supabase, email, "welcome", "failed", undefined, errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
