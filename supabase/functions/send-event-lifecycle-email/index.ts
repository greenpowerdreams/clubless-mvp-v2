// Event lifecycle email handler.
// Sends branded emails to creators when their event changes status,
// and optionally alerts the admin (andrew@) on new submissions.
//
// Called from:
//   - CreateEvent.tsx (on submit → notify_admin=true)
//   - AdminEventsTab.tsx (on approve/reject/publish)
//
// Does NOT require JWT — called server-to-server with service-role context
// from the admin UI (which already verified the admin's identity).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "andrew@clublesscollective.com";
const SITE_URL = "https://clublesscollective.com";

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[EVENT-LIFECYCLE-EMAIL] ${step}${d}`);
};

// ── Email templates ────────────────────────────────────────────────────

interface TemplateContext {
  firstName: string;
  eventTitle: string;
  eventCity: string;
  eventDate: string;
  eventLink: string;
  dashboardLink: string;
  adminNotes?: string;
}

function getEmailContent(
  status: string,
  ctx: TemplateContext,
): { subject: string; body: string } | null {
  const notes = ctx.adminNotes
    ? `<p style="font-size:16px;line-height:1.6;margin-bottom:16px;"><strong>Notes:</strong> ${ctx.adminNotes}</p>`
    : "";

  switch (status) {
    case "pending_approval":
      return {
        subject: `We received your event: ${ctx.eventTitle}`,
        body: `
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">Hey ${ctx.firstName},</p>
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">Thanks for submitting <strong>${ctx.eventTitle}</strong>! We're reviewing it now and will get back to you within 24 hours.</p>
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">Track your event in your dashboard:<br/>
<a href="${ctx.dashboardLink}" style="color:#7c3aed;">${ctx.dashboardLink}</a></p>
<p style="font-size:16px;line-height:1.6;margin-bottom:8px;">— Andrew</p>
        `,
      };

    case "approved":
      return {
        subject: `Your event is approved: ${ctx.eventTitle}!`,
        body: `
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">Hey ${ctx.firstName},</p>
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">Great news — <strong>${ctx.eventTitle}</strong> is approved and will be published shortly!</p>
${notes}
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">Your event page:<br/>
<a href="${ctx.eventLink}" style="color:#7c3aed;">${ctx.eventLink}</a></p>
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">Make sure you've connected your Stripe account so you can receive ticket revenue:<br/>
<a href="${SITE_URL}/settings/payments" style="color:#7c3aed;">Payment Settings</a></p>
<p style="font-size:16px;line-height:1.6;margin-bottom:8px;">— Andrew</p>
        `,
      };

    case "published":
      return {
        subject: `Your event is LIVE: ${ctx.eventTitle}!`,
        body: `
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">Hey ${ctx.firstName},</p>
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;"><strong>${ctx.eventTitle}</strong> is now live and tickets are on sale!</p>
${notes}
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">Share this link with your audience to start selling:<br/>
<a href="${ctx.eventLink}" style="color:#7c3aed;">${ctx.eventLink}</a></p>
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">Track sales in your dashboard:<br/>
<a href="${ctx.dashboardLink}" style="color:#7c3aed;">${ctx.dashboardLink}</a></p>
<p style="font-size:16px;line-height:1.6;margin-bottom:8px;">— Andrew</p>
        `,
      };

    case "rejected":
      return {
        subject: `Update on your event: ${ctx.eventTitle}`,
        body: `
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">Hey ${ctx.firstName},</p>
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">I reviewed <strong>${ctx.eventTitle}</strong> and unfortunately we can't move forward with this one right now.</p>
${notes}
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">This isn't the end — if you want to adjust the concept or have other ideas, just reply to this email.</p>
<p style="font-size:16px;line-height:1.6;margin-bottom:8px;">— Andrew</p>
        `,
      };

    case "completed":
      return {
        subject: `Congrats on ${ctx.eventTitle}!`,
        body: `
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">Hey ${ctx.firstName},</p>
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;"><strong>${ctx.eventTitle}</strong> is complete. You did it!</p>
${notes}
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">Check your dashboard for the final numbers. Your payout will be processed within 5 business days.</p>
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">View your stats:<br/>
<a href="${ctx.dashboardLink}" style="color:#7c3aed;">${ctx.dashboardLink}</a></p>
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">Ready for the next one? I'm here when you are.</p>
<p style="font-size:16px;line-height:1.6;margin-bottom:8px;">— Andrew</p>
        `,
      };

    default:
      return null;
  }
}

function wrapHtml(body: string): string {
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  ${body}
  <p style="font-size:13px;color:#888;margin-top:32px;border-top:1px solid #eee;padding-top:16px;">
    Clubless Collective — Host your event, keep your profit.
  </p>
</div>`;
}

// ── Log helper ─────────────────────────────────────────────────────────

async function logEmail(
  supabase: ReturnType<typeof createClient>,
  toEmail: string,
  templateName: string,
  status: string,
  providerMessageId?: string,
  error?: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await supabase.from("email_logs").insert({
      to_email: toEmail,
      template_name: templateName,
      status,
      provider_message_id: providerMessageId,
      error,
      metadata,
    });
  } catch (err) {
    console.error("Failed to log email:", err);
  }
}

async function sendEmail(
  resendKey: string,
  to: string,
  subject: string,
  html: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: "Andrew Green <andrew@clublesscollective.com>",
      reply_to: "andrew@clublesscollective.com",
      to: [to],
      subject,
      html,
    }),
  });
  const data = await res.json();
  return res.ok ? { ok: true, id: data.id } : { ok: false, error: data.message };
}

// ── Main ───────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    log("ERROR: RESEND_API_KEY not configured");
    return new Response(
      JSON.stringify({ success: false, error: "Email service not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const { event_id, new_status, admin_notes, notify_admin } = await req.json();
    if (!event_id || !new_status) {
      throw new Error("Missing event_id or new_status");
    }
    log("Processing", { event_id, new_status, notify_admin });

    // Fetch event
    const { data: event, error: eventErr } = await supabaseAdmin
      .from("events")
      .select("id, title, city, start_at, creator_id")
      .eq("id", event_id)
      .single();
    if (eventErr || !event) throw new Error("Event not found");

    // Fetch creator's email (via admin auth API) + profile display_name
    let creatorEmail = "";
    let creatorFirstName = "there";
    if (event.creator_id) {
      const { data: creatorProfile } = await supabaseAdmin
        .from("profiles")
        .select("display_name")
        .eq("id", event.creator_id)
        .single();
      creatorFirstName = creatorProfile?.display_name?.split(" ")[0] || "there";

      // Get email via Supabase admin auth API (auth.users isn't queryable via PostgREST)
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.getUserById(
        event.creator_id,
      );
      if (!authErr && authData?.user?.email) {
        creatorEmail = authData.user.email;
      } else {
        log("Could not fetch creator email from auth", { error: authErr?.message });
      }
    }

    const eventDate = event.start_at
      ? new Date(event.start_at).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "TBD";

    const ctx: TemplateContext = {
      firstName: creatorFirstName,
      eventTitle: event.title || "Untitled Event",
      eventCity: event.city || "Seattle",
      eventDate,
      eventLink: `${SITE_URL}/events/${event.id}`,
      dashboardLink: `${SITE_URL}/dashboard?tab=events`,
      adminNotes: admin_notes,
    };

    const results: Array<{ to: string; status: string; id?: string; error?: string }> = [];

    // 1) Send status email to creator
    if (creatorEmail) {
      const content = getEmailContent(new_status, ctx);
      if (content) {
        const result = await sendEmail(RESEND_API_KEY, creatorEmail, content.subject, wrapHtml(content.body));
        await logEmail(supabaseAdmin, creatorEmail, `event_${new_status}`, result.ok ? "sent" : "failed", result.id, result.error, { event_id, new_status });
        results.push({ to: creatorEmail, status: result.ok ? "sent" : "failed", ...result });
        log(result.ok ? "Creator email sent" : "Creator email failed", { to: creatorEmail, error: result.error });
      }
    } else {
      log("No creator email found, skipping creator notification");
    }

    // 2) Optionally notify admin of new submission
    if (notify_admin && new_status === "pending_approval") {
      const adminSubject = `New event submitted: ${ctx.eventTitle}`;
      const adminBody = wrapHtml(`
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">New event submitted for review:</p>
<ul style="font-size:16px;line-height:1.8;margin-bottom:16px;">
  <li><strong>Title:</strong> ${ctx.eventTitle}</li>
  <li><strong>City:</strong> ${ctx.eventCity}</li>
  <li><strong>Date:</strong> ${ctx.eventDate}</li>
  <li><strong>Creator:</strong> ${ctx.firstName} (${creatorEmail || "unknown email"})</li>
</ul>
<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">
  <a href="${SITE_URL}/admin" style="color:#7c3aed;font-weight:bold;">Review in Admin Dashboard →</a>
</p>
      `);
      const result = await sendEmail(RESEND_API_KEY, ADMIN_EMAIL, adminSubject, adminBody);
      await logEmail(supabaseAdmin, ADMIN_EMAIL, "admin_event_submitted", result.ok ? "sent" : "failed", result.id, result.error, { event_id });
      results.push({ to: ADMIN_EMAIL, status: result.ok ? "sent" : "failed", ...result });
      log(result.ok ? "Admin alert sent" : "Admin alert failed", { error: result.error });
    }

    // 3) Insert in-app notification for creator
    if (event.creator_id && new_status !== "pending_approval") {
      const notifTitles: Record<string, string> = {
        approved: "Event approved!",
        published: "Your event is live!",
        rejected: "Event update",
        completed: "Event completed!",
      };
      const notifBodies: Record<string, string> = {
        approved: `${ctx.eventTitle} has been approved. It will be published shortly.`,
        published: `${ctx.eventTitle} is now live. Share the link to start selling tickets!`,
        rejected: `${ctx.eventTitle} was not approved.${admin_notes ? " Reason: " + admin_notes : ""}`,
        completed: `${ctx.eventTitle} is complete. Check your dashboard for the final numbers.`,
      };
      if (notifTitles[new_status]) {
        await supabaseAdmin.from("notifications").insert({
          user_id: event.creator_id,
          type: "system",
          title: notifTitles[new_status],
          body: notifBodies[new_status],
          data: { event_id: event.id, new_status },
        }).then(({ error }) => {
          if (error) log("Failed to insert notification", { error: error.message });
          else log("In-app notification created");
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
