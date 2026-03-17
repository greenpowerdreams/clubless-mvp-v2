import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
  template_name?: string;
  metadata?: Record<string, unknown>;
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

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  // ============================================
  // AUTHENTICATION CHECK - Admin only
  // This is a generic email sender - very dangerous if public
  // ============================================
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    console.error("send_email: No authorization header");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
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
    console.error("send_email: Invalid auth token:", authError?.message);
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // Verify admin role using service role client
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const isAdmin = await verifyAdminRole(supabaseAdmin, user.id);
  if (!isAdmin) {
    console.error("send_email: User is not admin:", user.id);
    return new Response(
      JSON.stringify({ error: "Forbidden - Admin access required" }),
      { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  console.log("send_email: Admin verified:", user.email);
  // ============================================

  const logEmail = async (entry: {
    to_email: string;
    template_name: string;
    status: string;
    provider_message_id?: string;
    error?: string;
    metadata?: Record<string, unknown>;
  }) => {
    try {
      await supabaseAdmin.from('email_logs').insert(entry);
      console.log("email_log:", { to: entry.to_email, template: entry.template_name, status: entry.status });
    } catch (err) {
      console.error("email_log: Failed to write:", err);
    }
  };

  let emailRequest: EmailRequest;
  
  try {
    emailRequest = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  const { to, subject, html, from, template_name, metadata } = emailRequest;
  const templateName = template_name || "unknown";
  
  console.log("email_attempt:", { to_email: to, template_name: templateName, subject, admin: user.email });

  await logEmail({ to_email: to, template_name: templateName, status: 'attempted', metadata: { subject, ...metadata } });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      await logEmail({ to_email: to, template_name: templateName, status: 'failed', error: "RESEND_API_KEY not configured" });
      return new Response(JSON.stringify({ error: "Email service not configured" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
    
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ 
        from: from || "Andrew @ Clubless Collective <andrew@clublesscollective.com>", 
        reply_to: "andrew@clublesscollective.com",
        to: [to], 
        subject, 
        html 
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      const errorMessage = data.message || data.error || "Failed to send email";
      console.error("email_failure:", { to_email: to, template_name: templateName, error: errorMessage });
      await logEmail({ to_email: to, template_name: templateName, status: 'failed', error: errorMessage });
      return new Response(JSON.stringify({ error: errorMessage }), { status: res.status, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    console.log("email_sent:", { to_email: to, template_name: templateName, provider_message_id: data.id });
    await logEmail({ to_email: to, template_name: templateName, status: 'sent', provider_message_id: data.id });

    return new Response(JSON.stringify({ success: true, id: data.id }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("email_exception:", { to_email: to, template_name: templateName, error: errorMessage });
    await logEmail({ to_email: to, template_name: templateName, status: 'failed', error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
