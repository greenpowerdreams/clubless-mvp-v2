import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Store, 
  ArrowRight, 
  CheckCircle,
  Wine,
  Shield,
  Utensils,
  Camera,
  Music,
  Sparkles,
  Users,
  Loader2
} from "lucide-react";

const VENDOR_CATEGORIES = [
  { value: "bartending", label: "Bartending", icon: Wine },
  { value: "security", label: "Security", icon: Shield },
  { value: "catering", label: "Catering", icon: Utensils },
  { value: "photo_video", label: "Photo/Video", icon: Camera },
  { value: "dj_equipment", label: "DJ Equipment", icon: Music },
  { value: "decor", label: "Decor", icon: Sparkles },
  { value: "staffing", label: "Staffing", icon: Users },
  { value: "av_equipment", label: "AV Equipment", icon: Store },
  { value: "other", label: "Other", icon: Store },
];

const SERVICE_AREAS = [
  "Seattle",
  "Los Angeles",
  "San Diego",
  "San Francisco",
  "New York",
  "Miami",
  "Austin",
  "Portland",
  "Denver",
];

export default function VendorApply() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    businessName: "",
    category: "",
    serviceArea: "",
    email: "",
    phone: "",
    website: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.businessName || !formData.category || !formData.serviceArea || !formData.email) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user if logged in
      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase.from("vendors").insert({
        business_name: formData.businessName.trim(),
        category: formData.category as any,
        service_area: [formData.serviceArea],
        contact_email: formData.email.trim().toLowerCase(),
        contact_phone: formData.phone.trim() || null,
        website_url: formData.website.trim() || null,
        description: formData.description.trim() || null,
        user_id: session?.user?.id || "00000000-0000-0000-0000-000000000000", // Placeholder if not logged in
        verification_status: "pending",
      });

      if (error) {
        // Check if it's a unique constraint violation
        if (error.code === "23505") {
          toast({
            title: "Already applied",
            description: "A vendor with this email or business name already exists",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      setSubmitted(true);
      toast({
        title: "Application submitted!",
        description: "We'll review your application and get back to you soon.",
      });
    } catch (error) {
      console.error("Error submitting vendor application:", error);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <section className="min-h-[70vh] flex items-center justify-center py-12">
          <div className="container px-4">
            <div className="max-w-md mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="font-display text-3xl font-bold mb-4">
                Application Received!
              </h1>
              <p className="text-muted-foreground mb-8">
                Thanks for applying to join the Clubless Collective vendor network. 
                We'll review your application and reach out within 3-5 business days.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate("/vendors")}>
                  Browse Vendors
                </Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Back to Home
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
      {/* Hero */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-16">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
              <Store className="w-3 h-3 mr-1" />
              Vendor Network
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-5">
              Grow Your Business
              <br />
              <span className="text-primary">With Clubless Collective</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Join our verified vendor network and connect with event creators 
              looking for professional services.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="pb-12">
        <div className="container px-4">
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { icon: CheckCircle, title: "Get Verified", desc: "Stand out with our verification badge" },
              { icon: Users, title: "Connect with Hosts", desc: "Access event creators in your area" },
              { icon: ArrowRight, title: "Grow Revenue", desc: "Receive quote requests for events" },
            ].map((item, i) => (
              <div key={i} className="p-5 rounded-xl bg-card border border-border text-center">
                <item.icon className="w-6 h-6 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="pb-20">
        <div className="container px-4">
          <div className="max-w-xl mx-auto">
            <div className="glass rounded-2xl p-8">
              <h2 className="font-display text-2xl font-bold mb-6 text-center">
                Vendor Application
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="Your business name"
                    required
                    className="bg-secondary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Service Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder="Select your category" />
                    </SelectTrigger>
                    <SelectContent>
                      {VENDOR_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className="flex items-center gap-2">
                            <cat.icon className="w-4 h-4" />
                            {cat.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceArea">Primary Service Area *</Label>
                  <Select
                    value={formData.serviceArea}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, serviceArea: value }))}
                  >
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_AREAS.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Contact Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="you@business.com"
                      required
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                      className="bg-secondary/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website or Instagram</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://... or @instagram"
                    className="bg-secondary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Tell us about your services</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your services, experience, and what makes you stand out..."
                    rows={4}
                    className="bg-secondary/50"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By submitting, you agree to our terms of service. 
                  We typically respond within 3-5 business days.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
