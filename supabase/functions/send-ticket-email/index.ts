import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TicketEmailRequest {
  order_id: string;
  to_email: string;
  buyer_name: string;
  event_title: string;
  event_date: string;
  event_location: string;
  tickets: { name: string; quantity: number; price: number }[];
  total_amount: number;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-TICKET-EMAIL] ${step}${detailsStr}`);
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

    const body: TicketEmailRequest = await req.json();
    logStep("Request received", { order_id: body.order_id, to_email: body.to_email });

    const ticketRows = body.tickets.map(t => 
      `<tr>
        <td style="padding: 12px; border-bottom: 1px solid #333;">${t.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #333; text-align: center;">${t.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #333; text-align: right;">$${(t.price / 100).toFixed(2)}</td>
      </tr>`
    ).join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Tickets</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #7c3aed, #ec4899); padding: 2px; border-radius: 16px;">
            <div style="background-color: #0a0a0f; border-radius: 14px; padding: 40px;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px 0;">🎟️ Your Tickets Are Confirmed!</h1>
              <p style="color: #a1a1aa; margin: 0 0 30px 0;">Order #${body.order_id.slice(0, 8)}</p>
              
              <div style="background: linear-gradient(160deg, #1a1a2e, #0a0a0f); border: 1px solid #333; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 16px 0;">${body.event_title}</h2>
                <p style="color: #a1a1aa; margin: 0 0 8px 0;">📅 ${body.event_date}</p>
                <p style="color: #a1a1aa; margin: 0;">📍 ${body.event_location}</p>
              </div>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="background-color: #1a1a2e;">
                    <th style="padding: 12px; text-align: left; color: #a1a1aa; font-weight: 500;">Ticket</th>
                    <th style="padding: 12px; text-align: center; color: #a1a1aa; font-weight: 500;">Qty</th>
                    <th style="padding: 12px; text-align: right; color: #a1a1aa; font-weight: 500;">Price</th>
                  </tr>
                </thead>
                <tbody style="color: #ffffff;">
                  ${ticketRows}
                </tbody>
                <tfoot>
                  <tr style="background-color: #1a1a2e;">
                    <td colspan="2" style="padding: 12px; font-weight: bold; color: #ffffff;">Total</td>
                    <td style="padding: 12px; text-align: right; font-weight: bold; color: #7c3aed;">$${(body.total_amount / 100).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
              
              <div style="background-color: #1a1a2e; border-radius: 8px; padding: 16px; text-align: center;">
                <p style="color: #a1a1aa; margin: 0; font-size: 14px;">
                  Show this email or your QR code at the event for entry.
                </p>
              </div>
              
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
        from: "Tickets <noreply@clublesscollective.com>",
        to: [body.to_email],
        subject: `🎟️ Your tickets for ${body.event_title}`,
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
      template_name: "ticket_confirmation",
      status: "sent",
      provider_message_id: emailResult.id,
      metadata: { order_id: body.order_id, event_title: body.event_title },
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
