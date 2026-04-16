import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSEO } from "@/shared/hooks/useSEO";
import { buildEventSchema } from "@/shared/lib/eventSchema";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Loader2,
  ArrowLeft,
  Minus,
  Plus,
  Ticket,
  Share2,
  Heart,
  Mail,
} from "lucide-react";
import { EventQRCode } from "@/components/event/EventQRCode";

interface TicketRow {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  qty_total: number;
  qty_sold: number;
  qty_reserved: number;
  max_per_order: number | null;
  active: boolean;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  city: string;
  address: string | null;
  start_at: string;
  end_at: string;
  capacity: number;
  cover_image_url: string | null;
  theme: string | null;
  status: string;
  slug: string | null;
  tickets: TicketRow[];
}

interface TicketSelection {
  [ticketId: string]: number;
}

export default function EventDetail() {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Determine if we're looking up by UUID or slug
  const isUUID = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const lookupKey = isUUID ? id : slug || id; // slug param from /e/:slug or fallback

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [ticketSelection, setTicketSelection] = useState<TicketSelection>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Guest checkout state
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");

  useSEO({
    title: event ? `${event.title} | Clubless Collective` : "Event | Clubless Collective",
    description: event?.description?.slice(0, 160) || "Get tickets to this Seattle event on Clubless Collective.",
    image: event?.cover_image_url || undefined,
    type: "event",
  });

  // Inject Event JSON-LD structured data
  useEffect(() => {
    if (!event) return;
    const schema = buildEventSchema(event);
    let scriptEl = document.getElementById("event-jsonld") as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.id = "event-jsonld";
      scriptEl.type = "application/ld+json";
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(schema);
    return () => {
      const el = document.getElementById("event-jsonld");
      if (el) el.remove();
    };
  }, [event]);

  useEffect(() => {
    fetchEvent();
    checkAuth();
  }, [id, slug]);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    setUserId(session?.user?.id ?? null);
  };

  const fetchEvent = async () => {
    if (!lookupKey) return;

    try {
      let query = supabase
        .from("events")
        .select(
          `
          id,
          title,
          description,
          city,
          address,
          start_at,
          end_at,
          capacity,
          cover_image_url,
          theme,
          status,
          slug,
          tickets (
            id,
            name,
            description,
            price_cents,
            qty_total,
            qty_sold,
            qty_reserved,
            max_per_order,
            active
          )
        `
        );

      // Look up by UUID or slug
      if (isUUID) {
        query = query.eq("id", lookupKey);
      } else {
        query = query.eq("slug", lookupKey);
      }

      const { data, error } = await query.single();

      if (error) throw error;

      // Sort tickets by price
      if (data?.tickets) {
        data.tickets.sort(
          (a: TicketRow, b: TicketRow) => a.price_cents - b.price_cents
        );
      }

      setEvent(data);
    } catch (error) {
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Save state query ──────────────────────────────────────────────────────
  const { data: isSaved = false } = useQuery({
    queryKey: ["event-save", id, userId],
    queryFn: async () => {
      if (!userId || !id) return false;
      const { data } = await supabase
        .from("event_saves")
        .select("id")
        .eq("user_id", userId)
        .eq("event_id", id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!userId && !!id,
  });

  // ── Toggle save mutation ──────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (currentlySaved: boolean) => {
      if (!userId || !id) throw new Error("Not authenticated");
      if (currentlySaved) {
        await supabase
          .from("event_saves")
          .delete()
          .eq("user_id", userId)
          .eq("event_id", id);
      } else {
        await supabase
          .from("event_saves")
          .insert({ user_id: userId, event_id: id });
      }
    },
    onMutate: async (currentlySaved) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["event-save", id, userId] });
      const previous = queryClient.getQueryData(["event-save", id, userId]);
      queryClient.setQueryData(["event-save", id, userId], !currentlySaved);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(
        ["event-save", id, userId],
        context?.previous
      );
      toast({ title: "Failed to update save", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["event-save", id, userId] });
    },
  });

  const handleToggleSave = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in to save events",
        description: "Create a free account to save your favourite events.",
      });
      navigate("/login", { state: { redirectTo: `/events/${id}` } });
      return;
    }
    saveMutation.mutate(isSaved);
  };

  // ── Attendee count query ──────────────────────────────────────────────────
  const { data: attendeeCount } = useQuery({
    queryKey: ["event-attendees", event?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event!.id)
        .eq("status", "completed");
      return count ?? 0;
    },
    enabled: !!event?.id,
  });

  // ── Share handler ─────────────────────────────────────────────────────────
  const handleShare = async () => {
    const shareData = {
      title: event?.title,
      text: `Check out ${event?.title} on Clubless`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled share, that's fine
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard!" });
    }
  };

  // ── Formatting helpers ────────────────────────────────────────────────────
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getAvailable = (ticket: TicketRow) =>
    ticket.qty_total - ticket.qty_sold - ticket.qty_reserved;

  const updateQuantity = (ticketId: string, delta: number) => {
    const ticket = event?.tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    const current = ticketSelection[ticketId] || 0;
    const newQty = Math.max(0, current + delta);
    const maxAllowed = Math.min(
      getAvailable(ticket),
      ticket.max_per_order || 10
    );

    setTicketSelection((prev) => ({
      ...prev,
      [ticketId]: Math.min(newQty, maxAllowed),
    }));
  };

  const getTotalAmount = () => {
    if (!event) return 0;
    return Object.entries(ticketSelection).reduce((sum, [ticketId, qty]) => {
      const ticket = event.tickets.find((t) => t.id === ticketId);
      return sum + (ticket ? ticket.price_cents * qty : 0);
    }, 0);
  };

  const getTotalTickets = () =>
    Object.values(ticketSelection).reduce((sum, qty) => sum + qty, 0);

  const handleCheckout = async () => {
    if (getTotalTickets() === 0) {
      toast({
        title: "No tickets selected",
        description: "Please select at least one ticket",
        variant: "destructive",
      });
      return;
    }

    // If not authenticated, show guest checkout modal
    if (!isAuthenticated) {
      setShowGuestModal(true);
      return;
    }

    // Authenticated checkout
    await processCheckout();
  };

  const handleGuestCheckout = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!guestEmail || !emailRegex.test(guestEmail)) {
      toast({
        title: "Valid email required",
        description: "We'll send your tickets to this email address.",
        variant: "destructive",
      });
      return;
    }
    setShowGuestModal(false);
    await processCheckout({ email: guestEmail, name: guestName });
  };

  const processCheckout = async (guest?: { email: string; name: string }) => {
    setCheckingOut(true);
    try {
      const lineItems = Object.entries(ticketSelection)
        .filter(([_, qty]) => qty > 0)
        .map(([ticketId, qty]) => ({
          ticket_id: ticketId,
          quantity: qty,
        }));

      const body: Record<string, unknown> = {
        event_id: id,
        line_items: lineItems,
      };

      // For guest checkout, include email and name, and don't send auth header
      if (guest) {
        body.buyer_email = guest.email;
        body.buyer_name = guest.name || undefined;
      }

      const invokeOptions: { body: Record<string, unknown>; headers?: Record<string, string> } = { body };

      // For guest checkout, explicitly remove the Authorization header
      // by passing an empty headers object (supabase client auto-adds auth)
      if (guest) {
        // Use fetch directly to avoid supabase client adding auth header
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/create-ticket-checkout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseAnonKey,
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "Checkout failed");
        if (data.url) window.location.href = data.url;
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "create-ticket-checkout",
        invokeOptions,
      );

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setCheckingOut(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-4">Event not found</h2>
          <Button asChild>
            <Link to="/events">Browse Events</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Image */}
      <div className="relative h-64 md:h-96 bg-muted">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

        {/* Back Button */}
        <Button
          variant="ghost"
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm"
          onClick={() => navigate("/events")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          {event && (
            <div className="bg-background/80 backdrop-blur-sm rounded-md">
              <EventQRCode
                url={event.slug
                  ? `https://clublesscollective.com/e/${event.slug}`
                  : `https://clublesscollective.com/events/${event.id}`}
                title={event.title}
                variant="icon"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 backdrop-blur-sm"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 backdrop-blur-sm"
            onClick={handleToggleSave}
          >
            <Heart
              className={cn(
                "w-5 h-5 cursor-pointer transition-colors",
                isSaved
                  ? "fill-red-500 text-red-500"
                  : "text-muted-foreground hover:text-red-400"
              )}
            />
          </Button>
        </div>
      </div>

      <div className="container px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {event.status === "live" && (
                  <Badge className="bg-red-500">Live Now</Badge>
                )}
                {event.theme && (
                  <Badge variant="secondary">{event.theme}</Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {event.title}
              </h1>

              {/* Who's Going */}
              {attendeeCount !== undefined && attendeeCount > 0 && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4">
                  <Users className="w-4 h-4" />
                  {attendeeCount}{" "}
                  {attendeeCount === 1 ? "person" : "people"} going
                </p>
              )}

              <div className="grid sm:grid-cols-2 gap-4 text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {formatDate(event.start_at)}
                    </p>
                    <p className="text-sm">
                      {formatTime(event.start_at)} - {formatTime(event.end_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{event.city}</p>
                    {event.address && (
                      <p className="text-sm">{event.address}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold mb-4">About This Event</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {event.description ? (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {event.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    Details coming soon. Check back closer to the date.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Selection */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Select Tickets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.tickets.filter((t) => t.active).length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No tickets available
                  </p>
                ) : (
                  <>
                    {event.tickets
                      .filter((t) => t.active)
                      .map((ticket) => {
                        const available = getAvailable(ticket);
                        const selected = ticketSelection[ticket.id] || 0;

                        return (
                          <div
                            key={ticket.id}
                            className={`p-4 rounded-lg border ${
                              available === 0
                                ? "bg-muted/50 opacity-60"
                                : "bg-secondary/30"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-medium">{ticket.name}</h3>
                                {ticket.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {ticket.description}
                                  </p>
                                )}
                              </div>
                              <p className="font-semibold text-lg">
                                {formatPrice(ticket.price_cents)}
                              </p>
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <span className="text-sm text-muted-foreground">
                                {available === 0
                                  ? "Sold out"
                                  : `${available} left`}
                              </span>

                              {available > 0 && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      updateQuantity(ticket.id, -1)
                                    }
                                    disabled={selected === 0}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center font-medium">
                                    {selected}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      updateQuantity(ticket.id, 1)
                                    }
                                    disabled={
                                      selected >=
                                      Math.min(
                                        available,
                                        ticket.max_per_order || 10
                                      )
                                    }
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    <Separator />

                    {/* Total */}
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total ({getTotalTickets()} tickets)</span>
                      <span>{formatPrice(getTotalAmount())}</span>
                    </div>

                    {/* Checkout Button */}
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleCheckout}
                      disabled={getTotalTickets() === 0 || checkingOut}
                    >
                      {checkingOut ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : getTotalTickets() === 0 ? (
                        "Select Tickets"
                      ) : (
                        "Get Tickets"
                      )}
                    </Button>

                    {!isAuthenticated && getTotalTickets() > 0 && (
                      <p className="text-xs text-center text-muted-foreground">
                        No account needed — just enter your email at checkout
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Guest Checkout Modal */}
      <Dialog open={showGuestModal} onOpenChange={setShowGuestModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Quick Checkout
            </DialogTitle>
            <DialogDescription>
              Enter your email to receive your tickets. No account required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Email <span className="text-red-400">*</span>
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGuestCheckout()}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Name <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                type="text"
                placeholder="Your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGuestCheckout()}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="sm:flex-1" asChild>
              <Link to={`/login?redirect=/events/${id}`}>
                Sign in instead
              </Link>
            </Button>
            <Button className="sm:flex-1" onClick={handleGuestCheckout}>
              Continue to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
