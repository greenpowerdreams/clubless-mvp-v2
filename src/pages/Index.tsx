import { Link } from "react-router-dom";
import { useSEO } from "@/shared/hooks/useSEO";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import {
  ArrowRight,
  DollarSign,
  Database,
  Clock,
  CheckCircle,
  Zap,
  Beer,
  Shield,
} from "lucide-react";
import { IMAGES, VENDOR_CATEGORIES_WITH_IMAGES } from "@/lib/images";
import { EVENT_TYPES } from "@/lib/eventTypes";

const EVENT_TYPE_META: Record<
  string,
  { shortLine: string; color: string }
> = {
  nightlife: {
    shortLine: "DJ sets, parties, ticketed club events",
    color: "from-purple-500/20 to-purple-500/5",
  },
  wedding: {
    shortLine: "Ceremonies, receptions, rehearsal dinners",
    color: "from-rose-500/20 to-rose-500/5",
  },
  corporate: {
    shortLine: "Team events, conferences, product launches",
    color: "from-blue-500/20 to-blue-500/5",
  },
  birthday: {
    shortLine: "Birthday parties, milestones, celebrations",
    color: "from-amber-500/20 to-amber-500/5",
  },
  other: {
    shortLine: "Pop-ups, galas, fundraisers, anything else",
    color: "from-emerald-500/20 to-emerald-500/5",
  },
};

export default function Index() {
  useSEO({
    title: "Clubless Collective | Seattle Nightlife & Event Operating System",
    description:
      "Clubless Collective is Seattle's event operating system. Host profitable nightlife events without owning a venue. Licensed mobile bar service, ticketing, vendors, and creator tools — built for DJs, promoters, and event creators.",
    keywords:
      "clubless, clubless collective, seattle nightlife, seattle events, event hosting, nightlife operating system, mobile bar service seattle, dj booking seattle, posh alternative, event platform, licensed bartender seattle, venue-free events",
    url: "/",
    type: "website",
  });
  return (
    <Layout>
      {/* ── Hero ── */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={IMAGES.hero.main}
            alt="Nightlife event"
            className="absolute inset-0 w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />
        </div>

        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="container relative z-10 px-4 pt-32 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-4xl mx-auto text-center">
            {/* Seattle badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in backdrop-blur-sm">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary tracking-wide">
                Live and Licensed in Seattle
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 animate-slide-up tracking-tight leading-[0.9]">
              Host your event.
              <br />
              <span className="text-primary">Keep your revenue.</span>
            </h1>

            <p
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up leading-relaxed"
              style={{ animationDelay: "0.1s" }}
            >
              Clubless is how Seattle event hosts find verified vendors, sell
              tickets, and get paid without giving up most of their revenue to
              a platform.
            </p>

            <div
              className="flex flex-col items-center animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <Button size="xl" asChild className="group">
                <Link to="/calculator">
                  See what you'll keep →
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground mt-3">
                or{" "}
                <Link to="/events" className="underline hover:text-foreground">
                  browse upcoming events
                </Link>
              </p>
            </div>

            <p
              className="mt-8 text-base text-muted-foreground animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              Are you a vendor?{" "}
              <Link
                to="/vendor/apply"
                className="text-primary hover:underline font-medium"
              >
                Join our network →
              </Link>
            </p>

            <div
              className="flex flex-wrap items-center justify-center gap-8 mt-16 animate-fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              {[
                { icon: DollarSign, label: "Transparent Pricing" },
                { icon: Shield, label: "WA State Licensed" },
                { icon: CheckCircle, label: "Verified Vendors" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden md:block absolute bottom-10 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* ── Event Types Row ── */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container px-4">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              What kind of event are you planning?
            </h2>
          </div>

          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="flex gap-4 overflow-x-auto pb-4 md:pb-0 md:grid md:grid-cols-5 md:overflow-visible snap-x snap-mandatory">
            {EVENT_TYPES.map((type) => {
              const meta = EVENT_TYPE_META[type.id] ?? {
                shortLine: type.description,
                color: "from-primary/20 to-primary/5",
              };
              const Icon = type.Icon;
              return (
                <Link
                  key={type.id}
                  to={`/submit?type=${type.id}`}
                  className="group flex-shrink-0 w-52 md:w-auto snap-start"
                >
                  <div
                    className={`rounded-2xl bg-gradient-to-b ${meta.color} border border-border hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 p-6 h-full flex flex-col gap-3`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-background/60 backdrop-blur-sm flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold mb-1">
                        {type.label}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-snug">
                        {meta.shortLine}
                      </p>
                    </div>
                    <span className="text-xs text-primary font-medium mt-auto">
                      Plan this event →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Three Value Props ── */}
      <section className="py-24 md:py-32">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Built for the Host, Not the Platform
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              No hidden fees. No locked data. No surprises. Just a transparent
              marketplace that works for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: DollarSign,
                stat: "90%+",
                statLabel: "Stays with you",
                title: "Creators Keep 90%+",
                description:
                  "Direct deposit within 48 hours of your event. No platform monthly fee. One transparent take rate shown before you commit to anything.",
                image: IMAGES.features.profit,
              },
              {
                icon: Database,
                stat: "100%",
                statLabel: "Your data",
                title: "You Own Your Fan Data",
                description:
                  "Full attendee export after every event. No paywall, no lock-in. Your audience is yours to keep growing.",
                image: IMAGES.features.teamwork,
              },
              {
                icon: Clock,
                stat: "0",
                statLabel: "Hidden fees",
                title: "Transparent Fees Only",
                description:
                  "See your full cost breakdown before committing to anything. What you see in the calculator is exactly what you pay.",
                image: IMAGES.features.planning,
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="aspect-[16/10] relative overflow-hidden">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                    fallbackType="event"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground">
                      <span className="font-display text-2xl font-bold">
                        {item.stat}
                      </span>
                      <span className="text-xs opacity-90">{item.statLabel}</span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Seattle Bar Service Callout ── */}
      <section className="py-20 md:py-28 relative overflow-hidden bg-card">
        <div className="absolute inset-0 opacity-20">
          <ImageWithFallback
            src={IMAGES.lifestyle.bar}
            alt=""
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-card/80" />
        </div>

        <div className="container px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Beer className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary tracking-wide">
                Available Now in Seattle
              </span>
            </div>

            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Licensed Bar Service Available in Seattle
            </h2>

            <p className="text-muted-foreground text-lg mb-4 leading-relaxed">
              Clubless holds a Washington State Liquor and Cannabis Board
              license covering wine, beer, and spirits, plus a City of Seattle
              catering license. That means we can provide full bar service at
              your private event right now, no waiting.
            </p>

            <p className="text-muted-foreground text-base mb-10">
              Corporate events, birthdays, weddings, private parties. Book
              licensed bar service through Clubless and have it handled from
              pour to cleanup.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" asChild className="group">
                <Link to="/bar-service">
                  Book Bar Service
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/vendors?category=bartending">
                  Browse Bartending Vendors
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
              {[
                "WA State Liquor Board Licensed",
                "Seattle Catering Licensed",
                "Wine, Beer & Spirits",
                "Private Events Only",
              ].map((badge) => (
                <div key={badge} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Vendor Marketplace ── */}
      <section className="py-24 md:py-32 bg-card">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                Everything You Need, One Place
              </h2>
              <p className="text-muted-foreground text-lg max-w-lg">
                Browse verified vendors for bartending, catering, security, DJ
                equipment, and more. All bookable through Clubless.
              </p>
            </div>
            <Button variant="outline" asChild className="self-start md:self-auto">
              <Link to="/vendors">
                Browse All Vendors
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {VENDOR_CATEGORIES_WITH_IMAGES.slice(0, 6).map((category) => (
              <Link
                key={category.id}
                to={`/vendors?category=${category.id}`}
                className="group block"
              >
                <div className="rounded-2xl overflow-hidden bg-background border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <ImageWithFallback
                      src={category.image}
                      alt={category.label}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                      fallbackType="vendor"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                      <h3 className="font-display text-lg md:text-xl font-semibold text-foreground mb-1">
                        {category.label}
                      </h3>
                      <p className="text-sm text-muted-foreground hidden md:block">
                        {category.description}
                      </p>
                      <span className="text-xs text-primary font-medium mt-2 block">
                        {category.count > 0
                          ? `${category.count} vendors →`
                          : "Coming soon →"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex justify-center gap-4 mt-10">
            <Button variant="outline" asChild>
              <Link to="/vendor/apply">Become a Vendor</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={IMAGES.events.dance}
            alt="Event celebration"
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/90 to-background md:bg-gradient-to-r md:from-background md:via-background/95 md:to-background/80" />
        </div>

        <div className="container px-4 relative">
          <div className="max-w-2xl text-center md:text-left mx-auto md:mx-0">
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Ready to see your numbers?
            </h2>
            <p className="text-muted-foreground text-xl mb-10 leading-relaxed">
              Run your event through the calculator and see exactly what you
              keep. Then submit your event and we take it from there.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="xl" asChild className="group">
                <Link to="/calculator">
                  Open the Calculator
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/submit">Submit Your Event</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
