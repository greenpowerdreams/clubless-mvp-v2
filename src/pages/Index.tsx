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
  Store,
  Utensils,
  Camera,
  Music,
  CheckCircle,
  Zap,
} from "lucide-react";
import heroImage from "@/assets/hero-party.jpg";

export default function Index() {
  return (
    <Layout>
      {/* Hero Section - Clean, impactful */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-background/80" />
        
        {/* Subtle ambient decoration */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-[100px]" />

        <div className="container relative z-10 px-4 pt-24 pb-16 md:pt-20 md:pb-20">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary tracking-wide">
                The Operating System for Independent Events
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 animate-slide-up tracking-tight">
              Turn Your Events
              <br />
              <span className="text-primary">Into Profit</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Plan, price, and launch licensed events with transparent costs — without needing a club.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button size="lg" asChild>
                <Link to="/signup?role=creator">
                  Create an Event
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/events">Find Events</Link>
              </Button>
            </div>

            {/* Tertiary CTA */}
            <p className="mt-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.3s" }}>
              Are you a vendor?{" "}
              <Link to="/vendor/apply" className="text-primary hover:underline font-medium">
                Join our network →
              </Link>
            </p>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4 text-primary" />
                <span>Transparent Calculator</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                <span>Ticketing via Stripe</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span>Verified Vendors</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-5 h-8 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Value Props - Clean grid */}
      <section className="py-20 md:py-28 bg-card">
        <div className="container px-4">
          <div className="text-center mb-14">
            <p className="text-primary font-medium text-sm mb-3 tracking-wide uppercase">
              Why Clubless?
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold">
              Built for Creators
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: DollarSign,
                title: "Keep More Profit",
                description: "Traditional venues take up to 80%. We flip the script—you earn 70-85% of bar sales.",
              },
              {
                icon: Shield,
                title: "Zero Hassle",
                description: "Licensing, insurance, permits, staffing, bar setup—all handled. You focus on your vision.",
              },
              {
                icon: TrendingUp,
                title: "Full Transparency",
                description: "Know exactly what you'll make before you book. No hidden fees, no surprises.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="p-6 md:p-8 rounded-xl bg-secondary border border-border hover:border-primary/30 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Artist-Controlled Events */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-primary font-medium text-sm mb-3 tracking-wide uppercase">
                  Your Event, Your Rules
                </p>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-5">
                  Artist-Controlled Events
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  You own your event. Set the vibe, curate the crowd, and keep the profits. 
                  We handle the boring stuff—licenses, bar, and logistics—so you can focus on creating unforgettable experiences.
                </p>
                <div className="flex flex-wrap gap-3">
                  {["Your Vision", "Your Crowd", "Your Profit"].map((item) => (
                    <span 
                      key={item} 
                      className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-secondary border border-border overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-10 h-10 text-primary" />
                      </div>
                      <p className="font-display text-2xl font-bold mb-2">Create Magic</p>
                      <p className="text-muted-foreground text-sm">Turn any space into your venue</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 bg-card">
        <div className="container px-4">
          <div className="text-center mb-14">
            <p className="text-primary font-medium text-sm mb-3 tracking-wide uppercase">
              Simple Process
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                icon: Calendar,
                title: "Dream It Up",
                description: "Pick your venue, choose your vibe, estimate your crowd. Use our calculator to see projected earnings.",
              },
              {
                step: "02",
                icon: Users,
                title: "Plan With Us",
                description: "Select your bar package and staffing needs. We handle licenses, insurance, and permits.",
              },
              {
                step: "03",
                icon: DollarSign,
                title: "Host & Profit",
                description: "We handle setup and service. You bring the energy. Get paid within 72 hours.",
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <span className="font-display text-6xl md:text-7xl font-bold text-primary/10 absolute -top-4 left-0">
                  {item.step}
                </span>
                <div className="relative pt-12 pl-2">
                  <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" asChild>
              <Link to="/how-it-works">
                Learn More
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Vendor Marketplace */}
      <section className="py-20 md:py-28">
        <div className="container px-4">
          <div className="text-center mb-14">
            <p className="text-accent font-medium text-sm mb-3 tracking-wide uppercase">
              Vendor Marketplace
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Browse verified vendors for bartending, catering, security, and more. 
              Build your perfect event team.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-10">
            {[
              { icon: Wine, label: "Bartending" },
              { icon: Utensils, label: "Catering" },
              { icon: Shield, label: "Security" },
              { icon: Camera, label: "Photo/Video" },
              { icon: Music, label: "DJ Equipment" },
              { icon: Sparkles, label: "Decor" },
              { icon: Users, label: "Staffing" },
              { icon: Store, label: "AV Equipment" },
            ].map((item, index) => (
              <div 
                key={index}
                className="p-4 md:p-5 rounded-xl bg-secondary border border-border text-center hover:border-primary/30 transition-colors group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 transition-colors">
                  <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/vendors">
                Browse Vendors
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/vendor/apply">Become a Vendor</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-card">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-5">
              Ready to Host?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              See exactly how much you could make. Our profit calculator shows 
              you the numbers before you commit.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild>
                <Link to="/calculator">
                  Calculate Profit
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/submit">Become a Host</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
