import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Sparkles, ArrowUpRight, Star } from "lucide-react";
import { format, addDays } from "date-fns";

// Landing page Supabase project (where real event data lives)
const SB_URL = "https://sdnjbzmyayapmseipcvw.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbmpiem15YXlhcG1zZWlwY3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzg0MjIsImV4cCI6MjA4ODkxNDQyMn0.1MOFLVoTUX3PM-rNoIW3Kt61dwgFwbSIsMwOaZRDKQU";
const HDR = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

const TIME_RANGES = [
  { label: "This Week", days: 7 },
  { label: "Next 2 Weeks", days: 14 },
  { label: "This Month", days: 30 },
];

interface LandingEvent {
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

function formatEventDate(dateStr: string) {
  // event_date is YYYY-MM-DD
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return format(d, "EEEE, MMMM d");
}

function formatEventDateShort(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return { dow: format(d, "EEE"), day: format(d, "d") };
}

function formatTime(timeStr: string) {
  if (!timeStr) return "";
  // Handle ranges like "10:00 PM - 2:00 AM" or "10:00 PM - Late" — take first part
  const first = timeStr.split(" - ")[0].trim();
  // Already has AM/PM — return as-is (clean up spacing)
  const upper = first.toUpperCase();
  if (upper.includes("AM") || upper.includes("PM")) {
    return first.replace(/\s+/g, " ").trim();
  }
  // 24-hour format "HH:MM" or "HH:MM:SS"
  const parts = first.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] ?? "0", 10);
  if (isNaN(h)) return "";
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  const mins = isNaN(m) ? 0 : m;
  return mins === 0 ? `${hour} ${period}` : `${hour}:${mins.toString().padStart(2, "0")} ${period}`;
}

export default function WhosPlaying() {
  const [timeRange, setTimeRange] = useState(7);
  const [events, setEvents] = useState<LandingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [timeRange]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const maxDate = addDays(new Date(), timeRange).toISOString().split("T")[0];
      const fields = "name,venue,neighborhood,event_date,event_time,genre,image_url,ticket_url,source_url,price,featured,popularity_score";
      const res = await fetch(
        `${SB_URL}/rest/v1/events?event_date=gte.${today}&event_date=lte.${maxDate}&image_url=neq.&order=event_date.asc,popularity_score.desc&limit=50&select=${fields}`,
        { headers: HDR }
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data: LandingEvent[] = await res.json();
      setEvents(data);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  // Group by date
  const groupedByDate: Record<string, LandingEvent[]> = {};
  events.forEach((event) => {
    if (!groupedByDate[event.event_date]) groupedByDate[event.event_date] = [];
    groupedByDate[event.event_date]!.push(event);
  });
  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="container px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Who's <span className="text-primary">Playing</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10">
              Seattle nightlife — events happening near you
            </p>

            <Select
              value={String(timeRange)}
              onValueChange={(v) => setTimeRange(Number(v))}
            >
              <SelectTrigger className="w-48 h-12 bg-secondary border-border mx-auto">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map((range) => (
                  <SelectItem key={range.days} value={String(range.days)}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16 md:py-20">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-36 rounded-xl" />
                ))}
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="text-center py-20 max-w-md mx-auto">
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-3">No events yet</h3>
                <p className="text-muted-foreground">
                  No events listed for this period. Check back soon.
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {sortedDates.map((dateKey) => {
                  const dayEvents = groupedByDate[dateKey]!;
                  const { dow, day } = formatEventDateShort(dateKey);

                  return (
                    <div key={dateKey}>
                      {/* Date Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/20 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-xs text-primary font-medium uppercase">{dow}</span>
                          <span className="text-lg font-bold text-primary">{day}</span>
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-semibold">
                            {formatEventDate(dateKey)}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
                          </p>
                        </div>
                      </div>

                      {/* Events for this date */}
                      <div className="space-y-3 ml-[4.25rem]">
                        {dayEvents.map((event, idx) => {
                          const url = event.ticket_url || event.source_url;
                          return (
                            <div
                              key={`${dateKey}-${idx}`}
                              className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors group"
                            >
                              <div className="flex items-start gap-4">
                                {event.image_url && /^https?:\/\//i.test(event.image_url) && (
                                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                                    <img
                                      src={event.image_url}
                                      alt={event.name}
                                      className="w-full h-full object-cover"
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
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-shrink-0 text-primary hover:text-primary/80 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <ArrowUpRight className="w-4 h-4" />
                                      </a>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
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
                                      <Badge variant="secondary" className="text-2xs">
                                        {event.genre}
                                      </Badge>
                                    )}
                                    {event.price && (
                                      <Badge className="text-2xs bg-primary/20 text-primary border-0">
                                        {event.price}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
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
    </Layout>
  );
}
