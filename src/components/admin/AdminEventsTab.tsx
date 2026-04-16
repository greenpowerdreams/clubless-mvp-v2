import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar,
  MapPin,
  Users,
  Eye,
  Search,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  description: string | null;
  city: string;
  start_at: string;
  end_at: string;
  status: string;
  capacity: number;
  cover_image_url: string | null;
  creator_id: string;
  source: string | null;
  source_url: string | null;
}

interface Ticket {
  id: string;
  name: string;
  price_cents: number;
  qty_total: number;
  qty_sold: number;
  event_id: string;
}

interface Order {
  id: string;
  event_id: string;
  amount_cents: number;
  status: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

// Admin filter: default to 'platform' so scraped feed doesn't drown out real submissions.
// Flip to 'all' or a specific scraper source to moderate that surface.
const SOURCE_OPTIONS = [
  { value: "platform", label: "Clubless Only" },
  { value: "all", label: "All Sources" },
  { value: "eventbrite", label: "Eventbrite (scraped)" },
  { value: "posh", label: "Posh (scraped)" },
  { value: "manual", label: "Manual" },
];

const getSourceColor = (source: string | null) => {
  switch (source) {
    case "platform":
      return "bg-primary/20 text-primary";
    case "eventbrite":
      return "bg-orange-500/20 text-orange-400";
    case "posh":
      return "bg-pink-500/20 text-pink-400";
    case "manual":
      return "bg-purple-500/20 text-purple-400";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function AdminEventsTab() {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("platform");
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Rejection reason dialog state
  const [rejectTarget, setRejectTarget] = useState<{ eventId: string; title: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, ticketsRes, ordersRes] = await Promise.all([
        supabase.from("events").select("*").order("start_at", { ascending: false }),
        supabase.from("tickets").select("*"),
        supabase.from("orders").select("id, event_id, amount_cents, status"),
      ]);

      if (eventsRes.data) setEvents(eventsRes.data);
      if (ticketsRes.data) setTickets(ticketsRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  // Status transitions that trigger lifecycle emails to the creator
  const EMAIL_STATUSES = new Set(["approved", "published", "completed"]);

  const updateEventStatus = async (eventId: string, newStatus: string) => {
    // If rejecting (cancelled), show the reason dialog instead of updating immediately
    if (newStatus === "cancelled") {
      const ev = events.find((e) => e.id === eventId);
      setRejectTarget({ eventId, title: ev?.title || "this event" });
      setRejectionReason("");
      return; // The dialog's confirm handler calls doUpdateStatus
    }
    await doUpdateStatus(eventId, newStatus);
  };

  const doUpdateStatus = async (eventId: string, newStatus: string, adminNotes?: string) => {
    const updateData: Record<string, unknown> = {
      status: newStatus as "draft" | "pending_approval" | "approved" | "published" | "live" | "completed" | "cancelled",
    };
    if (adminNotes) updateData.admin_notes = adminNotes;

    const { error } = await supabase.from("events").update(updateData).eq("id", eventId);

    if (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
      return;
    }

    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, status: newStatus } : e)));
    toast({ title: "Status Updated" });

    // Fire lifecycle email (best-effort, don't block UI)
    if (EMAIL_STATUSES.has(newStatus) || newStatus === "cancelled") {
      supabase.functions
        .invoke("send-event-lifecycle-email", {
          body: {
            event_id: eventId,
            new_status: newStatus === "cancelled" ? "rejected" : newStatus,
            admin_notes: adminNotes || null,
          },
        })
        .then(({ error: emailErr }) => {
          if (emailErr) console.error("Lifecycle email failed:", emailErr);
          else toast({ title: "Creator notified via email" });
        });
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await doUpdateStatus(rejectTarget.eventId, "cancelled", rejectionReason.trim() || undefined);
      setRejectTarget(null);
    } finally {
      setRejecting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Delete tickets first (FK constraint) — only platform events will have these.
      await supabase.from("tickets").delete().eq("event_id", deleteTarget.id);
      const { error } = await supabase.from("events").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      toast({ title: "Event deleted", description: deleteTarget.title });
      setDeleteTarget(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Delete failed", description: msg, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      pending_approval: "bg-yellow-500/20 text-yellow-400",
      approved: "bg-blue-500/20 text-blue-400",
      published: "bg-green-500/20 text-green-400",
      live: "bg-primary/20 text-primary",
      completed: "bg-emerald-500/20 text-emerald-400",
      cancelled: "bg-destructive/20 text-destructive",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    const matchesSource = sourceFilter === "all" || (event.source || "platform") === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const getEventStats = (eventId: string) => {
    const eventTickets = tickets.filter(t => t.event_id === eventId);
    const eventOrders = orders.filter(o => o.event_id === eventId && o.status === "completed");
    
    const ticketsSold = eventTickets.reduce((sum, t) => sum + t.qty_sold, 0);
    const totalCapacity = eventTickets.reduce((sum, t) => sum + t.qty_total, 0);
    const revenue = eventOrders.reduce((sum, o) => sum + o.amount_cents, 0);
    
    return { ticketsSold, totalCapacity, revenue, orderCount: eventOrders.length };
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading events...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_OPTIONS.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{events.length}</p>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{events.filter(e => e.status === "published" || e.status === "live").length}</p>
            <p className="text-xs text-muted-foreground">Active Events</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{tickets.reduce((sum, t) => sum + t.qty_sold, 0)}</p>
            <p className="text-xs text-muted-foreground">Tickets Sold</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-green-400">
              {formatCurrency(orders.filter(o => o.status === "completed").reduce((sum, o) => sum + o.amount_cents, 0))}
            </p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground">
            {statusFilter !== "all" ? "Try a different filter." : "Events will appear here when created."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const stats = getEventStats(event.id);
            return (
              <Card key={event.id} className="glass">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold truncate">{event.title}</h3>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status.replace(/_/g, " ")}
                        </Badge>
                        <Badge className={getSourceColor(event.source)} variant="outline">
                          {event.source || "unknown"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {event.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(event.start_at), "MMM d, yyyy h:mm a")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {event.capacity} capacity
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="font-semibold">{stats.ticketsSold}/{stats.totalCapacity}</p>
                        <p className="text-xs text-muted-foreground">Tickets</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-green-400">{formatCurrency(stats.revenue)}</p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={event.status}
                          onValueChange={(v) => updateEventStatus(event.id, v)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.slice(1).map(s => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" asChild title="Preview">
                          {event.source === "platform" || !event.source ? (
                            <Link to={`/events/${event.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          ) : event.source_url ? (
                            <a href={event.source_url} target="_blank" rel="noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : (
                            <Link to={`/events/${event.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          title="Delete"
                          onClick={() => setDeleteTarget(event)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  This permanently removes <strong>{deleteTarget.title}</strong> ({deleteTarget.source || "unknown"} source)
                  and all linked tickets. This cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejection reason dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this event?</DialogTitle>
            <DialogDescription>
              Rejecting <strong>{rejectTarget?.title}</strong>. The creator will receive an email with your reason.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection (will be sent to the creator)…"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)} disabled={rejecting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejecting}
            >
              {rejecting ? "Rejecting…" : "Reject & Notify Creator"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
