import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Sparkles, ArrowLeft } from "lucide-react";

export default function PortalLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "magic">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate("/portal");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/portal");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "Redirecting to your dashboard...",
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) throw error;

      setOtpSent(true);
      toast({
        title: "Code sent!",
        description: "Check your email for a 6-digit verification code.",
      });
    } catch (error) {
      console.error("OTP error:", error);
      toast({
        title: "Failed to send code",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: "email",
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "Redirecting to your dashboard...",
      });
    } catch (error) {
      console.error("OTP verify error:", error);
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Invalid code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // OTP verification step
  if (otpSent) {
    return (
      <Layout>
        <section className="min-h-[70vh] flex items-center justify-center py-12">
          <div className="container px-4">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold mb-2">Check Your Email</h1>
                <p className="text-muted-foreground">
                  We sent a 6-digit code to <strong className="text-foreground">{email}</strong>
                </p>
              </div>

              <div className="glass rounded-2xl p-8">
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      required
                      className="text-center text-2xl tracking-[0.5em] bg-secondary/50 font-mono"
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="default"
                    className="w-full"
                    disabled={isLoading || otpCode.length < 6}
                  >
                    {isLoading ? "Verifying..." : "Verify & Sign In"}
                  </Button>
                </form>

                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={handleSendOtp}
                    disabled={isLoading}
                  >
                    Resend code
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => { setOtpSent(false); setOtpCode(""); }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Try a different email
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="min-h-[70vh] flex items-center justify-center py-12">
        <div className="container px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="font-display text-3xl font-bold mb-2">
                Welcome <span className="text-primary">Back</span>
              </h1>
              <p className="text-muted-foreground">
                Sign in to your Host Portal
              </p>
            </div>

            <div className="glass rounded-2xl p-8">
              {/* Notice about primary login */}
              <div className="mb-6 p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Prefer to use your password?{" "}
                  <a href="/login" className="text-primary hover:underline">Sign in here</a>
                </p>
              </div>

              {mode === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        required
                        className="pl-10 bg-secondary/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="pl-10 bg-secondary/50"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="default"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="magic-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="magic-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        required
                        className="pl-10 bg-secondary/50"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="default"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Verification Code"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    We'll email you a 6-digit code to sign in.
                  </p>
                </form>
              )}

              {/* Mode Toggle */}
              <div className="flex gap-2 mt-6 pt-6 border-t border-border">
                <Button
                  variant={mode === "login" ? "default" : "outline"}
                  className="flex-1"
                  size="sm"
                  onClick={() => setMode("login")}
                >
                  Password
                </Button>
                <Button
                  variant={mode === "magic" ? "default" : "outline"}
                  className="flex-1"
                  size="sm"
                  onClick={() => setMode("magic")}
                >
                  Email Code
                </Button>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{" "}
              <a href="/signup" className="text-primary hover:underline">
                Create one
              </a>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
