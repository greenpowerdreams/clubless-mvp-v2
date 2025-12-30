import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Calendar, MapPin, CheckCircle2, Instagram, Mail, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { eventSubmissionSchema, type EventSubmissionData } from "@/lib/validations";

interface FormData {
  name: string;
  email: string;
  instagram_handle: string;
  city: string;
  event_concept: string;
  preferred_date: string;
  fee_model: string;
}

interface ProfitSummary {
  attendance: number;
  ticketPrice: number;
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  yourTakeHome: number;
  feeModel: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function SubmitEvent() {
  const location = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [profitSummary, setProfitSummary] = useState<ProfitSummary | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    instagram_handle: "",
    city: "",
    event_concept: "",
    preferred_date: "",
    fee_model: "service-fee",
  });

  // Load calculator data from navigation state
  useEffect(() => {
    if (location.state?.calculatorData) {
      const data = location.state.calculatorData;
      setProfitSummary(data);
      setFormData(prev => ({
        ...prev,
        fee_model: data.feeModel || "service-fee",
      }));
    }
  }, [location.state]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const result = eventSubmissionSchema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (!newErrors[path]) {
          newErrors[path] = issue.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("submit-proposal", {
        body: {
          submitter_name: formData.name.trim(),
          submitter_email: formData.email.trim().toLowerCase(),
          instagram_handle: formData.instagram_handle?.trim() || null,
          city: formData.city.trim(),
          event_concept: formData.event_concept.trim(),
          preferred_event_date: formData.preferred_date,
          fee_model: formData.fee_model,
          full_calculator_json: profitSummary || null,
          projected_revenue: profitSummary?.totalRevenue || null,
          projected_costs: profitSummary?.totalCosts || null,
          projected_profit: profitSummary?.yourTakeHome || null,
        },
      });

      if (error) throw error;

      setIsSubmitted(true);
      setIsNewUser(data?.is_new_user ?? false);
      
      const emailNote = data?.email_sent === false 
        ? " (Note: Email delivery pending - please use the portal login if you don't receive an email)"
        : "";
      
      toast({
        title: "Proposal Submitted!",
        description: (data?.message || "We'll review your event and get back to you soon.") + emailNote,
      });
    } catch (error) {
      console.error("Error submitting proposal:", error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error 
          ? error.message 
          : "There was an error submitting your proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper to render field error
  const renderError = (field: string) => {
    if (!errors[field]) return null;
    return (
      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {errors[field]}
      </p>
    );
  };

  // Success screen
  if (isSubmitted) {
    return (
      <Layout>
        <section className="pt-12 pb-20 md:pt-20 md:pb-32">
          <div className="container px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
                Proposal <span className="text-gradient">Submitted!</span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8">
                Thank you for your interest in hosting an event with Clubless Collective.
              </p>

              {/* Email Check Prompt */}
              <div className="glass rounded-2xl p-6 mb-8 border border-primary/20">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Mail className="w-6 h-6 text-primary" />
                  <h2 className="font-display text-xl font-semibold">Check Your Email</h2>
                </div>
                <p className="text-muted-foreground">
                  {isNewUser 
                    ? "We've sent you a magic link to access your Host Portal. Click the link in your email to view your dashboard and track your proposal."
                    : "Sign in to your Host Portal to track your proposal status and manage your events."
                  }
                </p>
                <Button variant="gradient" size="lg" className="mt-4" asChild>
                  <Link to="/portal/login">Go to Host Portal</Link>
                </Button>
              </div>

              <div className="glass rounded-2xl p-8 text-left mb-8">
                <h2 className="font-display text-xl font-semibold mb-4">What Happens Next?</h2>
                <ol className="space-y-4 text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-semibold flex items-center justify-center">1</span>
                    <span><strong className="text-foreground">Review (24-48 hours):</strong> Our team will review your event concept and profit projections.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-semibold flex items-center justify-center">2</span>
                    <span><strong className="text-foreground">Discovery Call:</strong> If your event is a good fit, we'll schedule a call to discuss details.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-semibold flex items-center justify-center">3</span>
                    <span><strong className="text-foreground">Planning:</strong> We'll work together on venue selection, marketing, and logistics.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-semibold flex items-center justify-center">4</span>
                    <span><strong className="text-foreground">Launch:</strong> Your event goes live and you start making money!</span>
                  </li>
                </ol>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                We'll send updates to <strong className="text-foreground">{formData.email}</strong>
              </p>

              <Button variant="outline" size="lg" asChild>
                <Link to="/">Return to Home</Link>
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="pt-12 pb-20 md:pt-20 md:pb-32">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
                Submit Your <span className="text-gradient">Event Proposal</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Tell us about your event idea. We'll review it and get back to
                you within 48 hours with next steps.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Calculator Summary */}
              {profitSummary && (
                <div className="relative rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-primary opacity-90" />
                  <div className="relative z-10 p-6 md:p-8">
                    <h2 className="font-display text-xl font-semibold mb-4 text-primary-foreground">
                      Your Profit Projection
                    </h2>
                    <div className="grid sm:grid-cols-3 gap-4 text-primary-foreground">
                      <div>
                        <p className="text-sm opacity-70">Expected Attendance</p>
                        <p className="text-2xl font-bold">{profitSummary.attendance}</p>
                      </div>
                      <div>
                        <p className="text-sm opacity-70">Total Revenue</p>
                        <p className="text-2xl font-bold">{formatCurrency(profitSummary.totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-sm opacity-70">Your Take-Home</p>
                        <p className="text-2xl font-bold">{formatCurrency(profitSummary.yourTakeHome)}</p>
                      </div>
                    </div>
                    <p className="text-sm opacity-70 mt-4">
                      Fee Model: {profitSummary.feeModel === "profit-share" ? "Profit Share (50/50)" : "Service Fee (15%)"}
                    </p>
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="glass rounded-2xl p-8">
                <h2 className="font-display text-xl font-semibold mb-6">
                  Your Information
                </h2>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className={`bg-secondary/50 ${errors.name ? "border-destructive" : ""}`}
                    />
                    {renderError("name")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@email.com"
                      className={`bg-secondary/50 ${errors.email ? "border-destructive" : ""}`}
                    />
                    {renderError("email")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram_handle" className="flex items-center gap-2">
                      <Instagram className="w-4 h-4" />
                      Instagram Handle
                    </Label>
                    <Input
                      id="instagram_handle"
                      name="instagram_handle"
                      value={formData.instagram_handle}
                      onChange={handleChange}
                      placeholder="@yourhandle"
                      className={`bg-secondary/50 ${errors.instagram_handle ? "border-destructive" : ""}`}
                    />
                    {renderError("instagram_handle")}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      City *
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g., Los Angeles, New York"
                      className={`bg-secondary/50 ${errors.city ? "border-destructive" : ""}`}
                    />
                    {renderError("city")}
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="glass rounded-2xl p-8">
                <h2 className="font-display text-xl font-semibold mb-6">
                  Event Details
                </h2>
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="preferred_date">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Preferred Date *
                      </Label>
                      <Input
                        id="preferred_date"
                        name="preferred_date"
                        type="date"
                        value={formData.preferred_date}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className={`bg-secondary/50 ${errors.preferred_date ? "border-destructive" : ""}`}
                      />
                      {renderError("preferred_date")}
                    </div>
                    <div className="space-y-2">
                      <Label>Fee Model *</Label>
                      <Select
                        value={formData.fee_model}
                        onValueChange={(v) => handleSelectChange("fee_model", v)}
                      >
                        <SelectTrigger className={`bg-secondary/50 ${errors.fee_model ? "border-destructive" : ""}`}>
                          <SelectValue placeholder="Select fee model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="service-fee">Service Fee (15%)</SelectItem>
                          <SelectItem value="profit-share">Profit Share (50/50)</SelectItem>
                        </SelectContent>
                      </Select>
                      {renderError("fee_model")}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event_concept">
                      Event Concept Description *
                    </Label>
                    <Textarea
                      id="event_concept"
                      name="event_concept"
                      value={formData.event_concept}
                      onChange={handleChange}
                      placeholder="Tell us about your event concept, the vibe you're going for, your target audience, expected attendance, and any special requirements..."
                      className={`bg-secondary/50 min-h-[150px] ${errors.event_concept ? "border-destructive" : ""}`}
                    />
                    {renderError("event_concept")}
                    <p className="text-xs text-muted-foreground">
                      {formData.event_concept.length}/2000 characters (minimum 20)
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex flex-col items-center gap-4">
                <Button
                  type="submit"
                  variant="gradient"
                  size="xl"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto min-w-[250px]"
                >
                  {isSubmitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      Submit Proposal
                      <Send className="w-5 h-5" />
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  We'll review your proposal and respond within 48 hours.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
}
