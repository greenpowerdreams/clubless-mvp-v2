import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { WaitlistForm } from "./WaitlistForm";
import { VENDOR_CATEGORIES_WITH_IMAGES } from "@/lib/images";
import { Store, CheckCircle, ArrowRight, Sparkles } from "lucide-react";

export function ComingSoonVendors() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-accent">Launching Soon</span>
        </div>

        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
          Vendor Marketplace Coming Soon
        </h2>

        <p className="text-muted-foreground text-lg max-w-lg mx-auto">
          We're onboarding verified vendors for bartending, catering, security, and more. Be among the first to join.
        </p>
      </div>

      {/* Category Preview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
        {VENDOR_CATEGORIES_WITH_IMAGES.map((category) => (
          <div
            key={category.id}
            className="group rounded-2xl overflow-hidden bg-card border border-border hover:border-muted-foreground/30 transition-colors"
          >
            <div className="aspect-[4/3] relative overflow-hidden">
              <ImageWithFallback
                src={category.image}
                alt={category.label}
                className="w-full h-full opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
                fallbackType="vendor"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-display text-lg font-semibold">{category.label}</h3>
                <p className="text-xs text-muted-foreground">{category.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Benefits */}
      <div className="rounded-2xl bg-card border border-border p-8 mb-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="font-display text-2xl font-bold mb-4">Why Join as a Vendor?</h3>
            <ul className="space-y-3">
              {[
                "Get matched with quality events",
                "Set your own rates and availability",
                "Build your reputation with reviews",
                "Expand your client base",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <Button size="lg" className="w-full" asChild>
              <Link to="/vendor/apply">
                <Store className="w-5 h-5" />
                Apply as a Vendor
              </Link>
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Or join the waitlist below to get notified when we launch.
            </p>
          </div>
        </div>
      </div>

      {/* Waitlist Section */}
      <div className="rounded-2xl bg-secondary border border-border p-8">
        <div className="text-center mb-6">
          <h3 className="font-display text-xl font-semibold mb-2">Join the Vendor Waitlist</h3>
          <p className="text-muted-foreground text-sm">
            Get notified when the marketplace goes live.
          </p>
        </div>
        <div className="max-w-md mx-auto">
          <WaitlistForm 
            defaultInterest="vendor" 
            sourcePage="/vendors" 
            variant="compact"
          />
        </div>
      </div>

      {/* Disclaimer */}
      <p className="mt-8 text-center text-xs text-muted-foreground max-w-md mx-auto">
        The vendor marketplace is currently onboarding. Approved vendors will appear here once verified by our team.
      </p>
    </div>
  );
}
