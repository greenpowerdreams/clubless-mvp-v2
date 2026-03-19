import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  ArrowRight,
  Sparkles,
  DollarSign,
  TrendingUp,
  Shield,
  Zap,
  Crown
} from "lucide-react";

const feeModels = [
  {
    name: "Service Fee",
    badge: "Most Popular",
    description: "Keep the lion's share of your profits with a simple flat fee",
    fee: "20%",
    feeLabel: "of net profit",
    yourCut: "80%",
    highlights: [
      "Keep 80% of your event profits",
      "Transparent cost breakdown",
      "No hidden fees ever",
      "Pay only when you profit"
    ],
    ideal: "Best for experienced hosts with proven events",
    cta: "Start with Service Fee",
    featured: true,
    icon: TrendingUp
  },
  {
    name: "Profit Share",
    badge: "Zero Risk",
    description: "We share the risk and the reward. Perfect for first-time hosts.",
    fee: "50/50",
    feeLabel: "profit split",
    yourCut: "50%",
    highlights: [
      "Zero upfront costs",
      "We cover operational expenses",
      "Mentorship & guidance included",
      "Lower risk, guaranteed support"
    ],
    ideal: "Best for new hosts testing the waters",
    cta: "Start with Profit Share",
    featured: false,
    icon: Shield
  }
];

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
  { level: "Starter", events: "0-1", fee: "20%", perks: ["Standard support", "Basic calculator"] },
  { level: "Rising", events: "2-4", fee: "16%", perks: ["Priority support", "Early venue access"] },
  { level: "Established", events: "5-9", fee: "12%", perks: ["Priority approval", "Best dates priority"] },
  { level: "Elite", events: "10+", fee: "8%", perks: ["Dedicated rep", "VIP treatment", "Custom packages"] }
];

export default function Pricing() {
  return (
    <Layout>
      {/* Hero */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <DollarSign className="w-3 h-3 mr-1" />
              Simple Pricing
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-5">
              Fair Pricing.
              <br />
              <span className="text-primary">Real Transparency.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              No hidden fees. No surprise charges. You see exactly what you'll 
              make before you commit.
            </p>
          </div>
        </div>
      </section>

      {/* Fee Models */}
      <section className="pb-20">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {feeModels.map((model) => (
              <div
                key={model.name}
                className={`relative rounded-2xl p-8 ${
                  model.featured 
                    ? "bg-primary text-primary-foreground ring-2 ring-primary" 
                    : "bg-card border border-border"
                }`}
              >
                {model.featured && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground">
                    {model.badge}
                  </Badge>
                )}
                {!model.featured && (
                  <Badge variant="outline" className="mb-4">
                    {model.badge}
                  </Badge>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    model.featured ? "bg-primary-foreground/10" : "bg-muted"
                  }`}>
                    <model.icon className={`w-6 h-6 ${
                      model.featured ? "text-primary-foreground" : "text-primary"
                    }`} />
                  </div>
                  <h3 className="font-display text-2xl font-bold">{model.name}</h3>
                </div>
                
                <p className={`mb-6 ${model.featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {model.description}
                </p>
                
                <div className="mb-6">
                  <span className="font-display text-5xl font-bold">{model.fee}</span>
                  <span className={`ml-2 ${model.featured ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {model.feeLabel}
                  </span>
                </div>
                
                <div className={`text-sm mb-6 p-3 rounded-lg ${
                  model.featured ? "bg-primary-foreground/10" : "bg-muted"
                }`}>
                  <span className={model.featured ? "text-primary-foreground/70" : "text-muted-foreground"}>
                    You keep:
                  </span>
                  <span className="font-bold text-lg ml-2">{model.yourCut}</span>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {model.highlights.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className={`w-4 h-4 flex-shrink-0 ${
                        model.featured ? "text-accent" : "text-primary"
                      }`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                
                <p className={`text-xs mb-6 ${model.featured ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {model.ideal}
                </p>
                
                <Button
                  className="w-full"
                  variant={model.featured ? "secondary" : "default"}
                  asChild
                >
                  <Link to={model.name === "Profit Share" ? "/calculator?model=profit-share" : "/calculator?model=service-fee"}>
                    {model.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 bg-card">
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
      <section className="py-20">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
                <Crown className="w-3 h-3 mr-1" />
                Host Levels
              </Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Lower Fees as You Grow
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Start at 20% / 80% and earn your way to lower fees.
                Your success is rewarded.
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
                  <div className="flex items-center gap-2 mb-3">
                    {i === 3 && <Crown className="w-4 h-4 text-accent" />}
                    <h4 className="font-display font-bold">{level.level}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {level.events} events
                  </p>
                  <p className="font-display text-3xl font-bold text-primary mb-4">
                    {level.fee}
                  </p>
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

      {/* Calculator CTA — primary action */}
      <section className="py-20 bg-card">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                See Your Numbers First
              </h2>
              <p className="text-muted-foreground">
                Run your event through our profit calculator, then choose your fee model. No account required.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Link
                to="/calculator?model=service-fee"
                className="group flex flex-col gap-3 p-6 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-display text-lg font-bold">Calculate with 20% Fee</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You keep 80% of net profit. Best for experienced hosts.
                </p>
                <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Open Calculator <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              <Link
                to="/calculator?model=profit-share"
                className="group flex flex-col gap-3 p-6 rounded-2xl bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-accent" />
                  </div>
                  <span className="font-display text-lg font-bold">Calculate with 50/50 Split</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  We share risk and reward. Best for first-time hosts.
                </p>
                <span className="text-accent text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  Open Calculator <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
