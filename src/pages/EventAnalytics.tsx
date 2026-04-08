import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, DollarSign, Ticket, Users, TrendingUp, Loader2 } from "lucide-react";
import { useCheckinStats } from "@/hooks/useEventCheckin";

export default function EventAnalytics() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login", { replace: true }); return; }
      const { data: event } = await supabase.from("events").select("creator_id").eq("id", eventId!).single();
      if (!event || event.creator_id !== session.user.id) { navigate("/", { replace: true }); return; }
      setAuthorized(true);
      setAuthLoading(false);
    };
    if (eventId) checkAuth();
  }, [eventId, navigate]);

  const { data: stats } = useCheckinStats(eventId);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["event-orders", eventId],
    enabled: !!eventId,
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

  // Query ticket_instances count for this event to get tickets sold
  const { data: ticketCount = 0 } = useQuery({
    queryKey: ["event-ticket-count", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("ticket_instances")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId!);
      if (error) return 0;
      return count ?? 0;
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
          <Button variant="ghost" size="sm" asChild><Link to="/creator"><ArrowLeft className="w-4 h-4" /></Link></Button>
          <h1 className="text-2xl font-bold">Event Analytics</h1>
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
              <p className="text-xs text-muted-foreground">{stats?.checked_in ?? 0} / {stats?.total_tickets ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Fees Breakdown */}
        <Card className="mb-6">
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
                  {orders.map(o => {
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
      </div>
    </Layout>
  );
}
