import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreatorEvents } from "@/features/dashboard/hooks/useCreatorEvents";
import { useCalculatorSnapshots } from "./hooks/useCalculatorSnapshots";
import { useUserLevel } from "@/features/dashboard/hooks/useUserLevel";
import { formatCurrency } from "@/features/dashboard/hooks/types";
import {
  TrendingUp,
  Calculator,
  BarChart3,
  Target,
  DollarSign,
  Sparkles,
} from "lucide-react";

interface DashboardAnalyticsProps {
  userId: string;
}

export function DashboardAnalytics({ userId }: DashboardAnalyticsProps) {
  const { data: creatorData, isLoading: eventsLoading } = useCreatorEvents(userId);
  const { data: snapshots, isLoading: snapshotsLoading } = useCalculatorSnapshots(userId);
  const { data: userLevel, isLoading: levelLoading } = useUserLevel(userId);

  if (eventsLoading || snapshotsLoading || levelLoading) {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const { events, orders, tickets } = creatorData ?? { events: [], orders: [], tickets: [] };

  const completedOrders = orders.filter((o) => o.status === "completed");
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.amount_cents, 0);
  const totalEarnings = completedOrders.reduce((sum, o) => sum + o.creator_amount_cents, 0);
  const totalFees = completedOrders.reduce((sum, o) => sum + o.platform_fee_cents, 0);
  const totalTicketsSold = tickets.reduce((sum, t) => sum + t.qty_sold, 0);
  const totalCapacity = tickets.reduce((sum, t) => sum + t.qty_total, 0);
  const avgSellThrough = totalCapacity > 0 ? (totalTicketsSold / totalCapacity) * 100 : 0;
  const avgTicketPrice = totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0;
  const avgViability = snapshots && snapshots.length > 0
    ? snapshots.reduce((sum, s) => sum + (s.viability_score ?? 0), 0) / snapshots.length
    : null;

  // Per-event performance
  const eventPerformance = events.map((event) => {
    const eventOrders = completedOrders.filter((o) => o.event_id === event.id);
    const eventTickets = tickets.filter((t) => t.event_id === event.id);
    const revenue = eventOrders.reduce((sum, o) => sum + o.amount_cents, 0);
    const earnings = eventOrders.reduce((sum, o) => sum + o.creator_amount_cents, 0);
    const sold = eventTickets.reduce((sum, t) => sum + t.qty_sold, 0);
    const capacity = eventTickets.reduce((sum, t) => sum + t.qty_total, 0);
    return {
      title: event.title,
      revenue,
      earnings,
      sold,
      capacity,
      sellThrough: capacity > 0 ? (sold / capacity) * 100 : 0,
    };
  }).filter((e) => e.revenue > 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Avg Revenue / Event</span>
            </div>
            <p className="text-2xl font-bold">
              {events.length > 0 ? formatCurrency(Math.round(totalRevenue / events.length)) : "$0"}
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="w-4 h-4" />
              <span className="text-sm">Avg Sell-through</span>
            </div>
            <p className="text-2xl font-bold">{avgSellThrough.toFixed(0)}%</p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Avg Ticket Price</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(Math.round(avgTicketPrice))}</p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Avg Viability Score</span>
            </div>
            <p className="text-2xl font-bold">
              {avgViability !== null ? `${avgViability.toFixed(1)}/10` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Fees Saved */}
      {userLevel && userLevel.service_fee_percent < 15 && (
        <Card className="glass border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fee Savings as {userLevel.level_name}</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(Math.round(totalEarnings * ((15 - userLevel.service_fee_percent) / 100)))}
                </p>
                <p className="text-xs text-muted-foreground">
                  Saved {15 - userLevel.service_fee_percent}% compared to Starter level
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Performance Table */}
      {eventPerformance.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Event Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eventPerformance.map((event, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{event.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{event.sold}/{event.capacity} tickets</span>
                      <span>{event.sellThrough.toFixed(0)}% sold</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400">{formatCurrency(event.earnings)}</p>
                    <p className="text-xs text-muted-foreground">of {formatCurrency(event.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calculator History */}
      {snapshots && snapshots.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Calculator History ({snapshots.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {snapshots.slice(0, 5).map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 text-sm"
                >
                  <div>
                    <span className="font-medium">
                      {(snapshot.inputs_json as any).attendance} guests
                    </span>
                    <span className="text-muted-foreground mx-2">@</span>
                    <span>${(snapshot.inputs_json as any).ticketPrice}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-400 font-medium">
                      ${Math.round((snapshot.outputs_json as any).yourTakeHome).toLocaleString()}
                    </span>
                    {snapshot.viability_score !== null && (
                      <span className={`font-bold ${
                        snapshot.viability_score >= 8 ? "text-green-400" :
                        snapshot.viability_score >= 6 ? "text-blue-400" :
                        snapshot.viability_score >= 4 ? "text-yellow-400" : "text-destructive"
                      }`}>
                        {snapshot.viability_score}/10
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
