import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { IMAGES } from "@/lib/images";
import {
  Beer,
  Users,
  Shield,
  Calendar,
  Clock,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";

interface InquiryForm {
  name: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  guestCount: string;
  message: string;
}

const EMPTY_FORM: InquiryForm = {
  name: "",
  email: "",
  phone: "",
  eventType: "",
  eventDate: "",
  guestCount: "",
  message: "",
};

const WHAT_WE_OFFER = [
  {
    icon: Shield,
    title: "We Bring the License",
    body: "Washington State Liquor and Cannabis Board licensed. Wine, beer, and spirits at any private event in Seattle.",
  },
  {
    icon: Users,
    title: "Professional Service",
    body: "Experienced bartenders sourced per event. We handle staffing, setup, and breakdown.",
  },
  {
    icon: Beer,
    title: "Flexible Events",
    body: "Corporate parties, birthdays, private dinners, pop-ups, weddings, small gatherings. Any private event in Seattle.",
  },
];

const PRICING_TIERS = [
  {
    name: "The Essentials",
    subtitle: "Up to 50 guests, 4-hour minimum",
    price: "$499",
    isCustom: false,
    includes: [
      "1 MAST-certified bartender",
      "Bar setup and teardown",
      "License coverage",
      "Ice, napkins, and garnishes",
    ],
  },
  {
    name: "The Standard",
    subtitle: "50 to 150 guests, up to 6 hours",
    price: "$950",
    isCustom: false,
    featured: true,
    includes: [
      "1 to 2 MAST-certified bartenders",
      "Full bar setup and teardown",
      "License coverage",
      "Garnishes, supplies, and cocktail menu consult",
    ],
  },
  {
    name: "The Full Night",
    subtitle: "150+ guests, custom duration",
    price: "Custom",
    isCustom: true,
    includes: [
      "Full bartender staffing",
      "Custom cocktail menu design",
      "Full bar setup and teardown",
      "License coverage",
    ],
  },
];

const EVENT_TYPES = [
  "Corporate holiday parties",
  "Birthday parties (18+)",
  "Private dinners and brunches",
  "Pop-up events",
  "Wedding receptions",
  "Office events and team celebrations",
  "Art shows and gallery openings",
];

const FAQS = [
  {
    q: "Do I need my own liquor license?",
    a: "No. We hold the Washington State Liquor and Cannabis Board catering license. You are the private host. We handle all alcohol service compliance.",
  },
  {
    q: "Do you provide the alcohol?",
    a: "Most clients provide their own alcohol — we tell you exactly what and how much to buy, which saves you 30 to 50% vs. buying through a service. We can also source alcohol at cost plus a small logistics fee. Ask us when you inquire.",
  },
  {
    q: "Are your bartenders certified?",
    a: "Yes. All staff hold current MAST permits — Washington State Mandatory Alcohol Server Training — as required by the WSLCB. No exceptions.",
  },
  {
    q: "How far in advance do I need to book?",
    a: "At least 4 weeks for most events. 6 to 8 weeks for summer weekends, holidays, or events over 100 guests. Popular Saturdays book out fast.",
  },
  {
    q: "What is the minimum booking length?",
    a: "All bookings have a 4-hour minimum. This covers 1 hour of setup, your service time, and 30 minutes of teardown. You pay for 4 hours regardless of event length.",
  },
  {
    q: "What about gratuity?",
    a: "For casual events, a tip jar on the bar is standard. For corporate or formal events where you prefer no tip jar, we add a $75 per bartender hosted gratuity to the invoice. Your choice.",
  },
  {
    q: "What areas do you serve?",
    a: "All of Seattle and the greater Seattle metro area, including Bellevue, Kirkland, and Redmond.",
  },
];

export default function BarService() {
  const [form, setForm] = useState<InquiryForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEventTypeChange(value: string) {
    setForm((prev) => ({ ...prev, eventType: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      const edgeFunctionUrl = supabaseUrl
        ? `${supabaseUrl}/functions/v1/bar-service-inquiry`
        : "/functions/v1/bar-service-inquiry";

      const res = await fetch(edgeFunctionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          event_type: form.eventType || null,
          event_date: form.eventDate || null,
          guest_count: form.guestCount ? parseInt(form.guestCount, 10) : null,
          message: form.message || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("bar-service-inquiry edge function error:", data);
      }

      setSubmitted(true);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error("bar-service-inquiry: Unexpected error:", err);
      // Still show confirmation — do not block the user if something goes wrong
      setSubmitted(true);
      setForm(EMPTY_FORM);
    } finally {
      setSubmitting(false);
    }
  }

  function scrollToForm() {
    document.getElementById("inquiry-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function scrollToPricing() {
    document.getElementById("pricing")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[60vh] md:min-h-[580px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={IMAGES.vendors.bartending}
            alt="Licensed bartender at a private event"
            className="w-full h-full object-cover"
            fallbackSrc={IMAGES.lifestyle.bar}
          />
          <div className="absolute inset-0 bg-black/65" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <Badge className="mb-5 bg-amber-500/20 text-amber-300 border-amber-500/40 text-sm font-medium px-4 py-1.5">
            <Star className="w-3.5 h-3.5 mr-1.5" />
            WA State Liquor Board Licensed
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-5 leading-tight">
            Licensed Bar Service
            <br />
            in Seattle
          </h1>

          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto">
            We hold the Washington State liquor license. You plan the party.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-8"
              onClick={scrollToForm}
            >
              Book Bar Service
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
              onClick={scrollToPricing}
            >
              See Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              What's Included
            </h2>
            <p className="text-muted-foreground text-lg">
              Everything you need for a fully licensed, professionally staffed bar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WHAT_WE_OFFER.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-card p-8 flex flex-col gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Pricing</h2>
            <p className="text-muted-foreground text-lg">
              Straightforward rates. No surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border p-8 flex flex-col gap-5 relative ${
                  tier.featured
                    ? "border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/10"
                    : "border-border bg-card"
                }`}
              >
                {tier.featured && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-semibold px-3">
                    Most Popular
                  </Badge>
                )}

                <div>
                  <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground">{tier.subtitle}</p>
                </div>

                <div className="flex items-end gap-1">
                  <span
                    className={`font-bold leading-none ${
                      tier.isCustom ? "text-3xl" : "text-4xl"
                    }`}
                  >
                    {tier.price}
                  </span>
                  {!tier.isCustom && (
                    <span className="text-muted-foreground mb-1 text-sm">
                      starting
                    </span>
                  )}
                </div>

                <ul className="flex flex-col gap-2.5">
                  {tier.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`mt-auto w-full ${
                    tier.featured
                      ? "bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                      : ""
                  }`}
                  variant={tier.featured ? "default" : "outline"}
                  onClick={scrollToForm}
                >
                  Get a Quote
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="text-center space-y-1.5 text-sm text-muted-foreground">
            <p>4-hour minimum applies to all bookings.</p>
            <p>Prices do not include alcohol. Client provides alcohol (we tell you exactly what to buy).</p>
            <p>Gratuity is separate: tip jar on bar, or $75/bartender hosted gratuity for formal events.</p>
          </div>
        </div>
      </section>

      {/* Event Types */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                We Service All Types of Private Events
              </h2>
              <p className="text-muted-foreground mb-8">
                If it's private and in Seattle, we can serve it. Here's a sample
                of what we've covered.
              </p>
              <Button
                size="lg"
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                onClick={scrollToForm}
              >
                Book Your Event
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>

            <ul className="flex flex-col gap-3">
              {EVENT_TYPES.map((type) => (
                <li key={type} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  <span className="text-base">{type}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Common Questions
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {FAQS.map(({ q, a }, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                <button
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-accent/40 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-base">{q}</span>
                  <span className="text-muted-foreground shrink-0">
                    {openFaq === i
                      ? <ChevronUp className="w-4 h-4" />
                      : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-muted-foreground leading-relaxed text-sm">
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry Form */}
      <section id="inquiry-form" className="py-20 px-4 bg-background">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Book Bar Service
            </h2>
            <p className="text-muted-foreground text-lg">
              Tell us about your event and we'll get back to you fast.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-12 text-center">
              <CheckCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Inquiry Received</h3>
              <p className="text-muted-foreground mb-6">
                We'll reach out within 24 hours to confirm availability and details.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setSubmitted(false)}
                >
                  Submit Another Inquiry
                </Button>
                <Button asChild className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
                  <Link to="/vendors">Browse Vendors</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/">Back to Home</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-border bg-card p-8 flex flex-col gap-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    autoComplete="name"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(206) 555-0100"
                    value={form.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select
                    value={form.eventType}
                    onValueChange={handleEventTypeChange}
                  >
                    <SelectTrigger id="eventType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Corporate">Corporate</SelectItem>
                      <SelectItem value="Birthday">Birthday</SelectItem>
                      <SelectItem value="Wedding">Wedding</SelectItem>
                      <SelectItem value="Pop-up">Pop-up</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    name="eventDate"
                    type="date"
                    value={form.eventDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="guestCount">Estimated Guest Count</Label>
                  <Input
                    id="guestCount"
                    name="guestCount"
                    type="number"
                    min="1"
                    placeholder="e.g. 75"
                    value={form.guestCount}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Tell us more about your event, venue, or any questions you have."
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold w-full"
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send Inquiry"}
                {!submitting && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-5">
            We respond within 24 hours. Events book fast on weekends.
          </p>
        </div>
      </section>
    </Layout>
  );
}
