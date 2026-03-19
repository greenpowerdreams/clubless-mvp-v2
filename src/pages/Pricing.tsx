import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Sparkles,
  DollarSign,
  TrendingUp,
  Shield,
  Crown
} from "lucide-react";
import { CalculatorContent } from "./Calculator";

const includedInBoth = [
  "Licensed venue booking",
  "Bar setup & bartending staff",
  "Security personnel",
  "Insurance & permits",
  "Ticketing & payment processing",
  "Real-time profit calculator",
  "Dedicated event support",
  "Post-event payout within 72 hours"
];

const levelPerks = [
  { level: "Starter", events: "0-1", fee: "20%", yourCut: "80%", perks: ["Standard support", "Basic calculator"] },
  { level: "Rising", events: "2-4", fee: "16%", yourCut: "84%", perks: ["Priority support", "Early venue access"] },
  { level: "Established", events: "5-9", fee: "12%", yourCut: "88%", perks: ["Priority approval", "Best dates priority"] },
  { level: "Elite", events: "10+", fee: "8%", yourCut: "92%", perks: ["Dedicated rep", "VIP treatment", "Custom packages"] }
];

export default function Pricing() {
  return (
    <Layout>
      {/* Brief intro header */}
      <section className="pt-24 pb-6 md:pt-32 md:pb-10">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <DollarSign className="w-3 h-3 mr-1" />
              Simple Pricing
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              See Your Numbers First
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Run your event through the calculator below. No account required. Then choose the model that works for you.
            </p>
          </div>
        </div>
      </section>

      {/* Calculator — embedded inline */}
      <CalculatorContent />

      {/* Fee Models — reworked to lead with creator's cut */}
      <section className="py-20 bg-card">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Choose Your Model
              </h2>
              <p className="text-muted-foreground">
                Both models are designed so you only pay when you profit.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Service Fee */}
              <div className="relative rounded-2xl p-8 bg-primary text-primary-foreground ring-2 ring-primary">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground">
                  Most Popular
                </Badge>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-2xl font-bold">Service Fee</h3>
                </div>

                <p className="text-primary-foreground/80 mb-6">
                  Keep the lion's share. Pay a simple flat fee only when you profit.
                </p>

                {/* Creator's cut is the hero number */}
                <div className="mb-2">
                  <span className="font-display text-6xl font-bold">80%</span>
                  <span className="ml-2 text-primary-foreground/70">you keep</span>
                </div>
                <p className="text-sm text-primary-foreground/60 mb-6">
                  Clubless takes 20% of net profit
                </p>

                <ul className="space-y-3 mb-6">
                  {["Keep 80% of your event profits", "Transparent cost breakdown", "No hidden fees ever", "Pay only when you profit"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 flex-shrink-0 text-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-primary-foreground/60">
                  Best for experienced hosts with proven events
                </p>
              </div>

              {/* Profit Share */}
              <div className="relative rounded-2xl p-8 bg-card border border-border">
                <Badge variant="outline" className="mb-4">Zero Risk</Badge>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-2xl font-bold">Profit Share</h3>
                </div>

                <p className="text-muted-foreground mb-6">
                  We share the risk and the reward. Perfect for first-time hosts.
                </p>

                {/* 50% you keep is still the lead */}
                <div className="mb-2">
                  <span className="font-display text-6xl font-bold">50%</span>
                  <span className="ml-2 text-muted-foreground">you keep</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  We split profits 50/50 and cover operational expenses
                </p>

                <ul className="space-y-3 mb-6">
                  {["Zero upfront costs", "We cover operational expenses", "Mentorship & guidance included", "Lower risk, guaranteed support"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 flex-shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-muted-foreground">
                  Best for new hosts testing the waters
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Everything Included
              </h2>
              <p className="text-muted-foreground">
                Both pricing models include full operational support
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {includedInBoth.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 rounded-xl bg-secondary"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Level System */}
      <section className="py-20 bg-card">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
                <Crown className="w-3 h-3 mr-1" />
                Host Levels
              </Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                You Keep More as You Grow
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Start keeping 80%. Keep more with every event you host.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {levelPerks.map((level, i) => (
                <div
                  key={level.level}
                  className={`p-6 rounded-xl border ${
                    i === 3 ? "bg-primary/5 border-primary/20" : "bg-card border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {i === 3 && <Crown className="w-4 h-4 text-accent" />}
                    <h4 className="font-display font-bold">{level.level}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{level.events} events</p>
                  {/* Lead with what they keep */}
                  <p className="font-display text-3xl font-bold text-primary mb-0.5">{level.yourCut}</p>
                  <p className="text-xs text-muted-foreground mb-4">you keep ({level.fee} fee)</p>
                  <ul className="space-y-2">
                    {level.perks.map((perk, j) => (
                      <li key={j} className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-primary" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
