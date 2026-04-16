import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RefundRequest {
  id: string;
  order_id: string;
  reason: string;
  status: string;
  created_at: string;
  order: {
    id: string;
    amount_cents: number;
    buyer_email: string;
    buyer_name: string | null;
    stripe_payment_intent_id: string | null;
    refund_amount_cents: number | null;
    status: string;
    event_title: string | null;
  } | null;
}

interface OrderForRefund {
  id: string;
  amount_cents: number;
  buyer_email: string;
  buyer_name: string | null;
  stripe_payment_intent_id: string | null;
  refund_amount_cents: number | null;
  status: string;
  created_at: string;
  event_id: string;
  events: { title: string } | null;
}

export function AdminRefundsTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [refundableOrders, setRefundableOrders] = useState<OrderForRefund[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    orderId: string;
    amount: number;
    buyerEmail: string;
    reason: string;
  } | null>(null);
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    loadRefundData();
  }, []);

  const loadRefundData = async () => {
    setLoading(true);

    // Load pending refund requests
    const { data: requests } = await supabase
      .from("refund_requests")
      .select("id, order_id, reason, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    // Enrich with order details
    const enriched: RefundRequest[] = [];
    if (requests) {
      for (const req of requests) {
        const { data: order } = await supabase
          .from("orders")
          .select("id, amount_cents, buyer_email, buyer_name, stripe_payment_intent_id, refund_amount_cents, status, events(title)")
          .eq("id", req.order_id)
          .single();

        enriched.push({
          ...req,
          order: order
            ? {
                ...order,
                event_title: (order.events as any)?.title ?? null,
              }
            : null,
        });
      }
    }
    setRefundRequests(enriched);

    // Also load recent completed/refunded orders for direct admin refunds
    const { data: orders } = await supabase
      .from("orders")
      .select("id, amount_cents, buyer_email, buyer_name, stripe_payment_intent_id, refund_amount_cents, status, created_at, event_id, events(title)")
      .in("status", ["completed", "partially_refunded"])
      .order("created_at", { ascending: false })
      .limit(50);

    setRefundableOrders(orders ?? []);
    setLoading(false);
  };

  const approveRefund = async (request: RefundRequest) => {
    if (!request.order?.stripe_payment_intent_id) {
      toast({
        title: "Cannot refund",
        description: "No Stripe payment intent found for this order.",
        variant: "destructive",
      });
      return;
    }

    setConfirmDialog({
      orderId: request.order.id,
      amount: request.order.amount_cents - (request.order.refund_amount_cents ?? 0),
      buyerEmail: request.order.buyer_email,
      reason: request.reason,
    });
  };

  const directRefund = (order: OrderForRefund) => {
    if (!order.stripe_payment_intent_id) {
      toast({
        title: "Cannot refund",
        description: "No Stripe payment intent found.",
        variant: "destructive",
      });
      return;
    }

    setConfirmDialog({
      orderId: order.id,
      amount: order.amount_cents - (order.refund_amount_cents ?? 0),
      buyerEmail: order.buyer_email,
      reason: adminNote || "Admin-initiated refund",
    });
  };

  const processRefund = async () => {
    if (!confirmDialog) return;
    setProcessing(confirmDialog.orderId);

    try {
      const { data, error } = await supabase.functions.invoke("process-refund", {
        body: {
          order_id: confirmDialog.orderId,
          reason: confirmDialog.reason || adminNote || "Refund approved by admin",
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Update refund request status if this was from a request
      const matchingRequest = refundRequests.find(
        (r) => r.order_id === confirmDialog.orderId
      );
      if (matchingRequest) {
        await supabase
          .from("refund_requests")
          .update({
            status: "approved",
            admin_notes: adminNote || null,
            processed_at: new Date().toISOString(),
          })
          .eq("id", matchingRequest.id);
      }

      toast({
        title: "Refund processed",
        description: `$${(confirmDialog.amount / 100).toFixed(2)} refunded to ${confirmDialog.buyerEmail}`,
      });

      setConfirmDialog(null);
      setAdminNote("");
      loadRefundData();
    } catch (err) {
      toast({
        title: "Refund failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const denyRefund = async (requestId: string) => {
    await supabase
      .from("refund_requests")
      .update({
        status: "denied",
        admin_notes: adminNote || "Denied by admin",
        processed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    toast({ title: "Refund request denied" });
    setAdminNote("");
    loadRefundData();
  };

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pending Refund Requests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Pending Refund Requests ({refundRequests.length})
          </h3>
          <Button variant="outline" size="sm" onClick={loadRefundData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {refundRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              No pending refund requests
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {refundRequests.map((req) => (
              <Card key={req.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {req.order?.buyer_name || req.order?.buyer_email || "Unknown"}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {req.order?.event_title || "Unknown event"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <Mail className="w-3 h-3 inline mr-1" />
                        {req.order?.buyer_email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <DollarSign className="w-3 h-3 inline mr-1" />
                        {req.order ? formatCurrency(req.order.amount_cents) : "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        Requested {formatDate(req.created_at)}
                      </p>
                      <p className="text-sm mt-2 bg-muted/50 rounded p-2">
                        <strong>Reason:</strong> {req.reason}
                      </p>
                    </div>
                    <div className="flex gap-2 sm:flex-col">
                      <Button
                        size="sm"
                        onClick={() => approveRefund(req)}
                        disabled={!!processing}
                      >
                        {processing === req.order_id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        )}
                        Approve & Refund
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => denyRefund(req.id)}
                        disabled={!!processing}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Deny
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Direct Admin Refunds */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Recent Orders (Direct Refund)
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Process refunds directly for any completed order.
        </p>

        {refundableOrders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No completed orders found
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {refundableOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {order.buyer_name || order.buyer_email}
                        </span>
                        <Badge
                          variant="secondary"
                          className={
                            order.status === "partially_refunded"
                              ? "bg-yellow-500/10 text-yellow-500"
                              : "bg-green-500/10 text-green-500"
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(order.events as any)?.title} &bull; {formatCurrency(order.amount_cents)}
                        {order.refund_amount_cents
                          ? ` (${formatCurrency(order.refund_amount_cents)} refunded)`
                          : ""}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {order.id.slice(0, 8)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => directRefund(order)}
                      disabled={!!processing || !order.stripe_payment_intent_id}
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Refund
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Refund Dialog */}
      <Dialog
        open={!!confirmDialog}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialog(null);
            setAdminNote("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Refund</DialogTitle>
            <DialogDescription>
              This will issue a Stripe refund and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Refund to</span>
                <span className="text-sm font-medium">{confirmDialog?.buyerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-sm font-semibold text-red-500">
                  {confirmDialog ? formatCurrency(confirmDialog.amount) : ""}
                </span>
              </div>
            </div>

            {confirmDialog?.reason && (
              <div>
                <p className="text-sm font-medium mb-1">Customer's reason</p>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
                  {confirmDialog.reason}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-1">Admin note (optional)</p>
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Internal note about this refund..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={processRefund}
              disabled={!!processing}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <DollarSign className="w-4 h-4 mr-2" />
              )}
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
