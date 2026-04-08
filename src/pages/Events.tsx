import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { SkeletonGrid } from "@/components/ui/skeleton-card";
import { ComingSoonEvents } from "@/components/waitlist/ComingSoonEvents";
import { supabase } from "@/integrations/supabase/client";
import { IMAGES } from "@/lib/images";
import { Calendar, MapPin, Users, Search, Sparkles, ArrowRight } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  city: string;
  start_at: string;
  end_at: string;
  capacity: number;
  cover_image_url: string | null;
  theme: string | null;
  status: string;
  featured: boolean;
  tickets: {
    price_cents: number;
    qty_total: number;
    qty_sold: number;
  }[];
}

const CITIES = ["All Cities", "Seattle", "Los Angeles", "San Diego", "San Francisco", "New York", "Miami", "Austin"];
const VIBES = ["All Vibes", "Afrohouse", "R&B", "Techno", "Hip-Hop", "House", "Day Party", "Rooftop"];

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedVibe, setSelectedVibe] = useState("All Vibes");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          id,
          title,
          description,
          city,
          start_at,
          end_at,
          capacity,
          cover_image_url,
          theme,
          status,
          featured,
          tickets (
            price_cents,
            qty_total,
            qty_sold
          )
        `)
        .in("status", ["published", "live"])
        .gte("end_at", new Date().toISOString())
        .order("featured", { ascending: false })
        .order("start_at", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = selectedCity === "All Cities" || event.city === selectedCity;
    const matchesVibe = selectedVibe === "All Vibes" || event.theme === selectedVibe;
    
    return matchesSearch && matchesCity && matchesVibe;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getLowestPrice = (tickets: Event["tickets"]) => {
    if (!tickets || tickets.length === 0) return null;
    const prices = tickets.map(t => t.price_cents).filter(p => p > 0);
    if (prices.length === 0) return 0;
    return Math.min(...prices);
  };

  const getTotalAvailable = (tickets: Event["tickets"]) => {
    if (!tickets || tickets.length === 0) return 0;
    return tickets.reduce((sum, t) => sum + (t.qty_total - t.qty_sold), 0);
  };

  const formatPrice = (cents: number | null) => {
    if (cents === null) return "TBA";
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(0)}`;
  };

  const getEventImage = (index: number) => {
    const images = Object.values(IMAGES.events);
    return images[index % images.length];
  };

  // Check if there are any real published events
  const hasPublishedEvents = events.length > 0;

  return (
    <Layout>
      {/* Hero Section with Background */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={IMAGES.events.festival}
            alt="Events background"
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
        </div>

        <div className="container px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Discover <span className="text-primary">Events</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10">
              Find unforgettable experiences near you
            </p>

            {/* Search & Filters - Only show if we have events */}
            {hasPublishedEvents && (
              <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-base bg-secondary border-border"
                  />
                </div>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-full sm:w-44 h-12 bg-secondary border-border">
                    <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedVibe} onValueChange={setSelectedVibe}>
                  <SelectTrigger className="w-full sm:w-44 h-12 bg-secondary border-border">
                    <Sparkles className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Vibe" />
                  </SelectTrigger>
                  <SelectContent>
                    {VIBES.map((vibe) => (
                      <SelectItem key={vibe} value={vibe}>
                        {vibe}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Events Content */}
      <section className="py-16 md:py-20">
        <div className="container px-4">
          {loading ? (
            <SkeletonGrid count={6} variant="event" />
          ) : !hasPublishedEvents ? (
            // Pre-launch: Coming Soon state
            <ComingSoonEvents city="Seattle" />
          ) : filteredEvents.length === 0 ? (
            // Has events but filters don't match
            <div className="text-center py-20 max-w-md mx-auto">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-3">No events found</h3>
              <p className="text-muted-foreground mb-8">
                Try adjusting your search or filters to find more events
              </p>
              <Button variant="outline" size="lg" onClick={() => { 
                setSearchQuery(""); 
                setSelectedCity("All Cities"); 
                setSelectedVibe("All Vibes");
              }}>
                Clear All Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{filteredEvents.length}</span> event{filteredEvents.length !== 1 ? "s" : ""} found
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredEvents.map((event, index) => (
                  <Link key={event.id} to={`/events/${event.id}`} className="group block">
                    <div className="rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                      <div className="aspect-[16/10] relative overflow-hidden">
                        <ImageWithFallback
                          src={event.cover_image_url || getEventImage(index)}
                          alt={event.title}
                          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                          fallbackType="event"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
                        
                        {event.featured && (
                          <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground font-bold">
                            Featured
                          </Badge>
                        )}
                        {event.status === "live" && !event.featured && (
                          <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
                            Live Now
                          </Badge>
                        )}
                        {event.theme && (
                          <Badge variant="secondary" className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm">
                            {event.theme}
                          </Badge>
                        )}
                        
                        <div className="absolute bottom-4 left-4">
                          <div className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold">
                            {formatPrice(getLowestPrice(event.tickets))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <h3 className="font-display text-xl font-semibold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                          {event.title}
                        </h3>
                        
                        <div className="space-y-2 text-sm text-muted-foreground mb-5">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 flex-shrink-0 text-primary" />
                            <span>{formatDate(event.start_at)} • {formatTime(event.start_at)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                            <span>{event.city}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4 flex-shrink-0 text-primary" />
                            <span>{getTotalAvailable(event.tickets)} spots left</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-5 border-t border-border">
                          <div>
                            <span className="text-xs text-muted-foreground">From</span>
                            <p className="font-bold text-xl text-primary">
                              {formatPrice(getLowestPrice(event.tickets))}
                            </p>
                          </div>
                          <Button size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground">
                            Get Tickets
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-card border-t border-border">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Want to Host Your Own Event?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Turn your event idea into profit with transparent pricing and full operational support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/calculator">
                  Calculate Profit
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
