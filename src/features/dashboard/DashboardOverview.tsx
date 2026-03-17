import { Crown, Gift, Calendar, DollarSign, Ticket, TrendingUp, Shield, Clock, Zap, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserLevel } from "./hooks/useUserLevel";
import { useUserStats } from "./hooks/useUserStats";
import { useCreatorEvents } from "./hooks/useCreatorEvents";
import {
  LEVEL_COLORS,
  PERK_LABELS,
  formatCurrency,
  formatCurrencyWhole,
} from "./hooks/types";

interface DashboardOverviewProps {
  userId: string;
}

export function DashboardOverview({ userId }: DashboardOverviewProps) {
  const { data: userLevel, isLoading: levelLoading } = useUserLevel(userId);
  const { data: userStats, isLoading: statsLoading } = useUserStats(userId);
  const { data: creatorData, isLoading: eventsLoading } = useCreatorEvents(userId);

  const levelColors = userLevel
    ? LEVEL_COLORS[userLevel.current_level] || LEVEL_COLORS[1]
    : LEVEL_COLORS[1];

  // Compute stats from creator data
  const allTimeRevenue = creatorData?.orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.creator_amount_cents, 0) ?? 0;

  const allTimeTickets = creatorData?.tickets.reduce((sum, t) => sum + t.qty_sold, 0) ?? 0;

  const completedOrders = creatorData?.orders.filter((o) => o.status === "completed").length ?? 0;

  const getLevelProgress = () => {
    if (!userLevel || userLevel.next_level === null || userLevel.events_to_next_level === null) {
      return 100;
    }
    const completedEvents = userStats?.lifetime_events_completed || 0;
    const levelThresholds = [0, 2, 5, 10];
    const currentThreshold = levelThresholds[userLevel.current_level - 1] || 0;
    const nextThreshold = levelThresholds[userLevel.current_level] || currentThreshold;
    if (nextThreshold === currentThreshold) return 100;
    const progress = ((completedEvents - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  if (levelLoading || statsLoading || eventsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Level & Perks Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Your Level */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl ${levelColors.bg} flex items-center justify-center`}>
              <Crown className={`w-6 h-6 ${levelColors.icon}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Level</p>
              <p className={`text-xl font-bold ${levelColors.text}`}>
                {userLevel?.level_name || "Starter"}
              </p>
            </div>
          </div>

          {userLevel && userLevel.next_level !== null && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Progress to {userLevel.next_level_name}
                </span>
                <span className="font-medium">
                  {userLevel.events_to_next_level} events to go
                </span>
              </div>
              <Progress value={getLevelProgress()} className="h-2" />
            </div>
          )}

          {userLevel && userLevel.next_level === null && (
            <p className="text-sm text-muted-foreground">
              You've reached the highest level!
            </p>
          )}

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Your Stats</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Completed: </span>
                <span className="font-medium">{userStats?.lifetime_events_completed || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Published: </span>
                <span className="font-medium">{userStats?.lifetime_events_published || 0}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Total Profit: </span>
                <span className="font-medium text-green-400">
                  {formatCurrencyWhole(userStats?.lifetime_profit_generated || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Perks */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <Gift className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Perks</p>
              <p className="text-lg font-semibold">Active Benefits</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">
                  {userLevel ? `${userLevel.service_fee_percent}% Service Fee` : "15% Service Fee"}
                </span>
                {userLevel && userLevel.service_fee_percent < 15 && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                    {15 - userLevel.service_fee_percent}% saved
                  </span>
                )}
              </div>
            </div>

            {userLevel?.perks &&
              Object.entries(userLevel.perks).map(([key, value]) => {
                if (key === "service_fee_percent" || value === false) return null;
                const perkInfo = PERK_LABELS[key];
                if (!perkInfo) return null;
                return (
                  <div key={key} className="flex items-center gap-2 text-sm text-muted-foreground">
                    {perkInfo.icon}
                    <span>{perkInfo.label}</span>
                    <span className="text-green-400 ml-auto">Active</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{creatorData?.events.length ?? 0}</p>
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
                <p className="text-2xl font-bold">{completedOrders}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
