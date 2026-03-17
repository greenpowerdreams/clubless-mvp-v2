import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import {
  ArrowRight,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Shield,
  Sparkles,
  CheckCircle,
  Zap,
  Star,
  Play,
} from "lucide-react";
import { IMAGES, VENDOR_CATEGORIES_WITH_IMAGES, TESTIMONIALS } from "@/lib/images";

export default function Index() {
  return (
    <Layout>
      {/* Hero Section - Full-bleed immersive */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with dark overlay */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src={IMAGES.hero.main}
            alt="Nightlife event"
            className="absolute inset-0 w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />
        </div>
        
        {/* Subtle ambient glow */}
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="container relative z-10 px-4 pt-32 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-4xl mx-auto text-center">
            {/* Early Access Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in backdrop-blur-sm">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary tracking-wide">
                Now Onboarding Seattle Creators + Vendors
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 animate-slide-up tracking-tight leading-[0.9]">
              Turn Your Events
              <br />
              <span className="text-primary">Into Profit</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up leading-relaxed" style={{ animationDelay: "0.1s" }}>
              Plan, price, and launch licensed events with transparent costs — without needing a club.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button size="xl" asChild className="group">
                <Link to="/signup?role=creator">
                  Apply to Host
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/events">Get Notified</Link>
              </Button>
            </div>

            {/* Tertiary CTA */}
            <p className="mt-8 text-base text-muted-foreground animate-fade-in" style={{ animationDelay: "0.3s" }}>
              Are you a vendor?{" "}
              <Link to="/vendor/apply" className="text-primary hover:underline font-medium">
                Join our network →
              </Link>
            </p>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 mt-16 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              {[
                { icon: DollarSign, label: "Transparent Calculator" },
                { icon: Shield, label: "Ticketing via Stripe" },
                { icon: CheckCircle, label: "Verified Vendors" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hidden md:block absolute bottom-10 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Early Access Waitlist Section */}
      <section className="py-24 md:py-32 bg-card">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium text-accent">Early Access</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Be the First to Know
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join the waitlist to get notified when events launch in Seattle.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <WaitlistForm variant="hero" sourcePage="/" />
          </div>
        </div>
      </section>

      {/* Value Props - Visual Cards */}
      <section className="py-24 md:py-32">
        <div className="container px-4">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold text-sm mb-2 tracking-wide uppercase">
              Why Clubless?
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Built for Creators
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Stop giving away your profit. Take control of your events and keep what you earn.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: DollarSign,
                title: "Keep More Profit",
                description: "Traditional venues take up to 80%. We flip the script—you earn 70-85% of bar sales.",
                image: IMAGES.features.profit,
                stat: "85%",
                statLabel: "Your earnings",
              },
              {
                icon: Shield,
                title: "Zero Hassle",
                description: "Licensing, insurance, permits, staffing, bar setup—all handled. You focus on your vision.",
                image: IMAGES.features.teamwork,
                stat: "100%",
                statLabel: "Compliant",
              },
              {
                icon: TrendingUp,
                title: "Full Transparency",
                description: "Know exactly what you'll make before you book. No hidden fees, no surprises.",
                image: IMAGES.features.planning,
                stat: "72h",
                statLabel: "Payout time",
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
                      <span className="font-display text-2xl font-bold">{item.stat}</span>
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
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Visual Timeline */}
      <section className="py-24 md:py-32 bg-card relative overflow-hidden">
        {/* Background image accent */}
        <div className="absolute inset-0 opacity-5">
          <ImageWithFallback
            src={IMAGES.events.festival}
            alt=""
            className="w-full h-full"
          />
        </div>
        
        <div className="container px-4 relative">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold text-sm mb-2 tracking-wide uppercase">
              Simple Process
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              From idea to profit in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                icon: Calendar,
                title: "Dream It Up",
                description: "Pick your venue, choose your vibe, estimate your crowd. Use our calculator to see projected earnings.",
                image: IMAGES.features.planning,
              },
              {
                step: "02",
                icon: Users,
                title: "Plan With Us",
                description: "Select your bar package and staffing needs. We handle licenses, insurance, and permits.",
                image: IMAGES.features.teamwork,
              },
              {
                step: "03",
                icon: DollarSign,
                title: "Host & Profit",
                description: "We handle setup and service. You bring the energy. Get paid within 72 hours.",
                image: IMAGES.features.hosting,
              },
            ].map((item, index) => (
              <div key={index} className="relative group">
                {/* Connection line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-24 left-[calc(100%+1rem)] w-[calc(100%-2rem)] h-px bg-border" />
                )}
                
                <div className="rounded-2xl overflow-hidden bg-secondary border border-border hover:border-primary/30 transition-all duration-300">
                  <div className="aspect-video relative overflow-hidden">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                      fallbackType="event"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/60 to-transparent" />
                    <span className="absolute top-4 left-4 font-display text-5xl font-bold text-primary/30">
                      {item.step}
                    </span>
                  </div>
                  <div className="p-6 pt-4">
                    <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center mb-4">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-display text-xl font-semibold mb-2">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link to="/how-it-works">
                Learn More
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Vendor Marketplace */}
      <section className="py-24 md:py-32">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <p className="text-accent font-semibold text-sm mb-2 tracking-wide uppercase">
                Vendor Marketplace
              </p>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                Everything You Need
              </h2>
              <p className="text-muted-foreground text-lg max-w-lg">
                Browse verified vendors for bartending, catering, security, and more.
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
            {VENDOR_CATEGORIES_WITH_IMAGES.map((category, index) => (
              <Link
                key={category.id}
                to={`/vendors?category=${category.id}`}
                className="group block"
              >
                <div className="rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
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
                        {category.count} vendors →
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

      {/* Testimonials Section */}
      <section className="py-24 md:py-32 bg-card relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5">
          <ImageWithFallback
            src={IMAGES.lifestyle.vip}
            alt=""
            className="w-full h-full"
          />
        </div>
        
        <div className="container px-4 relative">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold text-sm mb-2 tracking-wide uppercase">
              Testimonials
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Trusted by Creators
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              See what event creators and vendors are saying about Clubless Collective
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {TESTIMONIALS.map((testimonial) => (
              <div
                key={testimonial.id}
                className="rounded-2xl bg-secondary border border-border p-8 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-1 mb-6">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground text-lg leading-relaxed mb-8">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <ImageWithFallback
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-full h-full"
                      fallbackType="profile"
                    />
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Premium hero-style */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src={IMAGES.events.dance}
            alt="Event celebration"
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
        </div>
        
        <div className="container px-4 relative">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Ready to Host?
            </h2>
            <p className="text-muted-foreground text-xl mb-10 leading-relaxed">
              See exactly how much you could make. Our profit calculator shows 
              you the numbers before you commit.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="xl" asChild className="group">
                <Link to="/calculator">
                  <Play className="w-5 h-5" />
                  Calculate Profit
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/submit">Become a Host</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
