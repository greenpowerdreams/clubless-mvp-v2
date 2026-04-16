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
import {
  Search,
  ScanLine,
  CheckCircle,
  XCircle,
  Users,
  ArrowLeft,
  Loader2,
  Keyboard,
  Camera,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { QRScanner } from "@/components/tickets/QRScanner";
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }
      // Allow event creator OR admin
      const { data: event } = await supabase
        .from("events")
        .select("creator_id")
        .eq("id", eventId!)
        .single();
      if (!event) {
        navigate("/", { replace: true });
        return;
      }

      // Check if user is the creator
      if (event.creator_id === session.user.id) {
        setAuthorized(true);
        setAuthLoading(false);
        return;
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleData) {
        setAuthorized(true);
        setAuthLoading(false);
        return;
      }

      navigate("/", { replace: true });
    };
    if (eventId) checkAuth();
  }, [eventId, navigate]);

  if (authLoading || !authorized) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return <CheckinDashboard eventId={eventId!} />;
}

/** Inner component — only renders after auth check passes (hooks safe) */
function CheckinDashboard({ eventId }: { eventId: string }) {
  const { toast } = useToast();
  const [scanInput, setScanInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [scanMode, setScanMode] = useState<"camera" | "manual">("camera");
  const [scanProcessing, setScanProcessing] = useState(false);
  const [scanHistory, setScanHistory] = useState<
    Array<{ name: string; status: string; time: string }>
  >([]);

  const { data: instances = [], isLoading } = useEventTicketInstances(eventId);
  const { data: stats } = useCheckinStats(eventId);
  const scanTicket = useScanTicket();
  const manualCheckin = useManualCheckin();
  useCheckinRealtime(eventId);

  const processScan = async (token: string) => {
    if (!token.trim()) return;
    setScanProcessing(true);
    try {
      const result = await scanTicket.mutateAsync({ qrToken: token.trim() });
      const entry = {
        name: result?.holder_name ?? "Guest",
        status: result?.scan_status ?? "invalid",
        time: new Date().toLocaleTimeString(),
      };
      setScanHistory((prev) => [entry, ...prev.slice(0, 19)]);

      if (result?.scan_status === "success") {
        toast({
          title: `✅ Checked in: ${result.holder_name ?? "Guest"}`,
          description: result.tier_name ?? "",
        });
      } else if (result?.scan_status === "already_scanned") {
        toast({
          title: "⚠️ Already scanned",
          description: `${result.holder_name ?? "Guest"} was already checked in`,
          variant: "destructive",
        });
      } else {
        toast({ title: "❌ Invalid ticket", variant: "destructive" });
      }
    } catch {
      toast({ title: "Scan failed", variant: "destructive" });
      setScanHistory((prev) => [
        { name: "Unknown", status: "error", time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 19),
      ]);
    }
    setScanProcessing(false);
  };

  const handleManualScan = async () => {
    await processScan(scanInput);
    setScanInput("");
  };

  const handleCameraScan = async (decodedText: string) => {
    await processScan(decodedText);
  };

  const handleManualCheckin = (instanceId: string, name: string | null) => {
    manualCheckin.mutate(instanceId, {
      onSuccess: () => {
        toast({ title: `✅ Checked in: ${name ?? "Guest"}` });
        setScanHistory((prev) => [
          { name: name ?? "Guest", status: "success", time: new Date().toLocaleTimeString() },
          ...prev.slice(0, 19),
        ]);
      },
      onError: () => toast({ title: "Check-in failed", variant: "destructive" }),
    });
  };

  const filteredInstances = searchQuery
    ? instances.filter(
        (i) =>
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
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/dashboard?tab=events`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Check-in</h1>
        </div>

        {/* Live Stats — always visible */}
        <Card className="mb-4">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="text-3xl font-bold">{checkedIn}</span>
                <span className="text-muted-foreground text-lg">/ {total}</span>
              </div>
              <Badge
                variant="secondary"
                className={`text-lg px-3 py-1 ${
                  rate >= 75
                    ? "bg-green-500/10 text-green-500"
                    : rate >= 25
                      ? "bg-yellow-500/10 text-yellow-500"
                      : ""
                }`}
              >
                {rate}%
              </Badge>
            </div>
            <Progress value={rate} className="h-3" />
          </CardContent>
        </Card>

        <Tabs defaultValue="scan">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="scan" className="flex-1">
              <ScanLine className="w-4 h-4 mr-1" />
              Scan
            </TabsTrigger>
            <TabsTrigger value="guests" className="flex-1">
              <Users className="w-4 h-4 mr-1" />
              Guest List ({total})
            </TabsTrigger>
          </TabsList>

          {/* ── Scan Tab ── */}
          <TabsContent value="scan">
            {/* Camera / Manual toggle */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={scanMode === "camera" ? "default" : "outline"}
                size="sm"
                onClick={() => setScanMode("camera")}
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-1" />
                Camera
              </Button>
              <Button
                variant={scanMode === "manual" ? "default" : "outline"}
                size="sm"
                onClick={() => setScanMode("manual")}
                className="flex-1"
              >
                <Keyboard className="w-4 h-4 mr-1" />
                Manual
              </Button>
            </div>

            {/* Camera Scanner */}
            {scanMode === "camera" && (
              <Card className="mb-4">
                <CardContent className="py-4">
                  <QRScanner onScan={handleCameraScan} paused={scanProcessing} />
                </CardContent>
              </Card>
            )}

            {/* Manual Token Input */}
            {scanMode === "manual" && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Keyboard className="w-5 h-5" /> Enter QR Token
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste or type QR token..."
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleManualScan()}
                      className="font-mono text-sm"
                      autoFocus
                    />
                    <Button
                      onClick={handleManualScan}
                      disabled={scanTicket.isPending || !scanInput.trim()}
                    >
                      {scanTicket.isPending ? "..." : "Scan"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scan History */}
            {scanHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Scans</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 max-h-[300px] overflow-y-auto">
                  {scanHistory.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                    >
                      {s.status === "success" ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                      <span className="font-medium truncate">{s.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                        {s.time}
                      </span>
                      <Badge
                        variant={s.status === "success" ? "default" : "destructive"}
                        className="text-xs flex-shrink-0"
                      >
                        {s.status === "success"
                          ? "In"
                          : s.status === "already_scanned"
                            ? "Duplicate"
                            : "Invalid"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Guest List Tab ── */}
          <TabsContent value="guests">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading...</div>
                ) : filteredInstances.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">No tickets found</div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredInstances.map((inst) => (
                      <div
                        key={inst.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30"
                      >
                        {/* Status indicator */}
                        <div className="flex-shrink-0">
                          {inst.status === "scanned" ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                          )}
                        </div>

                        {/* Name + email */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {inst.holder_name ?? inst.holder_email ?? "Guest"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {inst.tier_name}
                            {inst.holder_email && ` · ${inst.holder_email}`}
                          </p>
                        </div>

                        {/* Action */}
                        <div className="flex-shrink-0">
                          {inst.status === "valid" && (
                            <Button
                              size="sm"
                              onClick={() => handleManualCheckin(inst.id, inst.holder_name)}
                            >
                              Check in
                            </Button>
                          )}
                          {inst.status === "scanned" && (
                            <span className="text-xs text-green-500">
                              {inst.scanned_at
                                ? new Date(inst.scanned_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Done"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
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
