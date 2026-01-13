import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Shield,
  Sparkles,
  Wine,
  MapPin,
} from "lucide-react";
import heroImage from "@/assets/hero-party.jpg";

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
        
        {/* Animated orbs - smaller on mobile */}
        <div className="absolute top-1/3 left-1/4 w-48 md:w-72 h-48 md:h-72 bg-secondary/30 rounded-full blur-[80px] md:blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-1/3 right-1/4 w-40 md:w-64 h-40 md:h-64 bg-primary/20 rounded-full blur-[60px] md:blur-[80px] animate-float" />

        <div className="container relative z-10 px-4 sm:px-6 pt-24 md:pt-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-primary/10 border border-primary/30 mb-4 md:mb-8 animate-fade-in">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              <span className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wide">
                Nightlife Reimagined
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold mb-3 md:mb-6 animate-slide-up leading-tight">
              <span className="text-primary">Clubless Collective</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground/90 mb-2 animate-slide-up" style={{ animationDelay: "0.05s" }}>
              Mobile Bar, Catering & Events
            </p>

            <p className="text-base md:text-xl text-foreground/80 max-w-2xl mx-auto mb-6 md:mb-10 px-2 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              We handle the venue, bar, catering, staffing, and logistics—so you 
              can focus on having a great time and keeping the profits.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4 sm:px-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button variant="default" size="lg" asChild className="w-full sm:w-auto">
                <Link to="/submit">
                  Become a Host
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="glass" size="lg" asChild className="w-full sm:w-auto">
                <Link to="/calculator">Calculate Your Profit</Link>
              </Button>
            </div>

            {/* Trust indicators - stack on mobile */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-8 mt-8 md:mt-12 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                <span className="text-sm font-semibold text-foreground">Seattle</span>
              </div>
              <div className="flex items-center gap-2">
                <Wine className="w-4 h-4 md:w-5 md:h-5 text-neon-gold" />
                <span className="text-sm font-semibold text-foreground">Licensed & Insured</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator - hide on mobile */}
        <div className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 rounded-full border-2 border-foreground/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-2.5 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-12 md:py-32 relative">
        <div className="absolute inset-0 bg-card/50" />
        <div className="container px-4 sm:px-6 relative">
          <div className="text-center mb-10 md:mb-16">
            <p className="text-primary font-semibold uppercase tracking-wider text-xs md:text-sm mb-2 md:mb-3">
              Why Go Clubless?
            </p>
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              Crafting Extraordinary{" "}
              <span className="text-primary">Moments</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-lg px-2">
              We give you the tools, licenses, and people to turn any space into 
              your own club, and any event into your playground.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: DollarSign,
                title: "Keep More Profit",
                description:
                  "Traditional venues take up to 80% of bar revenue. With us, you earn 70-85% of bar sales.",
                color: "text-primary",
                bgColor: "bg-primary/10",
              },
              {
                icon: Shield,
                title: "We Handle Everything",
                description:
                  "Licensing, insurance, permits, staffing, bar setup—all covered. You focus on the vibe.",
                color: "text-accent",
                bgColor: "bg-accent/10",
              },
              {
                icon: TrendingUp,
                title: "Full Transparency",
                description:
                  "Know exactly what you'll make before you book. No hidden fees, no surprises.",
                color: "text-secondary",
                bgColor: "bg-secondary/10",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="glass rounded-xl md:rounded-2xl p-5 md:p-8 hover:border-primary/40 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl ${item.bgColor} flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform`}>
                  <item.icon className={`w-5 h-5 md:w-7 md:h-7 ${item.color}`} />
                </div>
                <h3 className="font-display text-lg md:text-xl font-semibold mb-2 md:mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm md:text-base">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Artist-Controlled Events */}
      <section className="py-12 md:py-20 bg-card border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-secondary/20 rounded-full blur-[80px] md:blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-48 md:w-80 h-48 md:h-80 bg-primary/20 rounded-full blur-[60px] md:blur-[100px]" />
        </div>
        <div className="container px-4 sm:px-6 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mb-4 md:mb-6">
              <span className="text-primary">Artist-Controlled</span> Events
            </h2>
            <p className="text-muted-foreground text-base md:text-lg mb-6 md:mb-8">
              You own your event. You set the vibe, curate the crowd, and keep the profits. 
              We just handle the boring stuff—licenses, bar, and logistics.
            </p>
            <div className="flex flex-wrap justify-center gap-3 md:gap-4">
              {["Your Vision", "Your Crowd", "Your Profit"].map((item, index) => (
                <div 
                  key={index} 
                  className="px-4 py-2 md:px-6 md:py-3 rounded-full bg-primary/10 border border-primary/30"
                >
                  <span className="text-sm md:text-base font-semibold text-primary">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Preview */}
      <section className="py-12 md:py-32">
        <div className="container px-4 sm:px-6">
          <div className="text-center mb-10 md:mb-16">
            <p className="text-primary font-semibold uppercase tracking-wider text-xs md:text-sm mb-2 md:mb-3">
              Simple Process
            </p>
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              How It <span className="text-primary">Works</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                icon: Calendar,
                title: "Dream It Up",
                description:
                  "Pick your venue, choose your vibe, estimate your crowd. Use our calculator to see projected earnings.",
              },
              {
                step: "02",
                icon: Users,
                title: "Plan With Us",
                description:
                  "Select your bar package and staffing needs. We handle licenses, insurance, permits, and execution.",
              },
              {
                step: "03",
                icon: DollarSign,
                title: "Host & Profit",
                description:
                  "We handle setup, staffing, and bar. You bring the crowd and the energy. Get paid within 72 hours.",
              },
            ].map((item, index) => (
              <div key={index} className="relative group">
                <div className="text-6xl md:text-8xl font-display font-bold text-primary/20 absolute -top-2 md:-top-4 -left-1 md:-left-2">
                  {item.step}
                </div>
                <div className="relative pt-10 md:pt-12 pl-3 md:pl-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-muted flex items-center justify-center mb-3 md:mb-4 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-lg md:text-xl font-semibold mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm md:text-base">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 md:mt-12">
            <Button variant="default" size="default" asChild className="w-full sm:w-auto">
              <Link to="/how-it-works">
                Learn More
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-32">
        <div className="container px-4 sm:px-6">
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-secondary opacity-90" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,transparent,rgba(0,0,0,0.4))]" />
            
            <div className="relative z-10 py-10 md:py-24 px-5 md:px-8 text-center">
              <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-4 md:mb-6">
                Ready to Host Your First Event?
              </h2>
              <p className="text-foreground/80 text-sm md:text-lg max-w-xl mx-auto mb-6 md:mb-10">
                See exactly how much you could make. Our profit calculator shows
                you the numbers before you commit.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold w-full sm:w-auto"
                  asChild
                >
                  <Link to="/calculator">
                    Calculate Profit
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-foreground/30 text-foreground hover:bg-foreground/10 w-full sm:w-auto"
                  asChild
                >
                  <Link to="/submit">Become a Host</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}