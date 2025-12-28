import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Calculator,
  FileText,
  Handshake,
  PartyPopper,
  Wallet,
  Check,
} from "lucide-react";

const steps = [
  {
    icon: Calculator,
    title: "1. Calculate Your Profit",
    description:
      "Use our free profit calculator to estimate your earnings based on expected attendance, ticket prices, and bar sales. Get a clear picture before you commit to anything.",
    details: [
      "Input your expected guest count",
      "Set ticket price and bar spend estimates",
      "See projected revenue and Clubless fees",
      "Understand your take-home profit",
    ],
  },
  {
    icon: FileText,
    title: "2. Submit Your Event Proposal",
    description:
      "Tell us about your event concept—the vibe, the audience, the date. Our team reviews every submission and gets back to you within 48 hours.",
    details: [
      "Describe your event concept and target audience",
      "Choose your preferred date and time",
      "Specify your expected attendance",
      "Share any special requirements",
    ],
  },
  {
    icon: Handshake,
    title: "3. We Handle the Backend",
    description:
      "Once approved, we take care of everything behind the scenes. Venue coordination, bar setup, staffing, licensing—you focus on promoting your event.",
    details: [
      "Venue matching and negotiation",
      "Liquor licensing and permits",
      "Professional bar staff",
      "Point of sale systems",
    ],
  },
  {
    icon: PartyPopper,
    title: "4. Host Your Event",
    description:
      "The night of your event, our team is on-site managing bar operations while you do what you do best—creating an unforgettable experience.",
    details: [
      "Full bar service and inventory",
      "Real-time sales tracking",
      "On-site event support",
      "Professional bartenders and security",
    ],
  },
  {
    icon: Wallet,
    title: "5. Get Paid Fast",
    description:
      "Within 72 hours of your event, you receive a detailed revenue breakdown and your payout. No chasing checks, no waiting months.",
    details: [
      "Itemized revenue report",
      "Direct deposit within 72 hours",
      "Transparent fee breakdown",
      "Performance analytics",
    ],
  },
];

const fees = [
  {
    name: "Bar Revenue Share",
    rate: "15-30%",
    description:
      "Based on event size and services needed. The rest is yours to keep.",
  },
  {
    name: "Platform Fee",
    rate: "$0",
    description:
      "No monthly fees, no subscription costs. We only make money when you do.",
  },
  {
    name: "Payment Processing",
    rate: "2.9% + $0.30",
    description: "Standard payment processing fees for ticket sales (if any).",
  },
];

export default function HowItWorks() {
  return (
    <Layout>
      {/* Hero */}
      <section className="pt-12 pb-20 md:pt-20 md:pb-32">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              How <span className="text-gradient">Clubless</span> Works
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We've simplified the event hosting process so you can focus on
              what matters—building your brand and making money.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="pb-20 md:pb-32">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative flex gap-8 pb-16 last:pb-0"
              >
                {/* Timeline Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-7 top-16 bottom-0 w-px bg-gradient-to-b from-primary/50 to-transparent" />
                )}

                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
                    <step.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <h3 className="font-display text-2xl font-bold mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {step.description}
                  </p>
                  <div className="glass rounded-xl p-6">
                    <ul className="grid sm:grid-cols-2 gap-3">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">
                            {detail}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fees */}
      <section className="py-20 md:py-32 bg-gradient-card border-y border-border">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Simple, <span className="text-gradient">Transparent</span> Fees
              </h2>
              <p className="text-muted-foreground">
                No hidden costs. Know exactly what you're paying before you
                commit.
              </p>
            </div>

            <div className="grid gap-4">
              {fees.map((fee, index) => (
                <div
                  key={index}
                  className="glass rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1">
                    <h4 className="font-display font-semibold text-lg mb-1">
                      {fee.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {fee.description}
                    </p>
                  </div>
                  <div className="text-2xl font-display font-bold text-primary">
                    {fee.rate}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              * Bar revenue share varies based on event size, venue, and
              services required. You'll see exact fees in your profit estimate.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-32">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Ready to See Your <span className="text-gradient">Numbers?</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Use our profit calculator to model your event and see exactly how
              much you could earn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="gradient" size="lg" asChild>
                <Link to="/calculator">
                  Try the Calculator
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/submit">Submit Event Idea</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
