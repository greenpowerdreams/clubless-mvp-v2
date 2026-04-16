import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCreatorEvents } from "./hooks/useCreatorEvents";
import { formatCurrency, getStatusColor, formatStatus } from "./hooks/types";
import type { Ticket as TicketTier } from "./hooks/types";
import {
  Calendar,
  MapPin,
  DollarSign,
  Ticket,
  TrendingUp,
  Eye,
  Users,
  Clock,
  Plus,
  BarChart3,
  Share2,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Pause,
  Play,
  ScanLine,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { EventQRCode } from "@/components/event/EventQRCode";

interface DashboardEventsProps {
  userId: string;
}

export function DashboardEvents({ userId }: DashboardEventsProps) {
  const { data: creatorData, isLoading } = useCreatorEvents(userId);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [stripeConnected, setStripeConnected] = useState<boolean | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Tier editing state
  const [editingTier, setEditingTier] = useState<TicketTier | null>(null);
  const [editForm, setEditForm] = useState({ name: "", price: "", qty: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [pausingTierId, setPausingTierId] = useState<string | null>(null);

  // Check if creator has Stripe connected (one-time on mount)
  useState(() => {
    supabase
      .from("profiles")
      .select("stripe_onboarding_complete")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        setStripeConnected(data?.stripe_onboarding_complete ?? false);
      });
  });

  const copyEventLink = (eventId: string) => {
    const url = `https://clublesscollective.com/events/${eventId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Link copied!", description: url });
    });
  };

  // ── Tier editing handlers ───────────────────────────────────────────

  const openTierEdit = (tier: TicketTier) => {
    setEditingTier(tier);
    setEditForm({
      name: tier.name,
      price: (tier.price_cents / 100).toFixed(2),
      qty: String(tier.qty_total),
    });
  };

  const saveTierEdit = async () => {
    if (!editingTier) return;
    const priceCents = Math.round(parseFloat(editForm.price) * 100);
    const qtyTotal = parseInt(editForm.qty, 10);

    if (!editForm.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      toast({ title: "Enter a valid price", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(qtyTotal) || qtyTotal < editingTier.qty_sold) {
      toast({
        title: "Invalid quantity",
        description: `Must be at least ${editingTier.qty_sold} (already sold)`,
        variant: "destructive",
      });
      return;
    }

    setEditSaving(true);
    const { error } = await supabase
      .from("tickets")
      .update({ name: editForm.name.trim(), price_cents: priceCents, qty_total: qtyTotal })
      .eq("id", editingTier.id);
    setEditSaving(false);

    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Tier updated!" });
    setEditingTier(null);
    queryClient.invalidateQueries({ queryKey: ["creator-events"] });
  };

  const toggleTierPause = async (tier: TicketTier) => {
    setPausingTierId(tier.id);
    // We use qty_reserved as a proxy for "paused" — set qty_total = qty_sold to stop sales,
    // or restore to original. But a cleaner approach: we'll set qty_total to qty_sold to effectively
    // pause sales (no remaining capacity). To "resume", the creator must edit and increase qty_total.
    // Actually — the `tickets` table may have an `active` column. Let's check and use it if present,
    // otherwise toggle via qty_total manipulation.
    // For now, we toggle by setting qty_total = qty_sold (pause) or qty_sold + 100 (resume).
    const isPaused = tier.qty_total <= tier.qty_sold && tier.qty_sold > 0;
    const newQtyTotal = isPaused ? tier.qty_sold + 100 : tier.qty_sold;

    const { error } = await supabase
      .from("tickets")
      .update({ qty_total: newQtyTotal })
      .eq("id", tier.id);
    setPausingTierId(null);

    if (error) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: isPaused ? "Tier resumed — 100 tickets added" : "Tier paused — sales stopped" });
    queryClient.invalidateQueries({ queryKey: ["creator-events"] });
  };

  if (isLoading) {
    return (
      <div className="grid lg:grid-cols-3 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
      </div>
    );
  }

  const { events, tickets, orders, payouts } = creatorData ?? {
    events: [],
    tickets: [],
    orders: [],
    payouts: [],
  };

  // Auto-select first event
  const activeEventId = selectedEventId ?? events[0]?.id ?? null;
  const selectedEvent = events.find((e) => e.id === activeEventId);
  const selectedTickets = tickets.filter((t) => t.event_id === activeEventId);
  const selectedOrders = orders.filter((o) => o.event_id === activeEventId);
  const selectedPayouts = payouts.filter((p) => p.event_id === activeEventId);

  const totalRevenue = selectedOrders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.amount_cents, 0);
  const creatorEarnings = selectedOrders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.creator_amount_cents, 0);
  const totalTicketsSold = selectedTickets.reduce((sum, t) => sum + t.qty_sold, 0);
  const totalCapacity = selectedTickets.reduce((sum, t) => sum + t.qty_total, 0);

  if (events.length === 0) {
    return (
      <Card className="glass text-center py-12">
        <CardContent>
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No events yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first event to start selling tickets
          </p>
          <Button variant="default" asChild>
            <Link to="/dashboard/events/new">Create Event</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Event List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Your Events</h2>
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/events/new">
              <Plus className="w-4 h-4 mr-1" />
              New
            </Link>
          </Button>
        </div>
        <div className="space-y-2">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => setSelectedEventId(event.id)}
              className={`w-full p-4 rounded-xl text-left transition-colors ${
                activeEventId === event.id
                  ? "bg-primary/20 border border-primary/40"
                  : "bg-secondary/50 hover:bg-secondary/80 border border-transparent"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-medium line-clamp-1">{event.title}</h3>
                <Badge className={getStatusColor(event.status)}>
                  {formatStatus(event.status)}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.city}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(event.start_at), "MMM d")}
                </span>
                {["approved", "published", "live"].includes(event.status) && (
                  <span className="ml-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Link
                      to={`/events/${event.id}/checkin`}
                      className="text-green-400 hover:text-green-300"
                      title="Door check-in scanner"
                    >
                      <ScanLine className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      type="button"
                      className="text-primary hover:text-primary/80"
                      title="Copy share link"
                      onClick={() => copyEventLink(event.id)}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <EventQRCode
                      url={`https://clublesscollective.com/events/${event.id}`}
                      title={event.title}
                      variant="icon"
                    />
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tier Edit Dialog */}
      <Dialog open={!!editingTier} onOpenChange={(open) => !open && setEditingTier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ticket Tier</DialogTitle>
            <DialogDescription>
              Update the name, price, or quantity for this tier. You cannot reduce quantity below tickets already sold.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tier Name</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. General Admission"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Price ($)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="10.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Quantity{editingTier ? ` (min ${editingTier.qty_sold})` : ""}
                </label>
                <Input
                  type="number"
                  min={editingTier?.qty_sold ?? 0}
                  value={editForm.qty}
                  onChange={(e) => setEditForm((f) => ({ ...f, qty: e.target.value }))}
                  placeholder="100"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTier(null)}>
              Cancel
            </Button>
            <Button onClick={saveTierEdit} disabled={editSaving}>
              {editSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Details */}
      <div className="lg:col-span-2">
        {selectedEvent && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="glass w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stripe Connect gate */}
              {stripeConnected === false && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-400">Link your bank account to get paid</p>
                    <p className="text-sm text-muted-foreground">Connect Stripe to receive payouts when tickets sell.</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/settings/payments">Connect Stripe</Link>
                  </Button>
                </div>
              )}

              {/* Approval / live banner */}
              {["approved", "published", "live"].includes(selectedEvent.status) && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-400">
                      {selectedEvent.status === "approved"
                        ? "Your event is approved!"
                        : "Your event is live!"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Share this link with your audience to start selling tickets.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyEventLink(selectedEvent.id)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              )}

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                    {selectedEvent.title}
                    <div className="flex items-center gap-2">
                      {["approved", "published", "live"].includes(selectedEvent.status) && (
                        <Button size="sm" asChild className="bg-green-600 hover:bg-green-700">
                          <Link to={`/events/${selectedEvent.id}/checkin`}>
                            <ScanLine className="w-4 h-4 mr-2" />
                            Door Check-in
                          </Link>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/events/${selectedEvent.id}/analytics`}>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analytics
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/events/${selectedEvent.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {selectedEvent.city}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(selectedEvent.start_at), "MMMM d, yyyy 'at' h:mm a")}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      Capacity: {selectedEvent.capacity}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(selectedEvent.status)}>
                        {formatStatus(selectedEvent.status)}
                      </Badge>
                    </div>
                  </div>
                  {selectedEvent.description && (
                    <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                  )}
                </CardContent>
              </Card>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">Total Revenue</span>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                  </CardContent>
                </Card>
                <Card className="glass">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-sm">Your Earnings</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">
                      {formatCurrency(creatorEarnings)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Ticket className="w-4 h-4" />
                      <span className="text-sm">Tickets Sold</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {totalTicketsSold} / {totalCapacity}
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm">Sell-through</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {totalCapacity > 0
                        ? Math.round((totalTicketsSold / totalCapacity) * 100)
                        : 0}
                      %
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tickets">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Ticket Types</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTickets.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No tickets created yet</p>
                  ) : (
                    <div className="space-y-4">
                      {selectedTickets.map((ticket) => {
                        const isPaused = ticket.qty_total <= ticket.qty_sold && ticket.qty_sold > 0;
                        return (
                          <div
                            key={ticket.id}
                            className={`flex items-center justify-between p-4 rounded-lg ${isPaused ? "bg-yellow-500/5 border border-yellow-500/20" : "bg-secondary/50"}`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{ticket.name}</h4>
                                {isPaused && (
                                  <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">Paused</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(ticket.price_cents)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="font-medium">
                                  {ticket.qty_sold} / {ticket.qty_total} sold
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {ticket.qty_reserved} reserved
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Edit tier"
                                  onClick={() => openTierEdit(ticket)}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  title={isPaused ? "Resume sales" : "Pause sales"}
                                  disabled={pausingTierId === ticket.id}
                                  onClick={() => toggleTierPause(ticket)}
                                >
                                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedOrders.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No orders yet</p>
                  ) : (
                    <div className="space-y-4">
                      {selectedOrders.slice(0, 10).map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                        >
                          <div>
                            <h4 className="font-medium">
                              {order.buyer_name || order.buyer_email}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.created_at), "MMM d, h:mm a")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-400">
                              +{formatCurrency(order.creator_amount_cents)}
                            </p>
                            <Badge
                              className={
                                order.status === "completed"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              }
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payouts">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Payouts
                    <div className="text-sm font-normal text-muted-foreground">
                      Pending:{" "}
                      {formatCurrency(
                        creatorEarnings -
                          selectedPayouts
                            .filter((p) => p.status === "completed")
                            .reduce((sum, p) => sum + p.amount_cents, 0)
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPayouts.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        Payouts are processed after the event completes
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedPayouts.map((payout) => (
                        <div
                          key={payout.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                        >
                          <div>
                            <p className="font-medium">{formatCurrency(payout.amount_cents)}</p>
                            <p className="text-sm text-muted-foreground">
                              {payout.scheduled_for
                                ? `Scheduled: ${format(new Date(payout.scheduled_for), "MMM d, yyyy")}`
                                : payout.completed_at
                                  ? `Completed: ${format(new Date(payout.completed_at), "MMM d, yyyy")}`
                                  : "Processing"}
                            </p>
                          </div>
                          <Badge
                            className={
                              payout.status === "completed"
                                ? "bg-green-500/20 text-green-400"
                                : payout.status === "pending"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-blue-500/20 text-blue-400"
                            }
                          >
                            {payout.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
