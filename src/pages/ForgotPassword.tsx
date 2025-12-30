import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Reset link sent",
        description: "Check your email for the password reset link.",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Failed to send reset link",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Layout>
        <section className="min-h-[70vh] flex items-center justify-center py-12">
          <div className="container px-4">
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="font-display text-2xl font-bold mb-4">Check Your Email</h1>
              <p className="text-muted-foreground mb-6">
                We sent a password reset link to <strong className="text-foreground">{email}</strong>.
                Click the link in your email to reset your password.
              </p>
              <div className="space-y-3">
                <Button variant="outline" onClick={() => setEmailSent(false)} className="w-full">
                  Try another email
                </Button>
                <Button variant="ghost" asChild className="w-full">
                  <Link to="/login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to login
                  </Link>
                </Button>
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
              <h1 className="font-display text-3xl font-bold mb-2">
                Reset Your <span className="text-gradient">Password</span>
              </h1>
              <p className="text-muted-foreground">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            <div className="glass rounded-2xl p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
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

                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              <Link to="/login" className="text-primary hover:underline flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
