import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, Ticket } from "lucide-react";
import { TicketQRCode } from "@/components/tickets/TicketQRCode";
import { supabase } from "@/integrations/supabase/client";

interface TicketWithEvent {
  id: string;
  qr_code: string;
  status: string;
  holder_name: string | null;
  tier_name: string;
  event_title: string;
  event_start: string | null;
  event_city: string | null;
  event_id: string;
}

export default function MyTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketWithEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }

    const { data, error } = await supabase
      .from("ticket_instances")
      .select("id, qr_code, status, holder_name, tier_id, event_id, tickets(name), events(title, start_at, city)")
      .eq("holder_id", session.user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTickets(data.map((d: any) => ({
        id: d.id,
        qr_code: d.qr_code,
        status: d.status,
        holder_name: d.holder_name,
        tier_name: d.tickets?.name ?? "Ticket",
        event_title: d.events?.title ?? "Event",
        event_start: d.events?.start_at ?? null,
        event_city: d.events?.city ?? null,
        event_id: d.event_id,
      })));
    }
    setLoading(false);
  };

  const now = new Date();
  const upcoming = tickets.filter(t => !t.event_start || new Date(t.event_start) >= now);
  const past = tickets.filter(t => t.event_start && new Date(t.event_start) < now);

  const statusColor: Record<string, string> = {
    valid: "bg-green-500/10 text-green-500",
    scanned: "bg-yellow-500/10 text-yellow-500",
    transferred: "bg-blue-500/10 text-blue-500",
    refunded: "bg-red-500/10 text-red-500",
    expired: "bg-gray-500/10 text-gray-500",
    cancelled: "bg-gray-500/10 text-gray-500",
  };

  const renderTicket = (t: TicketWithEvent) => (
    <Card key={t.id} className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <TicketQRCode qrToken={t.qr_code} size={140} />
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-semibold">{t.event_title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t.tier_name}</p>
            <div className="flex flex-wrap gap-3 mt-2 justify-center sm:justify-start">
              {t.event_start && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(t.event_start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </div>
              )}
              {t.event_city && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {t.event_city}
                </div>
              )}
            </div>
            <div className="mt-3">
              <Badge className={statusColor[t.status] ?? ""} variant="secondary">
                {t.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-mono">{t.qr_code.slice(0, 8)}...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Ticket className="w-7 h-7" />
          <h1 className="text-3xl font-bold tracking-tight">My Tickets</h1>
        </div>

        {tickets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-center">
              <Ticket className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tickets yet</h3>
              <p className="text-muted-foreground mb-4">Browse events and grab your first tickets.</p>
              <Button asChild><Link to="/events">Browse Events</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList className="mb-4">
              <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="space-y-4">
              {upcoming.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No upcoming tickets</p>
              ) : upcoming.map(renderTicket)}
            </TabsContent>
            <TabsContent value="past" className="space-y-4">
              {past.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No past tickets</p>
              ) : past.map(renderTicket)}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
