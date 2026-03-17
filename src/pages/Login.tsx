import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Sparkles } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mode, setMode] = useState<"password" | "magic">("password");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Get redirect destination from state (e.g., from submit page)
  const redirectTo = location.state?.redirectTo || "/dashboard";
  const preservedState = location.state?.preservedState;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          if (preservedState) {
            navigate(redirectTo, { state: preservedState });
          } else {
            navigate(redirectTo);
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (preservedState) {
          navigate(redirectTo, { state: preservedState });
        } else {
          navigate(redirectTo);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectTo, preservedState]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Login failed",
            description: "Invalid email or password. Please try again.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

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

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      setMagicLinkSent(true);
      toast({
        title: "Magic link sent!",
        description: "Check your email for the login link.",
      });
    } catch (error) {
      console.error("Magic link error:", error);
      toast({
        title: "Failed to send magic link",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <Layout>
        <section className="min-h-[70vh] flex items-center justify-center py-12">
          <div className="container px-4">
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold mb-4">Check Your Email</h1>
              <p className="text-muted-foreground mb-6">
                We sent a magic link to <strong className="text-foreground">{email}</strong>.
                Click the link to sign in to your dashboard.
              </p>
              <Button variant="outline" onClick={() => setMagicLinkSent(false)}>
                Try another email
              </Button>
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
                Sign in to your dashboard
              </p>
            </div>

            <div className="glass rounded-2xl p-8">
              {/* Mode Toggle */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={mode === "password" ? "default" : "outline"}
                  className="flex-1"
                  size="sm"
                  onClick={() => setMode("password")}
                >
                  Password
                </Button>
                <Button
                  variant={mode === "magic" ? "default" : "outline"}
                  className="flex-1"
                  size="sm"
                  onClick={() => setMode("magic")}
                >
                  Magic Link
                </Button>
              </div>

              {mode === "password" ? (
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
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        to="/forgot-password"
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
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
                <form onSubmit={handleMagicLink} className="space-y-4">
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
                    {isLoading ? "Sending..." : "Send Magic Link"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    We'll email you a secure link to sign in instantly.
                  </p>
                </form>
              )}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{" "}
              <Link 
                to="/signup" 
                state={{ redirectTo, preservedState }}
                className="text-primary hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
