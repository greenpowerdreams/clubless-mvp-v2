import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, CheckCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [profile, setProfile] = useState<{
    stripe_account_id: string | null;
    stripe_onboarding_complete: boolean;
  } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (searchParams.get("onboarding") === "complete") {
      toast({ title: "Stripe account connected!" });
      loadProfile();
    }
  }, [searchParams]);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }

    const { data } = await supabase
      .from("profiles")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", session.user.id)
      .single();

    setProfile(data);
    setLoading(false);
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("stripe-connect-onboard", {
        body: {
          return_url: `${window.location.origin}/settings/payments?onboarding=complete`,
          refresh_url: `${window.location.origin}/settings/payments`,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast({ title: "Failed to start Stripe onboarding", variant: "destructive" });
    }
    setConnecting(false);
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

  const isConnected = profile?.stripe_onboarding_complete;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Payment Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Stripe Connect
            </CardTitle>
            <CardDescription>
              Connect your Stripe account to receive payouts from ticket sales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Account Connected</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your Stripe Express account is connected. Payouts are processed automatically after events.
                </p>
                {profile?.stripe_account_id && (
                  <p className="text-xs text-muted-foreground font-mono">
                    Account: {profile.stripe_account_id}
                  </p>
                )}
                <Button variant="outline" size="sm" onClick={handleConnect}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage Stripe Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To receive payouts from ticket sales, you need to connect a Stripe account. This takes about 2 minutes and requires basic identity verification.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>- Payouts processed 3 days after event completion</li>
                  <li>- 5% platform fee on ticket revenue</li>
                  <li>- Direct deposit to your bank account</li>
                </ul>
                <Button onClick={handleConnect} disabled={connecting}>
                  {connecting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                  ) : (
                    <><CreditCard className="w-4 h-4 mr-2" /> Connect with Stripe</>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
