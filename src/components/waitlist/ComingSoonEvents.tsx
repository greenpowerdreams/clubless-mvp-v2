import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { WaitlistForm } from "./WaitlistForm";
import { IMAGES } from "@/lib/images";
import { Calendar, MapPin, Sparkles, ArrowRight } from "lucide-react";

interface ComingSoonEventsProps {
  city?: string;
}

export function ComingSoonEvents({ city = "Seattle" }: ComingSoonEventsProps) {
  return (
    <div className="max-w-3xl mx-auto text-center py-8">
      {/* Hero visual */}
      <div className="relative mb-10">
        <div className="grid grid-cols-3 gap-3 opacity-60">
          {[IMAGES.events.party, IMAGES.events.rooftop, IMAGES.events.lounge].map((img, i) => (
            <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden">
              <ImageWithFallback
                src={img}
                alt="Upcoming event preview"
                className="w-full h-full"
                fallbackType="event"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">Coming Soon</span>
      </div>

      <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
        Events are Coming to {city}
      </h2>

      <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
        We're onboarding our first creators and venues now. Join the early access list to get notified when the first events drop.
      </p>

      {/* Waitlist Form */}
      <div className="max-w-md mx-auto mb-10">
        <WaitlistForm 
          defaultInterest="attendee" 
          sourcePage="/events" 
          variant="compact"
        />
      </div>

      {/* What to expect */}
      <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-10">
        {[
          { icon: Calendar, label: "Curated Events", desc: "Quality over quantity" },
          { icon: MapPin, label: "Local Venues", desc: "Unique Seattle spots" },
          { icon: Sparkles, label: "Early Access", desc: "First dibs on tickets" },
        ].map((item, i) => (
          <div key={i} className="p-4 rounded-xl bg-card border border-border">
            <item.icon className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="font-semibold text-sm">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="outline" size="lg" asChild>
          <Link to="/signup?role=creator">
            Apply to Host
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="lg" asChild>
          <Link to="/how-it-works">Learn How It Works</Link>
        </Button>
      </div>

      {/* Disclaimer */}
      <p className="mt-10 text-xs text-muted-foreground max-w-md mx-auto">
        Clubless Collective is currently in early access. Events will appear here once approved and published by our team.
      </p>
    </div>
  );
}
