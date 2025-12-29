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
  Music,
  Wine,
  MapPin,
  Zap,
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
        
        {/* Animated orbs */}
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-secondary/30 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[80px] animate-float" />

        <div className="container relative z-10 px-4 pt-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                Nightlife Reimagined
              </span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 animate-slide-up leading-tight">
              <span className="text-gradient-brand">Clubless Collective</span>
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-foreground/90 mb-2 animate-slide-up" style={{ animationDelay: "0.05s" }}>
              Mobile Bar, Catering & Events
            </p>

            <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              We handle the venue, bar, catering, staffing, and logistics—so you 
              can focus on having a great time and keeping the profits.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button variant="gradient" size="xl" asChild className="glow-primary">
                <Link to="/submit">
                  Join The Collective
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/calculator">Calculate Your Profit</Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 mt-12 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent" />
                <span className="text-sm font-semibold text-foreground">Seattle</span>
              </div>
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                <span className="text-sm font-bold text-foreground">150+ Events</span>
              </div>
              <div className="flex items-center gap-2">
                <Wine className="w-5 h-5 text-neon-gold" />
                <span className="text-sm font-semibold text-foreground">Licensed & Insured</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 rounded-full border-2 border-foreground/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-2.5 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
        <div className="container px-4 relative">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold uppercase tracking-wider text-sm mb-3">
              Why Go Clubless?
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Crafting Extraordinary{" "}
              <span className="text-gradient">Moments</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              We give you the tools, licenses, and people to turn any space into 
              your own club, and any event into your playground.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
                className="glass rounded-2xl p-8 hover:border-primary/40 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-xl ${item.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <item.icon className={`w-7 h-7 ${item.color}`} />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-gradient-card border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
        </div>
        <div className="container px-4 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: "$12K+", label: "Avg. Event Profit", color: "text-primary" },
              { value: "150+", label: "Events Hosted", color: "text-secondary" },
              { value: "85%", label: "Revenue to You", color: "text-accent" },
              { value: "48hrs", label: "Event Approval", color: "text-primary" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`font-display text-3xl md:text-5xl font-bold ${stat.color} mb-2`}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Preview */}
      <section className="py-20 md:py-32">
        <div className="container px-4">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold uppercase tracking-wider text-sm mb-3">
              Simple Process
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              How It <span className="text-gradient">Works</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
                <div className="text-8xl font-display font-bold text-gradient opacity-20 absolute -top-4 -left-2">
                  {item.step}
                </div>
                <div className="relative pt-12 pl-4">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="gradient" size="lg" asChild>
              <Link to="/how-it-works">
                Learn More
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-32">
        <div className="container px-4">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/80 to-accent opacity-90" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,transparent,rgba(0,0,0,0.4))]" />
            
            <div className="relative z-10 py-16 md:py-24 px-8 text-center">
              <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-6">
                Ready to Host Your First Event?
              </h2>
              <p className="text-foreground/80 text-lg max-w-xl mx-auto mb-10">
                See exactly how much you could make. Our profit calculator shows
                you the numbers before you commit.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="xl"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  asChild
                >
                  <Link to="/calculator">
                    Calculate Profit
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  className="border-foreground/30 text-foreground hover:bg-foreground/10"
                  asChild
                >
                  <Link to="/submit">Submit Event Idea</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}