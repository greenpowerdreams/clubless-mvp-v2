import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "aj33green7@gmail.com";

interface WaitlistRequest {
  email: string;
  firstName?: string;
  interestType: "attendee" | "creator" | "vendor";
  city: string;
  sourcePage?: string;
}

async function sendEmail(
  apiKey: string,
  to: string[],
  subject: string,
  html: string,
  from: string = "Andrew @ Clubless Collective <andrew@clublesscollective.com>",
  replyTo: string = "andrew@clublesscollective.com"
): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        reply_to: replyTo,
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend API error:", res.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return new Response(
      JSON.stringify({ error: "Email service not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const { email, firstName, interestType, city, sourcePage }: WaitlistRequest = await req.json();

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role for inserting waitlist
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check for duplicate
    const { data: existing } = await supabaseAdmin
      .from("waitlist_signups")
      .select("id")
      .eq("email", email.toLowerCase())
      .eq("interest_type", interestType)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, message: "Already on waitlist" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Insert waitlist signup
    const { error: insertError } = await supabaseAdmin
      .from("waitlist_signups")
      .insert({
        email: email.toLowerCase(),
        first_name: firstName || null,
        interest_type: interestType,
        city,
        source_page: sourcePage || null,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      // If duplicate constraint, still succeed
      if (insertError.code === "23505") {
        return new Response(
          JSON.stringify({ success: true, message: "Already on waitlist" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      throw insertError;
    }

    const name = firstName || "there";
    const interestLabel = {
      attendee: "attending events",
      creator: "hosting events",
      vendor: "providing services",
    }[interestType];

    // Send confirmation email to user
    const userEmailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #8B5CF6; font-size: 28px; margin-bottom: 24px;">Hey ${name}!</h1>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
          You're officially on the Clubless Collective early access list for <strong>${city}</strong>.
        </p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
          You signed up as someone interested in <strong>${interestLabel}</strong> — we'll reach out when we're ready to onboard you.
        </p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          We're currently onboarding our first creators and vendors in Seattle. Expect to hear from us soon with exclusive early access opportunities.
        </p>
        
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6;">
          Questions? Just reply to this email.<br/>
          — Andrew @ Clubless Collective
        </p>
      </div>
    `;

    await sendEmail(
      RESEND_API_KEY,
      [email],
      "You're on the Clubless early access list 🎉",
      userEmailHtml
    );

    // Send internal notification to admin
    const adminEmailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px;">
        <h2 style="color: #8B5CF6;">New Waitlist Signup</h2>
        <div style="background: #f8f8f8; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 15px; line-height: 1.8;">
          <strong>Email:</strong> ${email}<br/>
          <strong>Name:</strong> ${firstName || "(not provided)"}<br/>
          <strong>Interest:</strong> ${interestType}<br/>
          <strong>City:</strong> ${city}<br/>
          <strong>Source:</strong> ${sourcePage || "(direct)"}
        </div>
      </div>
    `;

    await sendEmail(
      RESEND_API_KEY,
      [ADMIN_EMAIL],
      `New Waitlist Signup: ${interestType} from ${city}`,
      adminEmailHtml,
      "Clubless System <andrew@clublesscollective.com>"
    );

    console.log(`Waitlist signup: ${email} (${interestType}) from ${city}`);

    return new Response(
      JSON.stringify({ success: true, message: "Successfully joined waitlist" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-waitlist-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
