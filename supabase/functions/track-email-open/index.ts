import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// 1x1 transparent PNG pixel (base64 decoded)
const TRACKING_PIXEL = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // Max 30 requests per minute per IP

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  entry.count++;
  return true;
}

// Cleanup old rate limit entries periodically
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Always return the pixel, even if tracking fails
  const pixelResponse = () => new Response(TRACKING_PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Length": TRACKING_PIXEL.length.toString(),
      ...corsHeaders,
    },
  });

  // Get client IP for rate limiting
  const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                   req.headers.get("x-real-ip") || 
                   "unknown";

  // Check rate limit - return pixel silently if exceeded (don't reveal rate limiting)
  if (!checkRateLimit(clientIP)) {
    console.log("track_email_open: Rate limit exceeded for IP:", clientIP);
    cleanupRateLimitMap();
    return pixelResponse();
  }

  const url = new URL(req.url);
  const trackingId = url.searchParams.get("t");

  if (!trackingId) {
    console.log("track_email_open: No tracking ID provided");
    return pixelResponse();
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(trackingId)) {
    console.log("track_email_open: Invalid tracking ID format");
    return pixelResponse();
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Update the email log with open tracking (only set opened_at on first open)
    const { data, error } = await supabase
      .from("email_logs")
      .update({
        opened_at: new Date().toISOString(),
      })
      .eq("tracking_id", trackingId)
      .is("opened_at", null) // Only set opened_at on first open
      .select("id, to_email, template_name")
      .maybeSingle();

    if (error) {
      console.error("track_email_open: Update error:", error.message);
    } else if (data) {
      console.log("track_email_open: First open recorded for:", data.to_email, "template:", data.template_name);
    }

    // Always increment open_count (even on subsequent opens)
    const { error: incrementError } = await supabase.rpc("increment_email_open_count", {
      p_tracking_id: trackingId,
    });

    if (incrementError) {
      // Fallback: direct update if RPC doesn't exist
      await supabase
        .from("email_logs")
        .update({ open_count: 1 })
        .eq("tracking_id", trackingId)
        .eq("open_count", 0);
    }
  } catch (err) {
    console.error("track_email_open: Error:", err);
  }

  // Periodic cleanup
  if (Math.random() < 0.1) {
    cleanupRateLimitMap();
  }

  return pixelResponse();
});
