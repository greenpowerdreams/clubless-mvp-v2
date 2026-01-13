import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PayoutEmailRequest {
  payout_id: string;
  to_email: string;
  creator_name: string;
  event_title: string;
  amount_cents: number;
  status: "scheduled" | "completed" | "failed";
  scheduled_date?: string;
  completed_date?: string;
  failure_reason?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-PAYOUT-NOTIFICATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body: PayoutEmailRequest = await req.json();
    logStep("Request received", { payout_id: body.payout_id, status: body.status });

    const formatAmount = (cents: number) => 
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

    let subjectLine = "";
    let statusColor = "";
    let statusText = "";
    let statusDetails = "";

    switch (body.status) {
      case "scheduled":
        subjectLine = `💰 Payout Scheduled: ${formatAmount(body.amount_cents)}`;
        statusColor = "#3b82f6";
        statusText = "Payout Scheduled";
        statusDetails = `Your payout of ${formatAmount(body.amount_cents)} has been scheduled for ${body.scheduled_date}.`;
        break;
      case "completed":
        subjectLine = `✅ Payout Complete: ${formatAmount(body.amount_cents)}`;
        statusColor = "#22c55e";
        statusText = "Payout Completed";
        statusDetails = `Your payout of ${formatAmount(body.amount_cents)} has been sent to your bank account.`;
        break;
      case "failed":
        subjectLine = `⚠️ Payout Failed`;
        statusColor = "#ef4444";
        statusText = "Payout Failed";
        statusDetails = `There was an issue processing your payout. Reason: ${body.failure_reason || "Unknown error"}`;
        break;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${statusText}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, ${statusColor}, #7c3aed); padding: 2px; border-radius: 16px;">
            <div style="background-color: #0a0a0f; border-radius: 14px; padding: 40px;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px 0;">${statusText}</h1>
              <p style="color: #a1a1aa; margin: 0 0 30px 0;">For: ${body.event_title}</p>
              
              <div style="background: linear-gradient(160deg, #1a1a2e, #0a0a0f); border: 1px solid #333; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-center;">
                <p style="color: #a1a1aa; margin: 0 0 8px 0; font-size: 14px;">Amount</p>
                <p style="color: ${statusColor}; font-size: 36px; font-weight: bold; margin: 0;">
                  ${formatAmount(body.amount_cents)}
                </p>
              </div>
              
              <p style="color: #ffffff; margin: 0 0 20px 0;">
                Hi ${body.creator_name},
              </p>
              
              <p style="color: #a1a1aa; margin: 0 0 20px 0;">
                ${statusDetails}
              </p>
              
              ${body.status === "scheduled" ? `
                <div style="background-color: #1a1a2e; border-radius: 8px; padding: 16px;">
                  <p style="color: #a1a1aa; margin: 0; font-size: 14px;">
                    📅 Expected arrival: ${body.scheduled_date}
                  </p>
                </div>
              ` : ""}
              
              ${body.status === "failed" ? `
                <div style="background-color: #1a1a2e; border: 1px solid ${statusColor}; border-radius: 8px; padding: 16px;">
                  <p style="color: #ffffff; margin: 0; font-size: 14px;">
                    Please update your payment information in your account settings, or reply to this email for assistance.
                  </p>
                </div>
              ` : ""}
              
              <p style="color: #71717a; font-size: 12px; margin-top: 30px; text-align: center;">
                Questions? Reply to this email or contact support.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    logStep("Sending email via Resend");
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Payouts <noreply@clublesscollective.com>",
        to: [body.to_email],
        subject: subjectLine,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();
    logStep("Email send result", emailResult);

    if (!emailResponse.ok) {
      throw new Error(`Failed to send email: ${JSON.stringify(emailResult)}`);
    }

    // Log email
    await supabaseClient.from("email_logs").insert({
      to_email: body.to_email,
      template_name: `payout_${body.status}`,
      status: "sent",
      provider_message_id: emailResult.id,
      metadata: { payout_id: body.payout_id, amount: body.amount_cents, event_title: body.event_title },
    });

    return new Response(JSON.stringify({ success: true, message_id: emailResult.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
