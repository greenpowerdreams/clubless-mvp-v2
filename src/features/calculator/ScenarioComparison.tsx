// ScenarioComparison — "What if it's a slow night?" panel
// Shows Conservative (60%), Realistic (80%), and Optimistic (100%) attendance side by side.

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { calculate, scoreViability } from "./calculator.engine";
import type { CalculatorInputs, CalculatorResult } from "./calculator.types";

// ----------------------------------------------------------------
// Props
// ----------------------------------------------------------------

interface ScenarioComparisonProps {
  baseInputs: CalculatorInputs;
  /** Optional override — defaults to the engine's calculate+scoreViability combo */
  calculate?: (inputs: CalculatorInputs) => CalculatorResult;
  eventType: string;
  isNightlife: boolean;
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function fmt(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function runCalculate(inputs: CalculatorInputs): CalculatorResult {
  const outputs = calculate(inputs);
  const viability = scoreViability(inputs, outputs);
  return { ...outputs, viability };
}

function getViabilityBadgeStyle(score: number): string {
  if (score >= 8) return "bg-green-500/20 text-green-400 border-green-500/30";
  if (score >= 6) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (score >= 4) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
}

function getProfitNote(
  takeHome: number,
  totalCosts: number,
  isNightlife: boolean
): { text: string; icon: React.ReactNode } {
  if (isNightlife) {
    if (takeHome > 0) return { text: "you make money", icon: <TrendingUp className="w-3 h-3" /> };
    if (takeHome === 0) return { text: "you break even", icon: <Minus className="w-3 h-3" /> };
    return { text: "you lose money", icon: <TrendingDown className="w-3 h-3" /> };
  }
  const remaining = takeHome; // for budget mode this is remaining budget
  if (remaining > 0) return { text: "budget remaining", icon: <TrendingUp className="w-3 h-3" /> };
  if (remaining === 0) return { text: "exactly on budget", icon: <Minus className="w-3 h-3" /> };
  return { text: "over budget", icon: <TrendingDown className="w-3 h-3" /> };
}

// ----------------------------------------------------------------
// Scenario definition
// ----------------------------------------------------------------

interface ScenarioConfig {
  label: string;
  pct: number;
  emphasis: "muted" | "primary" | "success";
  badge: string | null;
}

const SCENARIOS: ScenarioConfig[] = [
  { label: "Conservative", pct: 0.6, emphasis: "muted", badge: null },
  { label: "Realistic", pct: 0.8, emphasis: "primary", badge: "Most Likely" },
  { label: "Optimistic", pct: 1.0, emphasis: "success", badge: "Sold Out" },
];

// ----------------------------------------------------------------
// Column border/ring styles per emphasis
// ----------------------------------------------------------------

function columnCardClass(emphasis: ScenarioConfig["emphasis"]): string {
  switch (emphasis) {
    case "primary":
      return "border-primary/60 ring-1 ring-primary/40 relative scale-[1.02] z-10 shadow-lg shadow-primary/10";
    case "success":
      return "border-green-500/50 ring-1 ring-green-500/20";
    default:
      return "border-border/40 opacity-90";
  }
}

function headerTextClass(emphasis: ScenarioConfig["emphasis"]): string {
  switch (emphasis) {
    case "primary":
      return "text-primary";
    case "success":
      return "text-green-400";
    default:
      return "text-muted-foreground";
  }
}

function takeHomeLabelClass(emphasis: ScenarioConfig["emphasis"]): string {
  switch (emphasis) {
    case "primary":
      return "text-primary";
    case "success":
      return "text-green-400";
    default:
      return "text-foreground";
  }
}

// ----------------------------------------------------------------
// Single scenario column
// ----------------------------------------------------------------

interface ScenarioColumnProps {
  config: ScenarioConfig;
  result: CalculatorResult;
  attendance: number;
  isNightlife: boolean;
  totalBudget: number;
}

function ScenarioColumn({ config, result, attendance, isNightlife, totalBudget }: ScenarioColumnProps) {
  const { label, emphasis, badge, pct } = config;
  const cardClass = columnCardClass(emphasis);
  const headerClass = headerTextClass(emphasis);
  const takeHomeClass = takeHomeLabelClass(emphasis);

  // For budget mode, "you take home" = totalBudget - totalCosts (remaining)
  // For nightlife, it's yourTakeHome from the engine
  const takeHome = isNightlife ? result.yourTakeHome : result.yourTakeHome;
  const profitNote = getProfitNote(takeHome, result.totalCosts, isNightlife);

  return (
    <Card className={`glass flex flex-col gap-0 transition-all duration-200 ${cardClass}`}>
      {/* Header */}
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-semibold uppercase tracking-widest ${headerClass}`}>
            {label}
          </span>
          {badge && (
            <Badge
              variant="outline"
              className={
                emphasis === "primary"
                  ? "bg-primary/10 text-primary border-primary/30 text-[10px] px-1.5 py-0 leading-4"
                  : "bg-green-500/10 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0 leading-4"
              }
            >
              {badge}
            </Badge>
          )}
        </div>
        <p className={`text-sm font-medium mt-1 ${headerClass}`}>
          {Math.round(pct * 100)}% attendance
        </p>
        <p className="text-2xl font-bold text-foreground leading-none mt-0.5">
          {attendance.toLocaleString()} guests
        </p>
      </CardHeader>

      {/* Metrics */}
      <CardContent className="flex flex-col gap-3 px-4 pb-4">
        {isNightlife ? (
          <>
            <MetricRow label="Gross Revenue" value={fmt(result.totalRevenue)} />
            <MetricRow label="Total Costs" value={fmt(result.totalCosts)} muted />
            <div className="border-t border-border/30 pt-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                You Take Home
              </p>
              <p className={`text-3xl font-extrabold leading-none ${takeHomeClass}`}>
                {fmt(takeHome)}
              </p>
            </div>
          </>
        ) : (
          <>
            <MetricRow label="Total Budget" value={fmt(totalBudget ?? 0)} />
            <MetricRow label="Total Costs" value={fmt(result.totalCosts)} muted />
            <div className="border-t border-border/30 pt-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Remaining Budget
              </p>
              <p className={`text-3xl font-extrabold leading-none ${takeHomeClass}`}>
                {fmt(takeHome)}
              </p>
            </div>
          </>
        )}

        {/* Viability badge */}
        <Badge
          variant="outline"
          className={`self-start text-xs ${getViabilityBadgeStyle(result.viability.score)}`}
        >
          Viability {result.viability.score}/10 · {result.viability.label}
        </Badge>

        {/* Profit note */}
        <div
          className={`flex items-center gap-1 text-[11px] font-medium ${
            takeHome > 0
              ? "text-green-400"
              : takeHome === 0
                ? "text-muted-foreground"
                : "text-destructive"
          }`}
        >
          {profitNote.icon}
          <span>
            At this attendance, {profitNote.text}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------
// Tiny helper row
// ----------------------------------------------------------------

function MetricRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${muted ? "text-muted-foreground" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

// ----------------------------------------------------------------
// Main component
// ----------------------------------------------------------------

export function ScenarioComparison({
  baseInputs,
  calculate: calculateOverride,
  isNightlife,
}: ScenarioComparisonProps) {
  const calcFn = calculateOverride ?? runCalculate;

  // Build the three scenario results
  const scenarios = SCENARIOS.map((cfg) => {
    const scaledAttendance = Math.round(baseInputs.attendance * cfg.pct);
    const inputs: CalculatorInputs = {
      ...baseInputs,
      attendance: scaledAttendance,
      // Scale catering guests proportionally when in per-person mode
      cateringGuests:
        baseInputs.cateringMode === "per-person"
          ? scaledAttendance
          : baseInputs.cateringGuests,
    };
    return {
      config: cfg,
      result: calcFn(inputs),
      attendance: scaledAttendance,
    };
  });

  const conservative = scenarios[0];
  const optimistic = scenarios[2];
  const gap = optimistic.result.yourTakeHome - conservative.result.yourTakeHome;
  const gapPositive = gap > 0;

  return (
    <div className="space-y-4">
      {/* Section heading */}
      <div>
        <h3 className="text-base font-semibold text-foreground">Scenario Comparison</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          What happens if attendance varies? Here&apos;s your range.
        </p>
      </div>

      {/* 3-column grid — stacked on mobile, side-by-side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-start">
        {scenarios.map(({ config, result, attendance }) => (
          <ScenarioColumn
            key={config.label}
            config={config}
            result={result}
            attendance={attendance}
            isNightlife={isNightlife}
            totalBudget={baseInputs.totalBudget ?? 0}
          />
        ))}
      </div>

      {/* Gap summary */}
      <div className="rounded-lg border border-border/40 bg-card/60 px-4 py-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">
          The gap between a slow night and a great night:
        </span>
        <span
          className={`text-sm font-bold tabular-nums ${gapPositive ? "text-green-400" : "text-destructive"}`}
        >
          {gapPositive ? "+" : ""}{fmt(gap)}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          ({conservative.attendance} guests vs {optimistic.attendance} guests)
        </span>
      </div>
    </div>
  );
}
