import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar, MapPin, Users, Sparkles, ArrowRight, ArrowUpRight, Star, Ticket,
} from "lucide-react";
import { format, addDays } from "date-fns";

// ─── Landing page Supabase (curated Seattle scene) ────────────────────────────
const SB_URL = "https://sdnjbzmyayapmseipcvw.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbmpiem15YXlhcG1zZWlwY3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzg0MjIsImV4cCI6MjA4ODkxNDQyMn0.1MOFLVoTUX3PM-rNoIW3Kt61dwgFwbSIsMwOaZRDKQU";
const HDR = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

const TIME_RANGES = [
  { label: "This Week", days: 7 },
  { label: "Next 2 Weeks", days: 14 },
  { label: "This Month", days: 30 },
];

interface CuratedEvent {
  name: string;
  venue: string;
  neighborhood: string;
  event_date: string;
  event_time: string;
  genre: string;
  image_url: string;
  ticket_url: string;
  source_url: string;
  price: string | null;
  featured: boolean;
  popularity_score: number;
}

interface PlatformEvent {
  id: string;
  title: string;
  city: string;
  start_at: string;
  capacity: number;
  cover_image_url: string | null;
  theme: string | null;
  status: string;
  tickets: { price_cents: number; qty_total: number; qty_sold: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEventDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return format(new Date(year, month - 1, day), "EEEE, MMMM d");
}

function formatEventDateShort(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return { dow: format(d, "EEE"), day: format(d, "d") };
}

function formatTime(timeStr: string) {
  if (!timeStr) return "";
  const first = timeStr.split(" - ")[0].trim();
  const upper = first.toUpperCase();
  if (upper.includes("AM") || upper.includes("PM")) return first.replace(/\s+/g, " ").trim();
  const parts = first.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] ?? "0", 10);
  if (isNaN(h)) return "";
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  const mins = isNaN(m) ? 0 : m;
  return mins === 0 ? `${hour} ${period}` : `${hour}:${mins.toString().padStart(2, "0")} ${period}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

function getLowestPrice(tickets: PlatformEvent["tickets"]) {
  if (!tickets?.length) return null;
  const prices = tickets.map((t) => t.price_cents).filter((p) => p > 0);
  return prices.length === 0 ? 0 : Math.min(...prices);
}

function formatPrice(cents: number | null) {
  if (cents === null) return "TBA";
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(0)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Events() {
  // Curated feed state
  const [timeRange, setTimeRange] = useState(7);
  const [curated, setCurated] = useState<CuratedEvent[]>([]);
  const [curatedLoading, setCuratedLoading] = useState(true);

  // Platform events state
  const [platform, setPlatform] = useState<PlatformEvent[]>([]);
  const [platformLoading, setPlatformLoading] = useState(true);

  // Fetch curated events from landing page Supabase
  useEffect(() => {
    const fetchCurated = async () => {
      setCuratedLoading(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        const maxDate = addDays(new Date(), timeRange).toISOString().split("T")[0];
        const fields = "name,venue,neighborhood,event_date,event_time,genre,image_url,ticket_url,source_url,price,featured,popularity_score";
        const res = await fetch(
          `${SB_URL}/rest/v1/events?event_date=gte.${today}&event_date=lte.${maxDate}&image_url=neq.&order=event_date.asc,popularity_score.desc&limit=50&select=${fields}`,
          { headers: HDR }
        );
        if (!res.ok) throw new Error("Failed to fetch");
        setCurated(await res.json());
      } catch (err) {
        console.error("Curated fetch error:", err);
      } finally {
        setCuratedLoading(false);
      }
    };
    fetchCurated();
  }, [timeRange]);

  // Fetch platform events from platform Supabase
  useEffect(() => {
    const fetchPlatform = async () => {
      try {
        const { data } = await supabase
          .from("events")
          .select(`id, title, city, start_at, capacity, cover_image_url, theme, status, tickets(price_cents, qty_total, qty_sold)`)
          .in("status", ["published", "live"])
          .gte("end_at", new Date().toISOString())
          .order("start_at", { ascending: true });
        setPlatform(data || []);
      } catch (err) {
        console.error("Platform fetch error:", err);
      } finally {
        setPlatformLoading(false);
      }
    };
    fetchPlatform();
  }, []);

  // Group curated events by date
  const groupedByDate: Record<string, CuratedEvent[]> = {};
  curated.forEach((e) => {
    if (!groupedByDate[e.event_date]) groupedByDate[e.event_date] = [];
    groupedByDate[e.event_date]!.push(e);
  });
  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <Layout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="container px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <MapPin className="w-3 h-3 mr-1" />
              Seattle
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              What's <span className="text-primary">Happening</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10">
              Curated nightlife. Real events, real venues, right now.
            </p>

            <Select value={String(timeRange)} onValueChange={(v) => setTimeRange(Number(v))}>
              <SelectTrigger className="w-48 h-12 bg-secondary border-border mx-auto">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map((r) => (
                  <SelectItem key={r.days} value={String(r.days)}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* ── Curated Seattle Scene ─────────────────────────────────────────── */}
      <section className="pb-20">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            {curatedLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="text-center py-16 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">No events listed yet</h3>
                <p className="text-muted-foreground">Check back soon. New events drop weekly.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {sortedDates.map((dateKey) => {
                  const dayEvents = groupedByDate[dateKey]!;
                  const { dow, day } = formatEventDateShort(dateKey);

                  return (
                    <div key={dateKey}>
                      {/* Date header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/20 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-xs text-primary font-medium uppercase">{dow}</span>
                          <span className="text-lg font-bold text-primary">{day}</span>
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-semibold">{formatEventDate(dateKey)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
                          </p>
                        </div>
                      </div>

                      {/* Events for this date */}
                      <div className="space-y-3 ml-[4.25rem]">
                        {dayEvents.map((event, idx) => {
                          const url = event.ticket_url || event.source_url;
                          const CardWrapper = url ? "a" : "div";
                          const cardProps = url
                            ? { href: url, target: "_blank", rel: "noopener noreferrer" }
                            : {};
                          return (
                            <CardWrapper
                              key={`${dateKey}-${idx}`}
                              {...(cardProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
                              className="block p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-card/80 transition-all group cursor-pointer"
                            >
                              <div className="flex items-start gap-4">
                                {event.image_url && /^https?:\/\//i.test(event.image_url) && (
                                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                                    <img
                                      src={event.image_url}
                                      alt={event.name}
                                      loading="lazy"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-semibold group-hover:text-primary transition-colors leading-tight">
                                      {event.name}
                                      {event.featured && (
                                        <Star className="inline w-3.5 h-3.5 ml-1.5 text-accent fill-accent" />
                                      )}
                                    </h4>
                                    {url && (
                                      <ArrowUpRight className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
                                    {event.venue && (
                                      <span className="font-medium text-foreground/80">{event.venue}</span>
                                    )}
                                    {event.neighborhood && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {event.neighborhood}
                                      </span>
                                    )}
                                    {event.event_time && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatTime(event.event_time)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {event.genre && (
                                      <Badge variant="secondary" className="text-xs">{event.genre}</Badge>
                                    )}
                                    {event.price && (
                                      <Badge className="text-xs bg-primary/20 text-primary border-0">{event.price}</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardWrapper>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Clubless Events ───────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border bg-card">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">Clubless Events</h2>
                <p className="text-sm text-muted-foreground">Creator-hosted events with full ticketing &amp; support</p>
              </div>
            </div>

            {platformLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
              </div>
            ) : platform.length === 0 ? (
              /* Empty state — no platform events yet */
              <div className="rounded-2xl border border-dashed border-border p-12 text-center max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">First Clubless event drops soon</h3>
                <p className="text-muted-foreground mb-8">
                  We're building something special for Seattle. Want yours to be first?
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild>
                    <Link to="/submit">
                      Submit Your Event
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/calculator">See Your Profit</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {platform.map((event) => {
                  const { date, time } = formatDateTime(event.start_at);
                  const price = getLowestPrice(event.tickets);
                  const available = event.tickets?.reduce((s, t) => s + (t.qty_total - t.qty_sold), 0) ?? 0;

                  return (
                    <Link key={event.id} to={`/events/${event.id}`} className="group block">
                      <div className="rounded-2xl overflow-hidden bg-background border border-border hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                        <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                          {event.cover_image_url && (
                            <img
                              src={event.cover_image_url}
                              alt={event.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          )}
                          {event.status === "live" && (
                            <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">Live Now</Badge>
                          )}
                          <div className="absolute bottom-4 left-4">
                            <div className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                              {formatPrice(price)}
                            </div>
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="font-display text-lg font-semibold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                            {event.title}
                          </h3>
                          <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              <span>{date} · {time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              <span>{event.city}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              <span>{available} spots left</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-border">
                            <p className="font-bold text-lg text-primary">{formatPrice(price)}</p>
                            <Button size="sm">
                              Get Tickets
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Host CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Want to Host Your Own Event?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Turn your event idea into profit. Transparent pricing, full operational support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/calculator">
                  Calculate Your Profit
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/submit">Submit Event Idea</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
