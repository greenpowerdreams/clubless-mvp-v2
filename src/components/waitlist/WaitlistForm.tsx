import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2, Mail, Sparkles } from "lucide-react";

interface WaitlistFormProps {
  defaultInterest?: "attendee" | "creator" | "vendor";
  sourcePage?: string;
  variant?: "default" | "compact" | "hero";
  onSuccess?: () => void;
}

const CITIES = ["Seattle", "Los Angeles", "San Francisco", "New York", "Miami", "Austin", "San Diego"];

const INTEREST_OPTIONS = [
  { value: "attendee", label: "Attend events", icon: "🎉" },
  { value: "creator", label: "Host events", icon: "🎤" },
  { value: "vendor", label: "Provide services", icon: "🍸" },
];

export function WaitlistForm({
  defaultInterest = "attendee",
  sourcePage,
  variant = "default",
  onSuccess,
}: WaitlistFormProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [interestType, setInterestType] = useState(defaultInterest);
  const [city, setCity] = useState("Seattle");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-waitlist-email", {
        body: {
          email,
          firstName: firstName || undefined,
          interestType,
          city,
          sourcePage: sourcePage || window.location.pathname,
        },
      });

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: "You're on the list! 🎉",
        description: "Check your inbox for a confirmation email.",
      });
      onSuccess?.();
    } catch (error: any) {
      console.error("Waitlist error:", error);
      toast({
        title: "Something went wrong",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`rounded-2xl bg-primary/10 border border-primary/20 p-8 text-center ${variant === "compact" ? "p-6" : ""}`}>
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-display text-xl font-semibold mb-2">You're in! 🎉</h3>
        <p className="text-muted-foreground text-sm">
          Check your inbox for a confirmation email. We'll reach out when we're ready for you.
        </p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 h-12 bg-secondary border-border"
            required
          />
          <Button type="submit" size="lg" disabled={isLoading} className="h-12 px-6">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Join Waitlist
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          We'll notify you when events go live in {city}. No spam, ever.
        </p>
      </form>
    );
  }

  if (variant === "hero") {
    return (
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 h-14 text-base bg-secondary/80 backdrop-blur-sm border-border"
            required
          />
          <Button type="submit" size="xl" disabled={isLoading} className="h-14">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Get Early Access
              </>
            )}
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <Select value={interestType} onValueChange={(v: any) => setInterestType(v)}>
            <SelectTrigger className="w-auto h-9 bg-transparent border-border text-sm">
              <span className="mr-1">I want to</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTEREST_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.icon} {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="w-auto h-9 bg-transparent border-border text-sm">
              <span className="mr-1">in</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </form>
    );
  }

  // Default full form
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name (optional)</Label>
          <Input
            id="firstName"
            placeholder="Your first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="h-12 bg-secondary border-border"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 bg-secondary border-border"
            required
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>I'm interested in</Label>
          <Select value={interestType} onValueChange={(v: any) => setInterestType(v)}>
            <SelectTrigger className="h-12 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTEREST_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.icon} {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>City</Label>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="h-12 bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" size="lg" disabled={isLoading} className="w-full h-12">
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Join Early Access
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        We'll notify you when we launch in {city}. No spam, ever.
      </p>
    </form>
  );
}
