import { useState } from "react";
import { Link } from "react-router-dom";
import { useSEO } from "@/shared/hooks/useSEO";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { IMAGES, TESTIMONIALS } from "@/lib/images";
import {
  Check,
  ArrowRight,
  DollarSign,
  Clock,
  Database,
  Sparkles,
  Crown,
  Music,
  Heart,
  Briefcase,
  Cake,
  Zap,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const eventPricing = [
  {
    id: "nightlife",
    label: "Nightlife / Club Night",
    Icon: Music,
    highlight: true,
    creatorFee: "8-10% of net revenue",
    buyerFee: "5% or $1.50 per ticket",
    notes: [
      "Buyer pays the ticketing fee, not you",
      "5% on tickets over $25, $1.50 flat on tickets under $25",
      "Platform fee scales down as you build event history",
    ],
    tag: "Ticketed",
  },
  {
    id: "wedding",
    label: "Wedding",
    Icon: Heart,
    highlight: false,
    creatorFee: "8% of what you spend on vendors through Clubless",
    buyerFee: "No ticket fee",
    notes: [
      "Covers bartending, catering, florals, and more",
      "Applies only to vendor services booked through the platform, not your total event budget",
      "Minimum $500 in vendor services to use the marketplace",
    ],
    tag: "Vendor Services",
  },
  {
    id: "corporate",
    label: "Corporate Event",
    Icon: Briefcase,
    highlight: false,
    creatorFee: "10% of what you spend on vendors through Clubless",
    buyerFee: "No ticket fee",
    notes: [
      "Covers catering, A/V, staffing, and more",
      "No fee on events where no vendors are booked",
      "Rate applies to all vendor services booked through the platform",
    ],
    tag: "Vendor Services",
  },
  {
    id: "birthday",
    label: "Birthday / Private Event",
    Icon: Cake,
    highlight: false,
    creatorFee: "$29-$49 flat per event",
    buyerFee: "Buyer pays at booking",
    notes: [
      "No percentage taken from your revenue",
      "Flat rate paid when you create the event listing",
      "Covers birthdays, milestones, small private gatherings",
    ],
    tag: "Flat Rate",
  },
  {
    id: "other",
    label: "Pop-up / Fundraiser / Other",
    Icon: Sparkles,
    highlight: false,
    creatorFee: "8% of vendor services booked through Clubless or $49 flat",
    buyerFee: "Varies",
    notes: [
      "$49 flat for non-vendor events",
      "8% of vendor services booked through the platform if vendors are used",
      "Covers pop-ups, galas, fundraisers, anything else",
    ],
    tag: "Flexible",
  },
];

const creatorLevels = [
  {
    level: "Starter",
    events: "0-1 events",
    platformFee: "10%",
    creatorKeeps: "90%",
    isElite: false,
  },
  {
    level: "Rising",
    events: "2-4 events",
    platformFee: "9%",
    creatorKeeps: "91%",
    isElite: false,
  },
  {
    level: "Established",
    events: "5-9 events",
    platformFee: "8.5%",
    creatorKeeps: "91.5%",
    isElite: false,
  },
  {
    level: "Elite",
    events: "10+ events",
    platformFee: "8%",
    creatorKeeps: "92%",
    isElite: true,
  },
];

const alwaysIncluded = [
  { Icon: Zap, label: "Vendor marketplace access" },
  { Icon: DollarSign, label: "Event revenue calculator" },
  { Icon: Database, label: "Attendee data export -- you own your data" },
  { Icon: Clock, label: "48-hour direct deposit after your event" },
  { Icon: Sparkles, label: "Creator dashboard and analytics" },
  { Icon: Check, label: "Licensed bar service coordination (Seattle)" },
  { Icon: Check, label: "Transparent cost breakdown before you commit" },
  { Icon: Check, label: "No contracts required" },
];

const faqs = [
  {
    q: "When do I get paid?",
    a: "48 hours after your event closes. Funds go directly to your account. No waiting around.",
  },
  {
    q: "Who pays the ticketing fee?",
    a: "The buyer, always. The ticketing fee is added to the checkout total for the attendee. You see your full revenue, nothing deducted on your end.",
  },
  {
    q: "Do I need to sign a contract?",
    a: "No. Each event is independent. You agree to our standard terms when you create an event listing, but there are no long-term agreements or exclusivity requirements.",
  },
  {
    q: "What if my event doesn't sell out?",
    a: "You only pay the platform fee on actual revenue collected. If you sell 80 out of 200 tickets, your fee is based on those 80 tickets. Nothing more.",
  },
];

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-muted/40 transition-colors"
      >
        <span className="font-medium">{q}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5 text-muted-foreground text-sm leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Pricing() {
  useSEO({
    title: "Pricing — 8-10% Platform Fee | Clubless Collective",
    description:
      "Transparent event hosting pricing. 8-10% platform fee, no monthly subscription, no surprise charges. The Posh alternative built for Seattle creators.",
    keywords:
      "event platform pricing, posh alternative, clubless pricing, event ticketing fees, dj platform pricing",
    url: "/pricing",
    type: "website",
  });
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-12 md:pt-32 md:pb-16">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={IMAGES.events.concert}
            alt="Concert crowd at a live event"
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
        </div>
        <div className="container px-4 relative">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-5">
              Pricing by event type. No monthly fee. No surprises.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Fees depend on your event type. Buyers pay the ticketing fee. You
              keep the majority of your revenue from day one.
            </p>
          </div>
        </div>
      </section>

      {/* Event Type Pricing Cards */}
      <section className="pb-20">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-10">
              Fees by event type
            </h2>
            <div className="grid gap-4">
              {eventPricing.map((event) => {
                const { Icon } = event;
                return (
                  <div
                    key={event.id}
                    className={`rounded-2xl border p-6 md:p-8 transition-colors ${
                      event.highlight
                        ? "bg-primary/5 border-primary/30"
                        : "bg-card border-border"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:gap-8">
                      {/* Left: identity */}
                      <div className="flex items-center gap-3 mb-4 md:mb-0 md:w-52 flex-shrink-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            event.highlight
                              ? "bg-primary/15"
                              : "bg-muted"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              event.highlight ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-sm leading-snug">
                            {event.label}
                          </div>
                          <Badge
                            variant="outline"
                            className="mt-1 text-xs px-1.5 py-0"
                          >
                            {event.tag}
                          </Badge>
                        </div>
                      </div>

                      {/* Middle: fees */}
                      <div className="grid sm:grid-cols-2 gap-4 md:gap-8 flex-1 mb-4 md:mb-0">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            Creator pays
                          </p>
                          <p className="font-semibold text-sm">{event.creatorFee}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            Buyer pays
                          </p>
                          <p className="font-semibold text-sm">{event.buyerFee}</p>
                        </div>
                      </div>

                      {/* Right: notes */}
                      <ul className="space-y-1.5 md:w-72 flex-shrink-0">
                        {event.notes.map((note, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-muted-foreground"
                          >
                            <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Ticketing Fee Explainer */}
      <section className="py-16 bg-card">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              The buyer pays the ticketing fee. Always.
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              When someone buys a ticket through Clubless, they see the ticketing
              fee at checkout. It is never deducted from your payout. You see the
              full revenue your event generated.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto">
              <div className="rounded-xl bg-background border border-border p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Tickets under $25
                </p>
                <p className="font-display text-2xl font-bold mb-1">$1.50</p>
                <p className="text-sm text-muted-foreground">
                  Flat per ticket, charged to buyer
                </p>
              </div>
              <div className="rounded-xl bg-background border border-border p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Tickets over $25
                </p>
                <p className="font-display text-2xl font-bold mb-1">5%</p>
                <p className="text-sm text-muted-foreground">
                  Of ticket price, charged to buyer
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Level System */}
      <section className="py-20">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
                Your cut grows with every event
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Applies to nightlife and ticketed events. The more events you
                run on the platform, the lower your platform fee.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {creatorLevels.map((lvl) => (
                <div
                  key={lvl.level}
                  className={`rounded-2xl border p-6 relative ${
                    lvl.isElite
                      ? "bg-primary/5 border-primary/30"
                      : "bg-card border-border"
                  }`}
                >
                  {lvl.isElite && (
                    <Crown className="w-4 h-4 text-accent absolute top-4 right-4" />
                  )}
                  <p className="font-display font-bold text-lg mb-0.5">
                    {lvl.level}
                  </p>
                  <p className="text-xs text-muted-foreground mb-5">
                    {lvl.events}
                  </p>
                  <p className="font-display text-4xl font-bold text-primary mb-0.5">
                    {lvl.creatorKeeps}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    you keep ({lvl.platformFee} platform fee)
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials — only rendered when real quotes are available */}
      {TESTIMONIALS.length > 0 && (
        <section className="py-20 bg-card">
          <div className="container px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
                  Creators who've run events with Clubless
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TESTIMONIALS.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-border bg-background p-6 flex flex-col gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <ImageWithFallback
                        src={t.avatar}
                        alt={t.name}
                        className="w-12 h-12 rounded-full flex-shrink-0"
                        fallbackType="profile"
                      />
                      <div>
                        <p className="font-semibold text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t.quote}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Always Included */}
      <section className="py-20 bg-card">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
                Included at every level
              </h2>
              <p className="text-muted-foreground">
                Every creator on Clubless gets these, regardless of event type
                or fee tier.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {alwaysIncluded.map(({ Icon, label }, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
                Common questions
              </h2>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <FAQItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-card">
        <div className="container px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              See your numbers before you commit
            </h2>
            <p className="text-muted-foreground mb-8">
              Run your event through the calculator. No account required. Adjust
              ticket prices, headcount, and vendors until it makes sense for you.
            </p>
            <Button asChild size="lg" className="group">
              <Link to="/calculator">
                Try the calculator
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
