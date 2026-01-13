import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLEANUP-RESERVATIONS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Optional: Verify this is called by a cron job or admin
    // For now, we'll allow it to be called by anyone but could add auth
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      
      if (userData.user) {
        // Check if user is admin
        const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
          _user_id: userData.user.id,
          _role: 'admin'
        });
        
        if (!isAdmin) {
          throw new Error("Admin access required");
        }
      }
    }

    // Find expired pending orders
    const { data: expiredOrders, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, line_items_json")
      .eq("status", "pending")
      .lt("reservation_expires_at", new Date().toISOString())
      .limit(100); // Process in batches

    if (fetchError) {
      throw new Error(`Failed to fetch expired orders: ${fetchError.message}`);
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      logStep("No expired reservations found");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No expired reservations to clean up",
        processed: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found expired orders", { count: expiredOrders.length });

    let processedCount = 0;
    let errorCount = 0;

    for (const order of expiredOrders) {
      try {
        // Release ticket reservations
        const { error: releaseError } = await supabaseAdmin.rpc('release_ticket_reservations', {
          p_order_id: order.id
        });

        if (releaseError) {
          logStep("Failed to release reservations via RPC, using fallback", { orderId: order.id });
          
          // Fallback: manually release reservations
          const lineItems = order.line_items_json as Array<{
            ticket_id: string;
            quantity: number;
          }>;

          for (const item of lineItems) {
            await supabaseAdmin
              .from("tickets")
              .update({ 
                qty_reserved: supabaseAdmin.rpc('greatest', { a: 0, b: 'qty_reserved - ' + item.quantity })
              })
              .eq("id", item.ticket_id);
          }
        }

        // Update order status to cancelled
        await supabaseAdmin
          .from("orders")
          .update({ 
            status: "cancelled",
            metadata_json: {
              cancelled_reason: "reservation_expired",
              cancelled_at: new Date().toISOString()
            }
          })
          .eq("id", order.id);

        processedCount++;
        logStep("Processed expired order", { orderId: order.id });
      } catch (orderError) {
        errorCount++;
        logStep("Error processing order", { orderId: order.id, error: String(orderError) });
      }
    }

    logStep("Cleanup complete", { processed: processedCount, errors: errorCount });

    return new Response(JSON.stringify({ 
      success: true,
      message: `Cleaned up ${processedCount} expired reservations`,
      processed: processedCount,
      errors: errorCount
    }), {
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
