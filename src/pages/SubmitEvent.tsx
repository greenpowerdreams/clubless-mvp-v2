import { useState, useEffect } from "react";
import { useLocation, Link, useNavigate, useSearchParams } from "react-router-dom";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Send, Calendar, MapPin, CheckCircle2, Instagram, AlertCircle, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { eventSubmissionSchema } from "@/lib/validations";
import { User } from "@supabase/supabase-js";
import { EVENT_TYPES, type EventTypeId } from "@/lib/eventTypes";

interface FormData {
  name: string;
  email: string;
  instagram_handle: string;
  city: string;
  event_concept: string;
  preferred_date: string;
  fee_model: string;
  event_type: EventTypeId;
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

const VALID_EVENT_TYPES: EventTypeId[] = ["nightlife", "wedding", "corporate", "birthday", "other"];

export default function SubmitEvent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [profitSummary, setProfitSummary] = useState<ProfitSummary | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const typeFromUrl = searchParams.get("type");
  const initialEventType: EventTypeId =
    typeFromUrl && VALID_EVENT_TYPES.includes(typeFromUrl as EventTypeId)
      ? (typeFromUrl as EventTypeId)
      : "nightlife";

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    instagram_handle: "",
    city: "",
    event_concept: "",
    preferred_date: "",
    fee_model: "service-fee",
    event_type: initialEventType,
  });

  // Check auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          // Pre-fill form with user data
          setFormData(prev => ({
            ...prev,
            name: session.user.user_metadata?.full_name || prev.name,
            email: session.user.email || prev.email,
          }));
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setFormData(prev => ({
          ...prev,
          name: session.user.user_metadata?.full_name || prev.name,
          email: session.user.email || prev.email,
        }));
      }
      setAuthChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    
    // Require login before submission
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
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
          event_type: formData.event_type,
          full_calculator_json: profitSummary || null,
          projected_revenue: profitSummary?.totalRevenue || null,
          projected_costs: profitSummary?.totalCosts || null,
          projected_profit: profitSummary?.yourTakeHome || null,
          user_id: user.id,
        },
      });

      if (error) throw error;

      setIsSubmitted(true);
      setProposalId(data?.proposal_id || null);
      
      toast({
        title: "Proposal Submitted!",
        description: data?.message || "We'll review your event and get back to you soon.",
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

  const handleAuthRedirect = (type: "login" | "signup") => {
    // Preserve form state and calculator data for when they return
    const preservedState = {
      calculatorData: profitSummary,
      formData: formData,
    };
    navigate(`/${type}`, { 
      state: { 
        redirectTo: "/submit",
        preservedState: { calculatorData: profitSummary },
      } 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderError = (field: string) => {
    if (!errors[field]) return null;
    return (
      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {errors[field]}
      </p>
    );
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

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
                Proposal <span className="text-primary">Submitted!</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-10">
                We'll review your proposal and be in touch within 48 hours.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="default" size="lg" asChild>
                  <Link to="/dashboard">Track your proposal →</Link>
                </Button>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setProposalId(null);
                    setProfitSummary(null);
                    setFormData({
                      name: user?.user_metadata?.full_name || "",
                      email: user?.email || "",
                      instagram_handle: "",
                      city: "",
                      event_concept: "",
                      preferred_date: "",
                      fee_model: "service-fee",
                      event_type: initialEventType,
                    });
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                >
                  Submit another event
                </button>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Auth Required Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Create an Account to Submit</DialogTitle>
            <DialogDescription className="text-center">
              Sign up or log in to submit your event and track its status in your personal dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => handleAuthRedirect("signup")}
            >
              Create Account
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleAuthRedirect("login")}
            >
              Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <section className="pt-12 pb-20 md:pt-20 md:pb-32">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
                Submit Your <span className="text-primary">Event Proposal</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Tell us about your event idea. We'll review it and get back to
                you within 48 hours with next steps.
              </p>
              
              {user && (
                <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 inline-flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-400">
                    Signed in as <strong>{user.email}</strong>
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Event Type Picker */}
              <div className="glass rounded-2xl p-8">
                <h2 className="font-display text-xl font-semibold mb-2">What kind of event?</h2>
                <p className="text-sm text-muted-foreground mb-6">Pick the type that best fits your idea.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {EVENT_TYPES.map((type) => {
                    const Icon = type.Icon;
                    const isSelected = formData.event_type === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, event_type: type.id as EventTypeId }))}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all duration-200 ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                            : "border-border bg-secondary/40 hover:border-primary/40"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? "bg-primary/20" : "bg-muted"}`}>
                          <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <span className={`text-xs font-semibold leading-tight ${isSelected ? "text-primary" : "text-foreground"}`}>
                          {type.label}
                        </span>
                        <span className="text-xs text-muted-foreground leading-tight hidden sm:block">{type.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Calculator Summary */}
              {profitSummary && formData.event_type === "nightlife" && (
                <div className="relative rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-primary opacity-90" />
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
              {profitSummary && formData.event_type !== "nightlife" && (
                <div className="relative rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-primary opacity-90" />
                  <div className="relative z-10 p-6 md:p-8">
                    <h2 className="font-display text-xl font-semibold mb-4 text-primary-foreground">
                      Budget Summary
                    </h2>
                    <div className="grid sm:grid-cols-3 gap-4 text-primary-foreground">
                      <div>
                        <p className="text-sm opacity-70">Expected Attendance</p>
                        <p className="text-2xl font-bold">{profitSummary.attendance}</p>
                      </div>
                      <div>
                        <p className="text-sm opacity-70">Estimated Costs</p>
                        <p className="text-2xl font-bold">{formatCurrency(profitSummary.totalCosts)}</p>
                      </div>
                      <div>
                        <p className="text-sm opacity-70">Net Budget</p>
                        <p className="text-2xl font-bold">{formatCurrency(profitSummary.netProfit)}</p>
                      </div>
                    </div>
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
                      disabled={!!user}
                      className={`bg-secondary/50 ${errors.name ? "border-destructive" : ""} ${user ? "opacity-70" : ""}`}
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
                      disabled={!!user}
                      className={`bg-secondary/50 ${errors.email ? "border-destructive" : ""} ${user ? "opacity-70" : ""}`}
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
                    {formData.event_type === "nightlife" && (
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
                    )}
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
                      placeholder="e.g. A nightlife event for ~200 guests on a Friday night in Capitol Hill. Looking for a DJ, bartender, and security..."
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
                  variant="default"
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
