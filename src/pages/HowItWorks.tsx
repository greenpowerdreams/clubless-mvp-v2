import { Link } from "react-router-dom";
import { useSEO } from "@/shared/hooks/useSEO";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { IMAGES } from "@/lib/images";
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
    title: "1. Plan Your Numbers",
    description:
      "Use our free calculator to see your full event breakdown by event type. Club night, wedding, corporate, birthday -- run any scenario before committing to anything.",
    details: [
      "Pick your event type and guest count",
      "Know your take-home before you book anything",
    ],
  },
  {
    icon: FileText,
    title: "2. Submit Your Event",
    description:
      "Tell us your concept, date, and what you need. Our team reviews every submission and responds within 48 hours.",
    details: [
      "Describe your event and what you need",
      "We respond within 48 hours",
    ],
  },
  {
    icon: Handshake,
    title: "3. Get Matched With Vendors",
    description:
      "We match you with verified vendors from our marketplace: bartenders, caterers, security, photographers, and more. All coordinated through the platform.",
    details: [
      "Verified vendors with real pricing and reviews",
      "Seattle: we provide licensed bar service directly",
    ],
  },
  {
    icon: PartyPopper,
    title: "4. Host Your Event",
    description:
      "Show up and run your event. Our vendor network handles their piece. You focus on the experience.",
    details: [
      "Vendors arrive and set up independently",
      "Everything coordinated in advance. No day-of surprises.",
    ],
  },
  {
    icon: Wallet,
    title: "5. See Your Revenue Breakdown",
    description:
      "Within 48 hours of your event, you get a full itemized revenue report: what came in, what the fees were, and what you're owed. Payout coordination is handled directly.",
    details: [
      "Full itemized revenue and fee breakdown",
      "Attendee data export. You own your guest list.",
    ],
  },
];

const fees = [
  {
    name: "Nightlife / Club Nights",
    rate: "8-10%",
    description:
      "Of net ticket revenue. Rate drops as you host more events. Ticketing fee (5% or $1.50 flat) paid by the buyer, not you.",
  },
  {
    name: "Weddings",
    rate: "8%",
    description:
      "Of what you spend on vendors through Clubless. Applies only to vendor services booked through the platform, not your total event budget.",
  },
  {
    name: "Corporate Events",
    rate: "10%",
    description:
      "Of what you spend on vendors through Clubless. No fee on events where no vendors are booked.",
  },
  {
    name: "Birthdays and Small Events",
    rate: "$29-$49",
    description:
      "Flat fee per event. No percentage taken.",
  },
];


export default function HowItWorks() {
  useSEO({
    title: "How It Works — Host Events Without a Venue | Clubless Collective",
    description:
      "Learn how Clubless Collective lets DJs, promoters, and creators host profitable events in Seattle without owning a venue. From idea to payout in 5 simple steps.",
    keywords:
      "event hosting, mobile bar, venue-free events, how to throw an event, dj event hosting seattle, clubless how it works",
    url: "/how-it-works",
    type: "website",
  });
  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[320px] flex items-center overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={IMAGES.features.planning}
            alt="Event planning session"
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
        </div>
        <div className="container px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              How <span className="text-primary">Clubless</span> Works
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Event hosting without the middleman. Keep more money, stay in
              control, and bring people to your night.
            </p>
            <Button asChild size="lg" className="group">
              <Link to="/calculator">
                Try the Calculator
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
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
                  <div className="absolute left-7 top-16 bottom-0 w-px bg-primary/30" />
                )}

                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
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
      <section className="py-20 md:py-32 bg-card border-y border-border">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Simple, <span className="text-primary">Transparent</span> Fees
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
              All creators own their full attendee data. Export your guest list any time, no paywall, no restrictions.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-32">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Ready to See Your <span className="text-primary">Numbers?</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Use our event planner to map out your full event and see your
              cost breakdown before you commit.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="default" size="lg" asChild>
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
