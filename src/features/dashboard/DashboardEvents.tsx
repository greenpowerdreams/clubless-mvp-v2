import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreatorEvents } from "./hooks/useCreatorEvents";
import { formatCurrency, getStatusColor, formatStatus } from "./hooks/types";
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
} from "lucide-react";
import { format } from "date-fns";

interface DashboardEventsProps {
  userId: string;
}

export function DashboardEvents({ userId }: DashboardEventsProps) {
  const { data: creatorData, isLoading } = useCreatorEvents(userId);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

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
            <Link to="/submit">Create Event</Link>
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
            <Link to="/submit">
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
