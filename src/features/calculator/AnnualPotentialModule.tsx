import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TrendingUp, ArrowRight } from "lucide-react";
import type { CalculatorResult } from "./calculator.types";

interface AnnualPotentialModuleProps {
  result: CalculatorResult;
  eventType: string;
  isNightlife: boolean;
}

const CADENCE_OPTIONS = [
  { value: "12", label: "Monthly", sublabel: "12x/yr" },
  { value: "24", label: "Twice a month", sublabel: "24x/yr" },
  { value: "52", label: "Weekly", sublabel: "52x/yr" },
] as const;

type CadenceValue = "12" | "24" | "52";

function fmt(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const BUDGET_MODE_TYPES = ["wedding", "corporate", "birthday", "other"];

export function AnnualPotentialModule({ result, eventType, isNightlife }: AnnualPotentialModuleProps) {
  const [cadence, setCadence] = useState<CadenceValue>("12");
  const n = parseInt(cadence, 10);

  const isBudgetMode = BUDGET_MODE_TYPES.includes(eventType) && !isNightlife;

  const annualTakeHome = result.yourTakeHome * n;
  const annualGross = result.totalRevenue * n;
  const annualFees = result.clublessFee * n;
  const annualCosts = result.totalCosts * n;
  // For budget mode, total spend = totalCosts * n, managed through Clubless = annualFees
  const annualSpend = annualCosts;

  const selectedOption = CADENCE_OPTIONS.find((o) => o.value === cadence)!;

  return (
    <Card className="glass border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-5 h-5 text-primary" />
          What if you ran this event regularly?
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Cadence selector */}
        <RadioGroup
          value={cadence}
          onValueChange={(v) => setCadence(v as CadenceValue)}
          className="flex flex-wrap gap-2"
        >
          {CADENCE_OPTIONS.map((opt) => (
            <Label
              key={opt.value}
              htmlFor={`cadence-${opt.value}`}
              className={`flex items-center gap-2 cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-medium transition-all select-none ${
                cadence === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/50"
              }`}
            >
              <RadioGroupItem
                id={`cadence-${opt.value}`}
                value={opt.value}
                className="sr-only"
              />
              <span>{opt.label}</span>
              <span className="opacity-60">({opt.sublabel})</span>
            </Label>
          ))}
        </RadioGroup>

        {/* Projection numbers */}
        {isBudgetMode ? (
          /* Budget mode: frame as spend management */
          <div className="space-y-3">
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Total Annual Spend
              </p>
              <p className="text-3xl font-bold text-foreground">{fmt(annualSpend)}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-secondary/40 p-3 text-center">
                <p className="text-muted-foreground text-xs mb-0.5">Managed via Clubless</p>
                <p className="font-semibold text-primary">{fmt(annualFees)}</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-3 text-center">
                <p className="text-muted-foreground text-xs mb-0.5">Events per year</p>
                <p className="font-semibold">{n}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              At {n} events/year, your total spend would be{" "}
              <span className="text-foreground font-medium">{fmt(annualSpend)}</span> with{" "}
              <span className="text-primary font-medium">{fmt(annualFees)}</span> managed through Clubless.
            </p>
          </div>
        ) : (
          /* Promoter/revenue mode */
          <div className="space-y-3">
            {/* Hero number */}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Annual Take-Home
              </p>
              <p className="text-4xl font-bold text-primary">{fmt(annualTakeHome)}</p>
            </div>

            {/* Supporting metrics */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-lg bg-secondary/40 p-3 text-center">
                <p className="text-muted-foreground text-xs mb-0.5">Gross Revenue</p>
                <p className="font-semibold">{fmt(annualGross)}</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-3 text-center">
                <p className="text-muted-foreground text-xs mb-0.5">Clubless Fees</p>
                <p className="font-semibold text-muted-foreground">{fmt(annualFees)}</p>
              </div>
              <div className="rounded-lg bg-secondary/40 p-3 text-center">
                <p className="text-muted-foreground text-xs mb-0.5">Total Costs</p>
                <p className="font-semibold">{fmt(annualCosts)}</p>
              </div>
            </div>

            {/* Motivational line */}
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              At {n} events/year, this is a{" "}
              <span className="text-foreground font-semibold">{fmt(annualTakeHome)}/year</span> business.
              Clubless earns {fmt(annualFees)} — we win when you win.
            </p>
          </div>
        )}

        {/* CTA */}
        <a
          href="/submit"
          className="flex items-center justify-center gap-2 w-full rounded-lg border border-primary/40 bg-primary/5 py-2.5 px-4 text-sm font-medium text-primary hover:bg-primary/15 hover:border-primary transition-all"
        >
          Ready to build this? Submit your first event
          <ArrowRight className="w-4 h-4" />
        </a>
      </CardContent>
    </Card>
  );
}
