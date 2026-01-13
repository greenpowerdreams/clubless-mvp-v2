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
  Ticket,
  DollarSign,
  ExternalLink
} from "lucide-react";
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

export function AdminEventsTab() {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const updateEventStatus = async (eventId: string, newStatus: string) => {
    const { error } = await supabase
      .from("events")
      .update({ status: newStatus as "draft" | "pending_approval" | "approved" | "published" | "live" | "completed" | "cancelled" })
      .eq("id", eventId);

    if (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } else {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: newStatus } : e));
      toast({ title: "Status Updated" });
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
    return matchesSearch && matchesStatus;
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
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold truncate">{event.title}</h3>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status.replace(/_/g, " ")}
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
                        <Button variant="outline" size="icon" asChild>
                          <Link to={`/events/${event.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
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
    </div>
  );
}
