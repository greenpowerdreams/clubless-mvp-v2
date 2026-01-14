import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Calendar
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

    // For now, just show success - in real implementation would send email or create quote request
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
          <div className="animate-pulse text-muted-foreground">Loading vendor...</div>
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
      <section className="pt-8 pb-20">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <Link 
              to="/vendors" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Marketplace
            </Link>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Vendor Header */}
                <Card className="glass overflow-hidden">
                  {vendor.featured && (
                    <div className="bg-primary text-primary-foreground text-sm font-medium px-4 py-2 text-center">
                      ⭐ Featured Vendor
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center text-4xl shrink-0">
                        {CATEGORY_ICONS[vendor.category] || "📦"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-2xl">{vendor.business_name}</CardTitle>
                          {vendor.verification_status === "verified" && (
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-base mt-1">
                          {CATEGORY_LABELS[vendor.category] || vendor.category}
                        </CardDescription>
                        
                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                          {vendor.rating_avg ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                              <span className="font-semibold">{vendor.rating_avg.toFixed(1)}</span>
                              <span className="text-muted-foreground">({vendor.review_count} reviews)</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No reviews yet</span>
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
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {vendor.description && (
                      <p className="text-muted-foreground">{vendor.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-3">
                      {vendor.insurance_verified && (
                        <Badge variant="outline" className="gap-1">
                          <Shield className="w-3 h-3" />
                          Insured
                        </Badge>
                      )}
                      {vendor.license_verified && (
                        <Badge variant="outline" className="gap-1">
                          <FileCheck className="w-3 h-3" />
                          Licensed
                        </Badge>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
                      {vendor.contact_email && (
                        <a 
                          href={`mailto:${vendor.contact_email}`}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          {vendor.contact_email}
                        </a>
                      )}
                      {vendor.contact_phone && (
                        <a 
                          href={`tel:${vendor.contact_phone}`}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                          Website
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Services */}
                <div>
                  <h2 className="font-display text-xl font-bold mb-4">Services Offered</h2>
                  {services.length === 0 ? (
                    <Card className="glass">
                      <CardContent className="py-8 text-center text-muted-foreground">
                        No services listed yet.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {services.map((service) => (
                        <Card 
                          key={service.id} 
                          className={`glass cursor-pointer transition-all hover:border-primary/40 ${
                            formData.selectedServices.includes(service.id) 
                              ? "border-primary ring-1 ring-primary/20" 
                              : ""
                          }`}
                          onClick={() => toggleService(service.id)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base">{service.title}</CardTitle>
                              <div className="flex items-center gap-1 text-primary font-semibold shrink-0">
                                <DollarSign className="w-4 h-4" />
                                {formatCurrency(service.unit_price)}
                                <span className="text-muted-foreground text-sm font-normal">
                                  {PRICING_LABELS[service.pricing_model] || ""}
                                </span>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {service.description && (
                              <p className="text-sm text-muted-foreground">{service.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {service.lead_time_days && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {service.lead_time_days} days lead time
                                </span>
                              )}
                              {service.min_qty && (
                                <span>Min: {service.min_qty}</span>
                              )}
                              {service.max_qty && (
                                <span>Max: {service.max_qty}</span>
                              )}
                            </div>
                            {formData.selectedServices.includes(service.id) && (
                              <Badge className="mt-2">Selected for Quote</Badge>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reviews Section (Placeholder) */}
                <div>
                  <h2 className="font-display text-xl font-bold mb-4">Reviews</h2>
                  <Card className="glass">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No reviews yet.</p>
                      <p className="text-sm mt-1">Be the first to work with {vendor.business_name}!</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Quote Request Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Request a Quote
                      </CardTitle>
                      <CardDescription>
                        Get a custom quote from {vendor.business_name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Your Name *</Label>
                          <Input
                            id="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="(555) 123-4567"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="eventDate">Event Date</Label>
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
                        
                        <div className="space-y-2">
                          <Label htmlFor="message">Message *</Label>
                          <Textarea
                            id="message"
                            placeholder="Tell us about your event and what you're looking for..."
                            rows={4}
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            required
                          />
                        </div>

                        {formData.selectedServices.length > 0 && (
                          <div className="rounded-lg bg-muted/50 p-3">
                            <p className="text-sm font-medium mb-2">Selected Services:</p>
                            <div className="flex flex-wrap gap-1">
                              {formData.selectedServices.map(serviceId => {
                                const service = services.find(s => s.id === serviceId);
                                return service ? (
                                  <Badge key={serviceId} variant="secondary" className="text-xs">
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
                              Send Quote Request
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
