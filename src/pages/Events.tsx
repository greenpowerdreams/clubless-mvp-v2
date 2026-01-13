import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users, Search, Loader2, Sparkles } from "lucide-react";

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
  tickets: {
    price_cents: number;
    qty_total: number;
    qty_sold: number;
  }[];
}

const CITIES = ["All Cities", "Los Angeles", "San Diego", "San Francisco", "New York", "Miami", "Austin"];

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");

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
          tickets (
            price_cents,
            qty_total,
            qty_sold
          )
        `)
        .in("status", ["published", "live"])
        .gte("end_at", new Date().toISOString())
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
    
    return matchesSearch && matchesCity;
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
    if (prices.length === 0) return 0; // Free event
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

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Discover <span className="text-gradient">Events</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Find unforgettable experiences near you
            </p>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12">
        <div className="container px-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || selectedCity !== "All Cities"
                  ? "Try adjusting your search or filters"
                  : "Check back soon for upcoming events"}
              </p>
              <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedCity("All Cities"); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <Link key={event.id} to={`/events/${event.id}`}>
                    <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow group">
                      {/* Event Image */}
                      <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                        {event.cover_image_url ? (
                          <img
                            src={event.cover_image_url}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            <Sparkles className="h-12 w-12 text-primary/40" />
                          </div>
                        )}
                        {event.status === "live" && (
                          <Badge className="absolute top-3 left-3 bg-red-500">
                            Live Now
                          </Badge>
                        )}
                        {event.theme && (
                          <Badge variant="secondary" className="absolute top-3 right-3">
                            {event.theme}
                          </Badge>
                        )}
                      </div>
                      
                      <CardContent className="p-5">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {event.title}
                        </h3>
                        
                        <div className="space-y-2 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>{formatDate(event.start_at)} • {formatTime(event.start_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span>{event.city}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 flex-shrink-0" />
                            <span>{getTotalAvailable(event.tickets)} spots left</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div>
                            <span className="text-xs text-muted-foreground">From</span>
                            <p className="font-semibold text-lg text-primary">
                              {formatPrice(getLowestPrice(event.tickets))}
                            </p>
                          </div>
                          <Button size="sm">View Event</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
