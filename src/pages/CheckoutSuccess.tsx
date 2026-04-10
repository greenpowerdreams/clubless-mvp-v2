import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, AlertCircle, Ticket, Calendar, MapPin } from "lucide-react";
import { Layout } from "@/components/layout/Layout";

interface OrderDetails {
  id: string;
  amount_cents: number;
  status: string;
  event_title?: string;
  event_date?: string;
  event_city?: string;
  line_items: Array<{
    ticket_name: string;
    quantity: number;
    unit_price_cents: number;
    subtotal_cents: number;
  }>;
}

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetails | null>(null);

  const orderId = searchParams.get("order_id");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!orderId || !sessionId) {
      setError("Invalid checkout session");
      setLoading(false);
      return;
    }

    verifyPayment();
  }, [orderId, sessionId]);

  const verifyPayment = async () => {
    setVerifying(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError("Please log in to view your order");
        setLoading(false);
        return;
      }

      // Call verify-payment edge function
      const { data, error: verifyError } = await supabase.functions.invoke("verify-payment", {
        body: { session_id: sessionId, order_id: orderId },
      });

      if (verifyError) {
        throw new Error(verifyError.message || "Failed to verify payment");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Fetch order details with event info
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`
          id,
          amount_cents,
          status,
          line_items_json,
          events (
            title,
            start_at,
            city
          )
        `)
        .eq("id", orderId)
        .single();

      if (orderError) {
        throw new Error("Failed to fetch order details");
      }

      const eventData = orderData.events as { title: string; start_at: string; city: string } | null;

      setOrder({
        id: orderData.id,
        amount_cents: orderData.amount_cents,
        status: orderData.status,
        event_title: eventData?.title,
        event_date: eventData?.start_at,
        event_city: eventData?.city,
        line_items: orderData.line_items_json as OrderDetails["line_items"],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              {verifying ? "Verifying your payment..." : "Loading order details..."}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link to="/my-tickets">Go to My Tickets</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/">Return Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[60vh] py-12">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Your tickets are ready. View your QR codes in My Tickets — you'll
              also get a confirmation email.
            </p>
          </div>

          {order && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Order Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Event Info */}
                {order.event_title && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">{order.event_title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {order.event_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.event_date)}
                        </div>
                      )}
                      {order.event_city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {order.event_city}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tickets */}
                <div>
                  <h4 className="font-medium mb-3">Your Tickets</h4>
                  <div className="space-y-2">
                    {order.line_items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium">{item.ticket_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} × {formatCurrency(item.unit_price_cents)}
                          </p>
                        </div>
                        <p className="font-medium">{formatCurrency(item.subtotal_cents)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t text-lg font-semibold">
                  <span>Total Paid</span>
                  <span>{formatCurrency(order.amount_cents)}</span>
                </div>

                {/* Order ID */}
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Order ID: <span className="font-mono">{order.id.slice(0, 8)}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/my-tickets">View My Tickets</Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link to="/events">Discover More Events</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
