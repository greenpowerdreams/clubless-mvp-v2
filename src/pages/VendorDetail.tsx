import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  ArrowLeft,
  Star,
  MapPin,
  CheckCircle,
  Shield,
  FileCheck,
  Clock,
  DollarSign,
  Mail,
  Phone,
  Globe,
  Send,
  Loader2,
  Calendar,
  Check
} from "lucide-react";

interface Vendor {
  id: string;
  business_name: string;
  category: string;
  description: string | null;
  verification_status: string;
  rating_avg: number | null;
  review_count: number | null;
  service_area: string[] | null;
  featured: boolean | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  insurance_verified: boolean | null;
  license_verified: boolean | null;
}

interface VendorService {
  id: string;
  vendor_id: string;
  title: string;
  description: string | null;
  unit_price: number;
  pricing_model: string;
  min_qty: number | null;
  max_qty: number | null;
  lead_time_days: number | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  bartending: "Bartending",
  security: "Security",
  catering: "Catering",
  av_equipment: "AV Equipment",
  decor: "Decor",
  photo_video: "Photo/Video",
  staffing: "Staffing",
  dj_equipment: "DJ Equipment",
  other: "Other",
};

const CATEGORY_ICONS: Record<string, string> = {
  bartending: "🍸",
  security: "🛡️",
  catering: "🍽️",
  av_equipment: "🎬",
  decor: "✨",
  photo_video: "📸",
  staffing: "👥",
  dj_equipment: "🎧",
  other: "📦",
};

const PRICING_LABELS: Record<string, string> = {
  hourly: "/hour",
  flat: " flat",
  per_head: "/person",
  tiered: " (tiered)",
};

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [services, setServices] = useState<VendorService[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    eventDate: "",
    message: "",
    selectedServices: [] as string[],
  });

  useEffect(() => {
    if (id) fetchVendor();
  }, [id]);

  const fetchVendor = async () => {
    const { data: vendorData, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !vendorData) {
      setLoading(false);
      return;
    }

    setVendor(vendorData);

    const { data: servicesData } = await supabase
      .from("vendor_services")
      .select("*")
      .eq("vendor_id", id)
      .eq("active", true)
      .order("unit_price", { ascending: true });

    if (servicesData) setServices(servicesData);
    setLoading(false);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Quote request sent!", {
      description: `${vendor?.business_name} will get back to you soon.`
    });

    setFormData({
      name: "",
      email: "",
      phone: "",
      eventDate: "",
      message: "",
      selectedServices: [],
    });
    
    setSubmitting(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading vendor...</div>
        </div>
      </Layout>
    );
  }

  if (!vendor) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Vendor Not Found</h1>
          <p className="text-muted-foreground">This vendor doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/vendors">Browse Vendors</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="pt-24 pb-20">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto">
            {/* Back Button */}
            <Link 
              to="/vendors" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Marketplace
            </Link>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Vendor Header */}
                <div className="rounded-xl bg-card border border-border overflow-hidden">
                  {vendor.featured && (
                    <div className="bg-primary/10 text-primary text-sm font-medium px-4 py-2 text-center">
                      ⭐ Featured Vendor
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-3xl shrink-0">
                        {CATEGORY_ICONS[vendor.category] || "📦"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h1 className="font-display text-2xl font-bold">{vendor.business_name}</h1>
                          {vendor.verification_status === "verified" && (
                            <Badge variant="secondary" className="gap-1 font-normal">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">
                          {CATEGORY_LABELS[vendor.category] || vendor.category}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-3 flex-wrap text-sm">
                          {vendor.rating_avg ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-accent fill-accent" />
                              <span className="font-medium">{vendor.rating_avg.toFixed(1)}</span>
                              <span className="text-muted-foreground">({vendor.review_count} reviews)</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No reviews yet</span>
                          )}
                          
                          {vendor.service_area && vendor.service_area.length > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span>{vendor.service_area.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {vendor.description && (
                      <p className="text-muted-foreground mb-5">{vendor.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mb-5">
                      {vendor.insurance_verified && (
                        <Badge variant="outline" className="gap-1 font-normal">
                          <Shield className="w-3 h-3" />
                          Insured
                        </Badge>
                      )}
                      {vendor.license_verified && (
                        <Badge variant="outline" className="gap-1 font-normal">
                          <FileCheck className="w-3 h-3" />
                          Licensed
                        </Badge>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-4 pt-5 border-t border-border text-sm">
                      {vendor.contact_email && (
                        <a 
                          href={`mailto:${vendor.contact_email}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          {vendor.contact_email}
                        </a>
                      )}
                      {vendor.contact_phone && (
                        <a 
                          href={`tel:${vendor.contact_phone}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          {vendor.contact_phone}
                        </a>
                      )}
                      {vendor.website_url && (
                        <a 
                          href={vendor.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div>
                  <h2 className="font-display text-xl font-bold mb-4">Services</h2>
                  {services.length === 0 ? (
                    <div className="rounded-xl bg-card border border-border p-8 text-center text-muted-foreground">
                      No services listed yet.
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {services.map((service) => {
                        const isSelected = formData.selectedServices.includes(service.id);
                        return (
                          <button 
                            key={service.id}
                            type="button"
                            onClick={() => toggleService(service.id)}
                            className={`text-left rounded-xl bg-card border p-4 transition-all ${
                              isSelected 
                                ? "border-primary ring-1 ring-primary/20" 
                                : "border-border hover:border-muted-foreground/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="font-medium">{service.title}</span>
                              <div className="flex items-center gap-1 text-primary font-semibold text-sm shrink-0">
                                {formatCurrency(service.unit_price)}
                                <span className="text-muted-foreground font-normal">
                                  {PRICING_LABELS[service.pricing_model] || ""}
                                </span>
                              </div>
                            </div>
                            {service.description && (
                              <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {service.lead_time_days && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {service.lead_time_days}d lead
                                  </span>
                                )}
                              </div>
                              {isSelected && (
                                <span className="flex items-center gap-1 text-xs text-primary font-medium">
                                  <Check className="w-3 h-3" />
                                  Selected
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Reviews */}
                <div>
                  <h2 className="font-display text-xl font-bold mb-4">Reviews</h2>
                  <div className="rounded-xl bg-card border border-border p-8 text-center">
                    <Star className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No reviews yet.</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Be the first to work with {vendor.business_name}!
                    </p>
                  </div>
                </div>
              </div>

              {/* Quote Request Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <div className="rounded-xl bg-card border border-border p-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Send className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">Request a Quote</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-5">
                      Get a custom quote from {vendor.business_name}
                    </p>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-sm">Your Name *</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-sm">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-sm">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label htmlFor="eventDate" className="text-sm">Event Date</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="eventDate"
                            type="date"
                            className="pl-9"
                            value={formData.eventDate}
                            onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label htmlFor="message" className="text-sm">Message *</Label>
                        <Textarea
                          id="message"
                          placeholder="Tell us about your event..."
                          rows={3}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          required
                        />
                      </div>

                      {formData.selectedServices.length > 0 && (
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs font-medium mb-2 text-muted-foreground">Selected Services:</p>
                          <div className="flex flex-wrap gap-1">
                            {formData.selectedServices.map(serviceId => {
                              const service = services.find(s => s.id === serviceId);
                              return service ? (
                                <Badge key={serviceId} variant="secondary" className="text-xs font-normal">
                                  {service.title}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send Request
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
