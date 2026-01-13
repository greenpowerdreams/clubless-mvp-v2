import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import { Layout } from "@/components/layout/Layout";

export default function CheckoutCancel() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState<string | null>(null);

  const orderId = searchParams.get("order_id");

  useEffect(() => {
    if (orderId) {
      cleanupCancelledOrder();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const cleanupCancelledOrder = async () => {
    try {
      // Fetch order to get event_id for redirect
      const { data: order } = await supabase
        .from("orders")
        .select("event_id, status")
        .eq("id", orderId)
        .single();

      if (order) {
        setEventId(order.event_id);
        
        // Only update if still pending (not already completed or cancelled)
        if (order.status === "pending") {
          await supabase
            .from("orders")
            .update({ status: "cancelled" })
            .eq("id", orderId);
        }
      }
    } catch (error) {
      console.error("Error cleaning up cancelled order:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Processing...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[60vh] py-12">
        <div className="container max-w-lg mx-auto px-4">
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                <XCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              
              <h1 className="text-2xl font-bold mb-2">Checkout Cancelled</h1>
              <p className="text-muted-foreground mb-8">
                Your order was not completed. No payment has been processed and your tickets have been released.
              </p>

              <div className="space-y-3">
                {eventId && (
                  <Button asChild className="w-full" size="lg">
                    <Link to={`/events/${eventId}`}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again
                    </Link>
                  </Button>
                )}
                
                <Button variant="outline" asChild className="w-full" size="lg">
                  <Link to="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Browse Events
                  </Link>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-6">
                Need help? Contact us at{" "}
                <a href="mailto:support@clublesscollective.com" className="text-primary hover:underline">
                  support@clublesscollective.com
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
