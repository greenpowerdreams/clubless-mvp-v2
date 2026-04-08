import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, DollarSign, ShieldCheck, Users, BarChart3, TrendingUp } from "lucide-react";
import type { CalculatorInputs, CalculatorOutputs } from "./calculator.types";

export interface ViabilityScoreCardFactor {
  label: string;
  weight: number; // 0–1, e.g. 0.3 = 30%
  score: number;  // 0–10
}

interface ViabilityScoreCardProps {
  score: number;           // 0–100
  factors: ViabilityScoreCardFactor[];
  inputs: CalculatorInputs;
  result: CalculatorOutputs;
  eventType: string;
}

// ── Tier config ──────────────────────────────────────────────────────────────

interface TierConfig {
  emoji: string;
  name: string;
  description: string;
  badgeClass: string;
  scoreClass: string;
  barClass: string;
}

function getTierConfig(score: number): TierConfig {
  if (score >= 85) {
    return {
      emoji: "🥂",
      name: "Top Shelf",
      description: "Exceptional economics. This event is a rare money-making machine.",
      badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      scoreClass: "text-purple-300",
      barClass: "bg-purple-400",
    };
  }
  if (score >= 70) {
    return {
      emoji: "⚡",
      name: "Solid Night",
      description: "Solid margins and a healthy attendance buffer. Go for it.",
      badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      scoreClass: "text-blue-300",
      barClass: "bg-blue-400",
    };
  }
  if (score >= 55) {
    return {
      emoji: "✅",
      name: "Worth Running",
      description: "Viable and profitable. A few tweaks could push you higher.",
      badgeClass: "bg-green-500/20 text-green-300 border-green-500/40",
      scoreClass: "text-green-400",
      barClass: "bg-green-400",
    };
  }
  if (score >= 40) {
    return {
      emoji: "⚠️",
      name: "Tread Carefully",
      description: "Proceed with caution. Margins are thin and risk is elevated.",
      badgeClass: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
      scoreClass: "text-yellow-400",
      barClass: "bg-yellow-400",
    };
  }
  return {
    emoji: "🚫",
    name: "Don't Book It",
    description: "The numbers don't work at current settings. Restructure costs or pricing.",
    badgeClass: "bg-red-500/20 text-red-300 border-red-500/40",
    scoreClass: "text-red-400",
    barClass: "bg-red-400",
  };
}

// ── Actionable tip ────────────────────────────────────────────────────────────

function getActionableTip(
  score: number,
  inputs: CalculatorInputs,
  result: CalculatorOutputs,
): string {
  const margin = result.totalRevenue > 0
    ? (result.yourTakeHome / result.totalRevenue) * 100
    : 0;
  const venuePct = result.totalRevenue > 0
    ? (inputs.venueCost / result.totalRevenue) * 100
    : 0;
  const gapToGreen = result.breakEvenAttendance > 0
    ? result.breakEvenAttendance - inputs.attendance
    : 0;

  if (score >= 70) {
    // Solid Night / Top Shelf: nudge ticket price
    const bump = 3;
    return `Great work. Raise the ticket price by $${bump} to push into ${score >= 85 ? "Top Shelf" : "Solid Night"} territory and add ~$${(bump * inputs.attendance).toLocaleString()} to take-home.`;
  }

  if (score >= 40) {
    // Yellow Light: tell them how many more guests they need
    if (gapToGreen > 0) {
      return `You need ${gapToGreen} more attendees to break even. Aim for at least ${result.breakEvenAttendance} guests to turn a profit.`;
    }
    return `Your profit margin is ${margin.toFixed(0)}%. Increase ticket price or reduce staffing costs to improve viability.`;
  }

  // Red Light: venue cost advice
  if (venuePct > 40) {
    return `Your venue cost is ${venuePct.toFixed(0)}% of revenue ($${inputs.venueCost.toLocaleString()}). Consider negotiating a revenue-share deal or finding a lower-cost space.`;
  }
  return `Total costs exceed revenue. Raise ticket prices, add bar revenue, or cut fixed costs. You need at least $${(result.totalCosts - result.totalRevenue).toLocaleString()} more in revenue to break even.`;
}

// ── Factor icons ──────────────────────────────────────────────────────────────

const FACTOR_ICONS: Record<string, React.ReactNode> = {
  "Profit Margin":     <DollarSign className="w-4 h-4" />,
  "Break-Even Safety": <ShieldCheck className="w-4 h-4" />,
  "Profit per Guest":  <Users className="w-4 h-4" />,
  "Cost Efficiency":   <BarChart3 className="w-4 h-4" />,
  "Event Scale":       <TrendingUp className="w-4 h-4" />,
};

function getFactorBarClass(score: number): string {
  if (score >= 8) return "bg-green-400";
  if (score >= 6) return "bg-blue-400";
  if (score >= 4) return "bg-yellow-400";
  return "bg-red-500";
}

function getFactorScoreClass(score: number): string {
  if (score >= 8) return "text-green-400";
  if (score >= 6) return "text-blue-400";
  if (score >= 4) return "text-yellow-400";
  return "text-red-400";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ViabilityScoreCard({
  score,
  factors,
  inputs,
  result,
  eventType,
}: ViabilityScoreCardProps) {
  const tier = getTierConfig(score);
  const tip = getActionableTip(score, inputs, result);

  return (
    <Card className="glass border-primary/20 overflow-hidden">
      {/* Subtle gradient header accent */}
      <div
        className="h-1 w-full"
        style={{
          background:
            score >= 85
              ? "linear-gradient(90deg, #7c3aed, #a855f7)"
              : score >= 70
              ? "linear-gradient(90deg, #2563eb, #60a5fa)"
              : score >= 55
              ? "linear-gradient(90deg, #16a34a, #4ade80)"
              : score >= 40
              ? "linear-gradient(90deg, #ca8a04, #facc15)"
              : "linear-gradient(90deg, #dc2626, #f87171)",
        }}
      />

      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-4 h-4 text-primary" />
          Event Viability Score
          <span className="ml-auto text-xs text-muted-foreground font-normal capitalize">
            {eventType}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ── Big score + tier badge ── */}
        <div className="flex flex-col items-center gap-3 py-2">
          <p className={`text-7xl font-black tabular-nums leading-none ${tier.scoreClass}`}>
            {score}
            <span className="text-3xl font-semibold text-muted-foreground">/100</span>
          </p>

          <Badge
            variant="outline"
            className={`text-sm px-3 py-1 font-semibold border ${tier.badgeClass}`}
          >
            {tier.emoji}&nbsp;{tier.name}
          </Badge>

          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {tier.description}
          </p>
        </div>

        {/* ── Actionable tip ── */}
        <div className="rounded-lg bg-muted/40 border border-border/50 px-4 py-3">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
            Next Move
          </p>
          <p className="text-sm text-foreground/90">{tip}</p>
        </div>

        {/* ── Factor breakdown ── */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Score Breakdown
          </p>

          {factors.map((factor) => {
            const weightPct = Math.round(factor.weight * 100);
            const barWidth = `${factor.score * 10}%`;
            const icon = FACTOR_ICONS[factor.label] ?? <BarChart3 className="w-4 h-4" />;

            return (
              <div key={factor.label} className="space-y-1.5">
                {/* Label row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {icon}
                    <span className="font-medium text-foreground">{factor.label}</span>
                    <span className="text-xs">({weightPct}%)</span>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${getFactorScoreClass(factor.score)}`}>
                    {factor.score}/10
                  </span>
                </div>

                {/* Progress bar */}
                <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${getFactorBarClass(factor.score)}`}
                    style={{ width: barWidth }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
