import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  DollarSign,
  Ticket,
  Users,
  TrendingUp,
  Loader2,
  Download,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useCheckinStats } from "@/hooks/useEventCheckin";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────

interface Attendee {
  id: string;
  holder_name: string | null;
  holder_email: string;
  tier_name: string;
  status: string;
  scanned_at: string | null;
  purchased_at: string;
}

// ── CSV Export Helper ─────────────────────────────────────────────────

function exportAttendeeCsv(attendees: Attendee[], eventTitle: string) {
  const headers = ["Name", "Email", "Tier", "Status", "Purchased", "Checked In"];
  const rows = attendees.map((a) => [
    a.holder_name ?? "",
    a.holder_email,
    a.tier_name,
    a.status,
    format(new Date(a.purchased_at), "yyyy-MM-dd HH:mm"),
    a.scanned_at ? format(new Date(a.scanned_at), "yyyy-MM-dd HH:mm") : "",
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${eventTitle.replace(/[^a-z0-9]/gi, "_")}_attendees.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Component ────────────────────────────────────────────────────

export default function EventAnalytics() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState("Event");
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }
      const { data: event } = await supabase
        .from("events")
        .select("creator_id, title")
        .eq("id", eventId!)
        .single();
      if (!event || event.creator_id !== session.user.id) {
        navigate("/", { replace: true });
        return;
      }
      setEventTitle(event.title || "Event");
      setAuthorized(true);
      setAuthLoading(false);
    };
    if (eventId) checkAuth();
  }, [eventId, navigate]);

  const { data: stats } = useCheckinStats(eventId);

  // Orders query (existing)
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["event-orders", eventId],
    enabled: !!eventId && authorized,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, subtotal, platform_fee, stripe_fee, status, created_at")
        .eq("event_id", eventId!)
        .eq("status", "completed")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Ticket count query (existing)
  const { data: ticketCount = 0 } = useQuery({
    queryKey: ["event-ticket-count", eventId],
    enabled: !!eventId && authorized,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("ticket_instances")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId!);
      if (error) return 0;
      return count ?? 0;
    },
  });

  // ── NEW: Attendee roster query ────────────────────────────────────
  const { data: attendees = [], isLoading: attendeesLoading } = useQuery({
    queryKey: ["event-attendees", eventId],
    enabled: !!eventId && authorized,
    queryFn: async () => {
      // Fetch ticket instances with tier name via join
      const { data: instances, error: instErr } = await supabase
        .from("ticket_instances")
        .select("id, holder_name, holder_email, tier_id, status, scanned_at, created_at")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: false });
      if (instErr) throw instErr;

      // Fetch tier names
      const tierIds = [...new Set((instances ?? []).map((i) => i.tier_id))];
      let tierMap: Record<string, string> = {};
      if (tierIds.length > 0) {
        const { data: tiers } = await supabase
          .from("tickets")
          .select("id, name")
          .in("id", tierIds);
        tierMap = Object.fromEntries((tiers ?? []).map((t) => [t.id, t.name]));
      }

      return (instances ?? []).map((i) => ({
        id: i.id,
        holder_name: i.holder_name,
        holder_email: i.holder_email,
        tier_name: tierMap[i.tier_id] || "Unknown",
        status: i.status,
        scanned_at: i.scanned_at,
        purchased_at: i.created_at,
      })) as Attendee[];
    },
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const totalFees = orders.reduce((sum, o) => sum + (o.platform_fee ?? 0), 0);
  const totalStripeFees = orders.reduce((sum, o) => sum + ((o as any).stripe_fee ?? 0), 0);
  const creatorEarnings = totalRevenue - totalFees - totalStripeFees;
  const totalTicketsSold = ticketCount;

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (authLoading || !authorized || isLoading) {
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
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard?tab=events">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Event Analytics</h1>
          <span className="text-muted-foreground">— {eventTitle}</span>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold">{formatCents(totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Your Earnings</span>
              </div>
              <p className="text-2xl font-bold">{formatCents(creatorEarnings)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Ticket className="w-4 h-4" />
                <span className="text-sm">Tickets Sold</span>
              </div>
              <p className="text-2xl font-bold">{totalTicketsSold}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Check-in Rate</span>
              </div>
              <p className="text-2xl font-bold">{stats?.checkin_rate ?? 0}%</p>
              <p className="text-xs text-muted-foreground">
                {stats?.checked_in ?? 0} / {stats?.total_tickets ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Revenue | Attendees */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="attendees">
              Attendees ({attendees.length})
            </TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            {/* Platform Fees Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross Revenue</span>
                    <span className="font-medium">{formatCents(totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Fees</span>
                    <span className="font-medium text-red-500">-{formatCents(totalFees)}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-semibold">Net Earnings</span>
                    <span className="font-bold text-green-500">{formatCents(creatorEarnings)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Orders ({orders.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tickets</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Your Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => {
                        const orderEarnings = (o.total ?? 0) - (o.platform_fee ?? 0) - ((o as any).stripe_fee ?? 0);
                        return (
                          <tr key={o.id} className="border-b border-border last:border-0">
                            <td className="px-4 py-3">{new Date(o.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3">{formatCents(o.total ?? 0)}</td>
                            <td className="px-4 py-3">—</td>
                            <td className="px-4 py-3 text-green-500">{formatCents(orderEarnings)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendees Tab (NEW — E2.1 + E2.2) */}
          <TabsContent value="attendees" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Attendee Roster ({attendees.length})
                  </CardTitle>
                  {attendees.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        exportAttendeeCsv(attendees, eventTitle);
                        toast({ title: "CSV downloaded!" });
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {attendeesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : attendees.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No attendees yet</p>
                    <p className="text-sm">Attendees will appear here after ticket purchases.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Purchased</TableHead>
                          <TableHead>Checked In</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendees.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">
                              {a.holder_name || "—"}
                            </TableCell>
                            <TableCell>{a.holder_email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{a.tier_name}</Badge>
                            </TableCell>
                            <TableCell>
                              {a.status === "scanned" ? (
                                <Badge className="bg-green-500/20 text-green-400">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Checked in
                                </Badge>
                              ) : a.status === "valid" ? (
                                <Badge className="bg-blue-500/20 text-blue-400">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Valid
                                </Badge>
                              ) : (
                                <Badge variant="secondary">{a.status}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(a.purchased_at), "MMM d, h:mm a")}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {a.scanned_at
                                ? format(new Date(a.scanned_at), "MMM d, h:mm a")
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
