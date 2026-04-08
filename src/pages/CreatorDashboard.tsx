import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
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
  ArrowUpRight
} from "lucide-react";
import { format } from "date-fns";
import { HostCalendarView } from "@/components/dashboard/HostCalendarView";

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
}

interface Ticket {
  id: string;
  name: string;
  price_cents: number;
  qty_total: number;
  qty_sold: number;
  qty_reserved: number;
  event_id: string;
}

interface Order {
  id: string;
  amount_cents: number;
  creator_amount_cents: number;
  platform_fee_cents: number;
  status: string;
  created_at: string;
  buyer_email: string;
  buyer_name: string | null;
  event_id: string;
}

interface Payout {
  id: string;
  amount_cents: number;
  status: string;
  scheduled_for: string | null;
  completed_at: string | null;
  event_id: string;
}

export default function CreatorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
        fetchCreatorData(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/login");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchCreatorData = async (userId: string) => {
    // Fetch events created by the user
    const { data: eventsData } = await supabase
      .from("events")
      .select("*")
      .eq("creator_id", userId)
      .order("start_at", { ascending: false });

    if (eventsData) {
      setEvents(eventsData);
      if (eventsData.length > 0 && !selectedEventId) {
        setSelectedEventId(eventsData[0].id);
      }
    }

    // Fetch tickets for all events
    if (eventsData && eventsData.length > 0) {
      const eventIds = eventsData.map(e => e.id);
      
      const { data: ticketsData } = await supabase
        .from("tickets")
        .select("*")
        .in("event_id", eventIds);
      
      if (ticketsData) setTickets(ticketsData);

      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .in("event_id", eventIds)
        .order("created_at", { ascending: false });
      
      if (ordersData) setOrders(ordersData);

      const { data: payoutsData } = await supabase
        .from("payouts")
        .select("*")
        .in("event_id", eventIds)
        .order("created_at", { ascending: false });
      
      if (payoutsData) setPayouts(payoutsData);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
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

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedTickets = tickets.filter(t => t.event_id === selectedEventId);
  const selectedOrders = orders.filter(o => o.event_id === selectedEventId);
  const selectedPayouts = payouts.filter(p => p.event_id === selectedEventId);

  // Calculate stats for selected event
  const totalRevenue = selectedOrders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + o.amount_cents, 0);
  
  const creatorEarnings = selectedOrders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + o.creator_amount_cents, 0);
  
  const totalTicketsSold = selectedTickets.reduce((sum, t) => sum + t.qty_sold, 0);
  const totalCapacity = selectedTickets.reduce((sum, t) => sum + t.qty_total, 0);

  // Calculate all-time stats
  const allTimeRevenue = orders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + o.creator_amount_cents, 0);
  
  const allTimeTickets = tickets.reduce((sum, t) => sum + t.qty_sold, 0);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="pt-8 pb-20">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                  Creator <span className="text-primary">Dashboard</span>
                </h1>
                <p className="text-muted-foreground">
                  Manage your events, track sales, and view payouts
                </p>
              </div>
              <Button variant="default" asChild>
                <Link to="/submit">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Link>
              </Button>
            </div>

            {/* All-time Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="glass">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{events.length}</p>
                      <p className="text-xs text-muted-foreground">Total Events</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{formatCurrency(allTimeRevenue)}</p>
                      <p className="text-xs text-muted-foreground">Total Earnings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                      <Ticket className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{allTimeTickets}</p>
                      <p className="text-xs text-muted-foreground">Tickets Sold</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{orders.filter(o => o.status === "completed").length}</p>
                      <p className="text-xs text-muted-foreground">Total Orders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="events" className="space-y-6">
              <TabsList className="glass">
                <TabsTrigger value="events">My Events</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
              </TabsList>

              <TabsContent value="calendar">
                {user && <HostCalendarView userId={user.id} />}
              </TabsContent>

              <TabsContent value="events">
            {events.length === 0 ? (
              <Card className="glass text-center py-12">
                <CardContent>
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No events yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Submit your first event and start building your night.
                  </p>
                  <Button variant="default" asChild>
                    <Link to="/submit">Create Event</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Event List */}
                <div className="lg:col-span-1 space-y-4">
                  <h2 className="font-display text-lg font-semibold">Your Events</h2>
                  <div className="space-y-2">
                    {events.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEventId(event.id)}
                        className={`w-full p-4 rounded-xl text-left transition-colors ${
                          selectedEventId === event.id
                            ? "bg-primary/20 border border-primary/40"
                            : "bg-secondary/50 hover:bg-secondary/80 border border-transparent"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-medium line-clamp-1">{event.title}</h3>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status.replace(/_/g, " ")}
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
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

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
                        <Card className="glass">
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              {selectedEvent.title}
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/events/${selectedEvent.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Page
                                </Link>
                              </Button>
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
                                  {selectedEvent.status.replace(/_/g, " ")}
                                </Badge>
                              </div>
                            </div>

                            {selectedEvent.description && (
                              <p className="text-sm text-muted-foreground">
                                {selectedEvent.description}
                              </p>
                            )}
                          </CardContent>
                        </Card>

                        {/* Event Stats */}
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
                              <p className="text-2xl font-bold text-green-400">{formatCurrency(creatorEarnings)}</p>
                            </CardContent>
                          </Card>
                          
                          <Card className="glass">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Ticket className="w-4 h-4" />
                                <span className="text-sm">Tickets Sold</span>
                              </div>
                              <p className="text-2xl font-bold">{totalTicketsSold} / {totalCapacity}</p>
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
                                  : 0}%
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      <TabsContent value="tickets" className="space-y-4">
                        <Card className="glass">
                          <CardHeader>
                            <CardTitle>Ticket Types</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {selectedTickets.length === 0 ? (
                              <p className="text-muted-foreground text-center py-8">
                                No tickets created yet
                              </p>
                            ) : (
                              <div className="space-y-4">
                                {selectedTickets.map((ticket) => (
                                  <div 
                                    key={ticket.id}
                                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                                  >
                                    <div>
                                      <h4 className="font-medium">{ticket.name}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {formatCurrency(ticket.price_cents)}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium">
                                        {ticket.qty_sold} / {ticket.qty_total} sold
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {ticket.qty_reserved} reserved
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="orders" className="space-y-4">
                        <Card className="glass">
                          <CardHeader>
                            <CardTitle>Recent Orders</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {selectedOrders.length === 0 ? (
                              <p className="text-muted-foreground text-center py-8">
                                No orders yet
                              </p>
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
                                      <Badge className={
                                        order.status === "completed" 
                                          ? "bg-green-500/20 text-green-400"
                                          : "bg-yellow-500/20 text-yellow-400"
                                      }>
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

                      <TabsContent value="payouts" className="space-y-4">
                        <Card className="glass">
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              Payouts
                              <div className="text-sm font-normal text-muted-foreground">
                                Pending: {formatCurrency(creatorEarnings - selectedPayouts.filter(p => p.status === "completed").reduce((sum, p) => sum + p.amount_cents, 0))}
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
                                            : "Processing"
                                        }
                                      </p>
                                    </div>
                                    <Badge className={
                                      payout.status === "completed" 
                                        ? "bg-green-500/20 text-green-400"
                                        : payout.status === "pending"
                                          ? "bg-yellow-500/20 text-yellow-400"
                                          : "bg-blue-500/20 text-blue-400"
                                    }>
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
            )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </Layout>
  );
}
