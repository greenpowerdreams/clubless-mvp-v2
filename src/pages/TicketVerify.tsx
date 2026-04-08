import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VerifyResult {
  status: string;
  holder_name: string | null;
  tier_name: string | null;
  event_title: string | null;
  scanned_at: string | null;
}

export default function TicketVerify() {
  const { token } = useParams<{ token: string }>();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    verifyTicket();
  }, [token]);

  const verifyTicket = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ticket_instances")
      .select("status, holder_name, scanned_at, tickets(name), events(title)")
      .eq("qr_code", token!)
      .maybeSingle();

    if (error || !data) {
      setResult({ status: "invalid", holder_name: null, tier_name: null, event_title: null, scanned_at: null });
    } else {
      setResult({
        status: data.status,
        holder_name: data.holder_name ? data.holder_name.split(" ")[0] : null,
        tier_name: (data as any).tickets?.name ?? null,
        event_title: (data as any).events?.title ?? null,
        scanned_at: data.scanned_at,
      });
    }
    setLoading(false);
  };

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string; bg: string }> = {
    valid: { icon: <CheckCircle className="w-20 h-20" />, color: "text-green-500", label: "Valid Ticket", bg: "bg-green-500/10" },
    scanned: { icon: <AlertTriangle className="w-20 h-20" />, color: "text-yellow-500", label: "Already Scanned", bg: "bg-yellow-500/10" },
    transferred: { icon: <AlertTriangle className="w-20 h-20" />, color: "text-blue-500", label: "Transferred", bg: "bg-blue-500/10" },
    refunded: { icon: <XCircle className="w-20 h-20" />, color: "text-red-500", label: "Refunded", bg: "bg-red-500/10" },
    expired: { icon: <XCircle className="w-20 h-20" />, color: "text-gray-500", label: "Expired", bg: "bg-gray-500/10" },
    cancelled: { icon: <XCircle className="w-20 h-20" />, color: "text-gray-500", label: "Cancelled", bg: "bg-gray-500/10" },
    invalid: { icon: <XCircle className="w-20 h-20" />, color: "text-red-500", label: "Invalid Ticket", bg: "bg-red-500/10" },
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  const cfg = statusConfig[result?.status ?? "invalid"] ?? statusConfig.invalid;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className={`${cfg.bg} p-6 rounded-full mb-6 ${cfg.color}`}>
              {cfg.icon}
            </div>
            <h1 className={`text-3xl font-bold ${cfg.color}`}>{cfg.label}</h1>
            {result?.event_title && (
              <p className="text-lg text-foreground mt-4">{result.event_title}</p>
            )}
            {result?.tier_name && (
              <p className="text-muted-foreground">{result.tier_name}</p>
            )}
            {result?.holder_name && (
              <p className="text-muted-foreground mt-2">Holder: {result.holder_name}</p>
            )}
            {result?.status === "scanned" && result.scanned_at && (
              <p className="text-sm text-muted-foreground mt-2">
                Scanned at {new Date(result.scanned_at).toLocaleString()}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-6 font-mono">{token?.slice(0, 12)}...</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
