import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Search, ScanLine, CheckCircle, XCircle, Users, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useEventTicketInstances,
  useCheckinStats,
  useScanTicket,
  useCheckinRealtime,
  useManualCheckin,
} from "@/hooks/useEventCheckin";

export default function EventCheckin() {
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

  if (authLoading || !authorized) {
    return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div></Layout>;
  }
  const { toast } = useToast();
  const [scanInput, setScanInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [scanHistory, setScanHistory] = useState<Array<{ name: string; status: string; time: string }>>([]);

  const { data: instances = [], isLoading } = useEventTicketInstances(eventId);
  const { data: stats } = useCheckinStats(eventId);
  const scanTicket = useScanTicket();
  const manualCheckin = useManualCheckin();
  useCheckinRealtime(eventId);

  const handleScan = async () => {
    const token = scanInput.trim();
    if (!token) return;
    try {
      const result = await scanTicket.mutateAsync({ qrToken: token });
      const entry = {
        name: result?.holder_name ?? "Unknown",
        status: result?.scan_status ?? "invalid",
        time: new Date().toLocaleTimeString(),
      };
      setScanHistory(prev => [entry, ...prev.slice(0, 9)]);
      if (result?.scan_status === "success") {
        toast({ title: `Checked in: ${result.holder_name ?? "Guest"}`, description: result.tier_name ?? "" });
      } else if (result?.scan_status === "already_scanned") {
        toast({ title: "Already scanned", description: `${result.holder_name ?? "Guest"} was checked in earlier`, variant: "destructive" });
      } else {
        toast({ title: "Invalid ticket", variant: "destructive" });
      }
    } catch {
      toast({ title: "Scan failed", variant: "destructive" });
    }
    setScanInput("");
  };

  const handleManualCheckin = (instanceId: string, name: string | null) => {
    manualCheckin.mutate(instanceId, {
      onSuccess: () => toast({ title: `Checked in: ${name ?? "Guest"}` }),
      onError: () => toast({ title: "Check-in failed", variant: "destructive" }),
    });
  };

  const filteredInstances = searchQuery
    ? instances.filter(i =>
        (i.holder_name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.holder_email ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.qr_code.includes(searchQuery)
      )
    : instances;

  const checkedIn = stats?.checked_in ?? 0;
  const total = stats?.total_tickets ?? 0;
  const rate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" asChild><Link to="/creator"><ArrowLeft className="w-4 h-4" /></Link></Button>
          <h1 className="text-2xl font-bold">Event Check-in</h1>
        </div>

        {/* Stats Header */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{checkedIn}</span>
                <span className="text-muted-foreground">/ {total} checked in</span>
              </div>
              <Badge variant="secondary" className="text-lg">{rate}%</Badge>
            </div>
            <Progress value={rate} className="h-3" />
          </CardContent>
        </Card>

        <Tabs defaultValue="scan">
          <TabsList className="mb-4">
            <TabsTrigger value="scan">Quick Scan</TabsTrigger>
            <TabsTrigger value="guests">Guest List ({instances.length})</TabsTrigger>
          </TabsList>

          {/* Quick Scan Tab */}
          <TabsContent value="scan">
            <Card className="mb-4">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ScanLine className="w-5 h-5" /> Scan QR Code</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste or type QR token..."
                    value={scanInput}
                    onChange={e => setScanInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleScan()}
                    className="font-mono"
                  />
                  <Button onClick={handleScan} disabled={scanTicket.isPending}>
                    {scanTicket.isPending ? "Scanning..." : "Scan"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {scanHistory.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Recent Scans</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {scanHistory.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      {s.status === "success" ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-medium">{s.name}</span>
                      <span className="text-sm text-muted-foreground ml-auto">{s.time}</span>
                      <Badge variant={s.status === "success" ? "default" : "destructive"} className="text-xs">
                        {s.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Guest List Tab */}
          <TabsContent value="guests">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or token..."
                className="pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tier</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                      ) : filteredInstances.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No tickets found</td></tr>
                      ) : filteredInstances.map(inst => (
                        <tr key={inst.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{inst.holder_name ?? "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{inst.holder_email ?? "—"}</td>
                          <td className="px-4 py-3">{inst.tier_name}</td>
                          <td className="px-4 py-3">
                            <Badge variant={inst.status === "scanned" ? "default" : "secondary"} className="text-xs capitalize">
                              {inst.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {inst.status === "valid" && (
                              <Button size="sm" variant="outline" onClick={() => handleManualCheckin(inst.id, inst.holder_name)}>
                                Check in
                              </Button>
                            )}
                            {inst.status === "scanned" && (
                              <span className="text-xs text-muted-foreground">
                                {inst.scanned_at ? new Date(inst.scanned_at).toLocaleTimeString() : "Done"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
