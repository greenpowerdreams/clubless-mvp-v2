import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ViabilityScore } from "./calculator.types";
import { Sparkles, TrendingUp, ShieldCheck, Users, DollarSign, BarChart3 } from "lucide-react";

interface ViabilityScoreCardProps {
  viability: ViabilityScore;
}

const FACTOR_ICONS: Record<string, React.ReactNode> = {
  "Profit Margin": <DollarSign className="w-4 h-4" />,
  "Break-Even Safety": <ShieldCheck className="w-4 h-4" />,
  "Profit per Guest": <Users className="w-4 h-4" />,
  "Cost Efficiency": <BarChart3 className="w-4 h-4" />,
  "Event Scale": <TrendingUp className="w-4 h-4" />,
};

function getScoreColor(score: number): string {
  if (score >= 8) return "text-green-400";
  if (score >= 6) return "text-blue-400";
  if (score >= 4) return "text-yellow-400";
  return "text-destructive";
}

function getProgressColor(score: number): string {
  if (score >= 8) return "bg-green-400";
  if (score >= 6) return "bg-blue-400";
  if (score >= 4) return "bg-yellow-400";
  return "bg-destructive";
}

export function ViabilityScoreCard({ viability }: ViabilityScoreCardProps) {
  return (
    <Card className="glass border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Event Viability Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Big Score */}
        <div className="text-center mb-6">
          <p className={`text-6xl font-bold ${viability.color}`}>
            {viability.score}
          </p>
          <p className="text-sm text-muted-foreground mt-1">out of 10</p>
          <p className={`text-lg font-semibold mt-2 ${viability.color}`}>
            {viability.label}
          </p>
        </div>

        {/* Factor Breakdown */}
        <div className="space-y-4">
          {viability.factors.map((factor) => (
            <div key={factor.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-sm">
                  {FACTOR_ICONS[factor.name] || <BarChart3 className="w-4 h-4" />}
                  <span className="font-medium">{factor.name}</span>
                  <span className="text-muted-foreground">({Math.round(factor.weight * 100)}%)</span>
                </div>
                <span className={`text-sm font-bold ${getScoreColor(factor.score)}`}>
                  {factor.score}/10
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all ${getProgressColor(factor.score)}`}
                  style={{ width: `${factor.score * 10}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{factor.detail}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
