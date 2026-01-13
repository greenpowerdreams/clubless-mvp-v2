import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Send,
  Calendar,
  Search,
  Plus,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Payout {
  id: string;
  event_id: string;
  creator_id: string;
  amount_cents: number;
  status: string;
  scheduled_for: string | null;
  completed_at: string | null;
  failure_reason: string | null;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  status: string;
  creator_id: string;
}

interface Order {
  id: string;
  event_id: string;
  creator_amount_cents: number;
  status: string;
}

interface Profile {
  user_id: string;
  display_name: string | null;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "scheduled", label: "Scheduled" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

export function AdminPayoutsTab() {
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Create payout dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Process payout dialog
  const [processingPayoutId, setProcessingPayoutId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [payoutsRes, eventsRes, ordersRes, profilesRes] = await Promise.all([
        supabase.from("payouts").select("*").order("created_at", { ascending: false }),
        supabase.from("events").select("id, title, status, creator_id"),
        supabase.from("orders").select("id, event_id, creator_amount_cents, status").eq("status", "completed"),
        supabase.from("profiles").select("user_id, display_name"),
      ]);

      if (payoutsRes.data) setPayouts(payoutsRes.data);
      if (eventsRes.data) setEvents(eventsRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
    } catch (error) {
      console.error("Error fetching payouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400",
      scheduled: "bg-blue-500/20 text-blue-400",
      processing: "bg-primary/20 text-primary",
      completed: "bg-green-500/20 text-green-400",
      failed: "bg-destructive/20 text-destructive",
      cancelled: "bg-muted text-muted-foreground",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  const getEventTitle = (eventId: string) => {
    return events.find(e => e.id === eventId)?.title || "Unknown Event";
  };

  const getCreatorName = (creatorId: string) => {
    return profiles.find(p => p.user_id === creatorId)?.display_name || "Unknown Creator";
  };

  const getEventEarnings = (eventId: string) => {
    return orders
      .filter(o => o.event_id === eventId)
      .reduce((sum, o) => sum + o.creator_amount_cents, 0);
  };

  const getEventPaidOut = (eventId: string) => {
    return payouts
      .filter(p => p.event_id === eventId && p.status === "completed")
      .reduce((sum, p) => sum + p.amount_cents, 0);
  };

  // Get events eligible for payout (completed, has earnings, not fully paid)
  const eligibleEvents = events.filter(e => {
    const earnings = getEventEarnings(e.id);
    const paidOut = getEventPaidOut(e.id);
    return earnings > 0 && earnings > paidOut;
  });

  const handleCreatePayout = async () => {
    if (!selectedEventId) return;

    const event = events.find(e => e.id === selectedEventId);
    if (!event) return;

    const earnings = getEventEarnings(selectedEventId);
    const paidOut = getEventPaidOut(selectedEventId);
    const pendingAmount = earnings - paidOut;

    if (pendingAmount <= 0) {
      toast({ title: "No pending amount", description: "All earnings have been paid out.", variant: "destructive" });
      return;
    }

    setIsCreating(true);

    const { data, error } = await supabase
      .from("payouts")
      .insert({
        event_id: selectedEventId,
        creator_id: event.creator_id,
        amount_cents: pendingAmount,
        status: scheduledDate ? "scheduled" : "pending",
        scheduled_for: scheduledDate || null,
      })
      .select()
      .single();

    setIsCreating(false);

    if (error) {
      toast({ title: "Error", description: "Failed to create payout", variant: "destructive" });
    } else {
      setPayouts(prev => [data, ...prev]);
      setShowCreateDialog(false);
      setSelectedEventId("");
      setScheduledDate("");
      toast({ title: "Payout Created", description: `Payout of ${formatCurrency(pendingAmount)} created.` });
    }
  };

  const handleProcessPayout = async (payoutId: string) => {
    setIsProcessing(true);
    setProcessingPayoutId(payoutId);

    const payout = payouts.find(p => p.id === payoutId);
    if (!payout) return;

    // Update to processing
    await supabase.from("payouts").update({ status: "processing" }).eq("id", payoutId);
    setPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: "processing" } : p));

    // Simulate processing delay (in real app, this would call Stripe)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mark as completed
    const { error } = await supabase
      .from("payouts")
      .update({ 
        status: "completed", 
        completed_at: new Date().toISOString() 
      })
      .eq("id", payoutId);

    if (error) {
      await supabase.from("payouts").update({ 
        status: "failed", 
        failure_reason: "Processing error" 
      }).eq("id", payoutId);
      setPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: "failed", failure_reason: "Processing error" } : p));
      toast({ title: "Payout Failed", variant: "destructive" });
    } else {
      setPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: "completed", completed_at: new Date().toISOString() } : p));
      
      // Send notification email
      const event = events.find(e => e.id === payout.event_id);
      try {
        await supabase.functions.invoke("send-payout-notification", {
          body: {
            payout_id: payoutId,
            to_email: "creator@example.com", // Would get from profiles
            creator_name: getCreatorName(payout.creator_id),
            event_title: event?.title || "Event",
            amount_cents: payout.amount_cents,
            status: "completed",
            completed_date: format(new Date(), "MMMM d, yyyy"),
          },
        });
      } catch (e) {
        console.error("Failed to send payout notification:", e);
      }

      toast({ title: "Payout Completed", description: `${formatCurrency(payout.amount_cents)} has been sent.` });
    }

    setIsProcessing(false);
    setProcessingPayoutId(null);
  };

  const filteredPayouts = payouts.filter(payout => {
    const matchesStatus = statusFilter === "all" || payout.status === statusFilter;
    const eventTitle = getEventTitle(payout.event_id).toLowerCase();
    const matchesSearch = eventTitle.includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate totals
  const totalPending = payouts
    .filter(p => p.status === "pending" || p.status === "scheduled")
    .reduce((sum, p) => sum + p.amount_cents, 0);
  
  const totalCompleted = payouts
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + p.amount_cents, 0);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading payouts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatCurrency(totalPending)}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatCurrency(totalCompleted)}</p>
                <p className="text-xs text-muted-foreground">Paid Out</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{payouts.length}</p>
                <p className="text-xs text-muted-foreground">Total Payouts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-xl font-bold">{payouts.filter(p => p.status === "failed").length}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowCreateDialog(true)} disabled={eligibleEvents.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          Create Payout
        </Button>
      </div>

      {/* Create Payout Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Event</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleEvents.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title} ({formatCurrency(getEventEarnings(e.id) - getEventPaidOut(e.id))} pending)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEventId && (
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Payout Amount</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(getEventEarnings(selectedEventId) - getEventPaidOut(selectedEventId))}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Schedule For (optional)</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreatePayout} disabled={!selectedEventId || isCreating}>
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payouts List */}
      {filteredPayouts.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No payouts found</h3>
          <p className="text-muted-foreground">
            Payouts will appear here when created.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayouts.map((payout) => (
            <Card key={payout.id} className="glass">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{getEventTitle(payout.event_id)}</h3>
                      <Badge className={getStatusColor(payout.status)}>
                        {payout.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span>Creator: {getCreatorName(payout.creator_id)}</span>
                      <span>Created: {format(new Date(payout.created_at), "MMM d, yyyy")}</span>
                      {payout.scheduled_for && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Scheduled: {format(new Date(payout.scheduled_for), "MMM d, yyyy")}
                        </span>
                      )}
                      {payout.completed_at && (
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Completed: {format(new Date(payout.completed_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    {payout.failure_reason && (
                      <p className="text-sm text-destructive mt-2">
                        Failed: {payout.failure_reason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(payout.amount_cents)}</p>
                    </div>
                    
                    {(payout.status === "pending" || payout.status === "scheduled") && (
                      <Button 
                        onClick={() => handleProcessPayout(payout.id)}
                        disabled={isProcessing && processingPayoutId === payout.id}
                      >
                        {isProcessing && processingPayoutId === payout.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Process
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
