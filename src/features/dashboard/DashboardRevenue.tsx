import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreatorEvents } from "./hooks/useCreatorEvents";
import { useUserLevel } from "./hooks/useUserLevel";
import { useUserStats } from "./hooks/useUserStats";
import { formatCurrency, formatCurrencyWhole, LEVEL_COLORS } from "./hooks/types";
import { DollarSign, TrendingUp, Crown, ArrowUpRight, Clock } from "lucide-react";
import { format } from "date-fns";

interface DashboardRevenueProps {
  userId: string;
}

export function DashboardRevenue({ userId }: DashboardRevenueProps) {
  const { data: creatorData, isLoading: eventsLoading } = useCreatorEvents(userId);
  const { data: userLevel, isLoading: levelLoading } = useUserLevel(userId);
  const { data: userStats, isLoading: statsLoading } = useUserStats(userId);

  if (eventsLoading || levelLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const { orders, payouts, events } = creatorData ?? { orders: [], payouts: [], events: [] };

  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.amount_cents, 0);

  const totalEarnings = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.creator_amount_cents, 0);

  const totalPlatformFees = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.platform_fee_cents, 0);

  const totalPaidOut = payouts
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount_cents, 0);

  const pendingPayout = totalEarnings - totalPaidOut;

  const levelColors = userLevel
    ? LEVEL_COLORS[userLevel.current_level] || LEVEL_COLORS[1]
    : LEVEL_COLORS[1];

  // Revenue by event
  const eventRevenue = events.map((event) => {
    const eventOrders = orders.filter(
      (o) => o.event_id === event.id && o.status === "completed"
    );
    const revenue = eventOrders.reduce((sum, o) => sum + o.creator_amount_cents, 0);
    return { title: event.title, revenue, city: event.city, start_at: event.start_at };
  }).filter((e) => e.revenue > 0);

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Lifetime Earnings</span>
            </div>
            <p className="text-3xl font-bold text-green-400">{formatCurrency(totalEarnings)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              From {formatCurrency(totalRevenue)} total revenue
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Pending Payout</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(pendingPayout)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(totalPaidOut)} already paid
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Crown className={`w-4 h-4 ${levelColors.icon}`} />
              <span className="text-sm">Your Fee Rate</span>
            </div>
            <p className={`text-3xl font-bold ${levelColors.text}`}>
              {userLevel?.service_fee_percent ?? 20}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {userLevel && userLevel.service_fee_percent < 20
                ? `Saving ${20 - userLevel.service_fee_percent}% as ${userLevel.level_name}`
                : "Complete events to unlock lower fees"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Event */}
      {eventRevenue.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Revenue by Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {eventRevenue.map((event, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                >
                  <div>
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {event.city} &middot; {format(new Date(event.start_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-green-400">
                    {formatCurrency(event.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout History */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                Payouts appear here after events complete
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                >
                  <div>
                    <p className="font-medium">{formatCurrency(payout.amount_cents)}</p>
                    <p className="text-sm text-muted-foreground">
                      {payout.completed_at
                        ? `Completed ${format(new Date(payout.completed_at), "MMM d, yyyy")}`
                        : payout.scheduled_for
                          ? `Scheduled ${format(new Date(payout.scheduled_for), "MMM d, yyyy")}`
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
    </div>
  );
}
