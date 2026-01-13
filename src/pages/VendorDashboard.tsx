import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { 
  Store, 
  Package, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Settings,
  MessageSquare,
  Star,
  MapPin
} from "lucide-react";
import { format } from "date-fns";

interface Vendor {
  id: string;
  business_name: string;
  category: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  verification_status: string;
  rating_avg: number | null;
  review_count: number | null;
  service_area: string[] | null;
}

interface VendorService {
  id: string;
  title: string;
  description: string | null;
  unit_price: number;
  pricing_model: string;
  min_qty: number | null;
  max_qty: number | null;
  lead_time_days: number | null;
  active: boolean;
}

interface Quote {
  id: string;
  event_id: string;
  vendor_service_id: string;
  status: string;
  requested_qty: number | null;
  requested_hours: number | null;
  quoted_price: number | null;
  notes: string | null;
  created_at: string;
  responded_at: string | null;
}

const VENDOR_CATEGORIES = [
  { value: "bartending", label: "Bartending" },
  { value: "security", label: "Security" },
  { value: "catering", label: "Catering" },
  { value: "av_equipment", label: "AV Equipment" },
  { value: "decor", label: "Decor" },
  { value: "photo_video", label: "Photo/Video" },
  { value: "staffing", label: "Staffing" },
  { value: "dj_equipment", label: "DJ Equipment" },
  { value: "other", label: "Other" },
];

const PRICING_MODELS = [
  { value: "hourly", label: "Hourly Rate" },
  { value: "flat", label: "Flat Rate" },
  { value: "per_head", label: "Per Person" },
  { value: "tiered", label: "Tiered Pricing" },
];

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [services, setServices] = useState<VendorService[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state for vendor registration
  const [vendorForm, setVendorForm] = useState({
    business_name: "",
    category: "",
    description: "",
    contact_email: "",
    contact_phone: "",
    website_url: "",
    service_area: "",
  });

  // Form state for service
  const [serviceForm, setServiceForm] = useState({
    title: "",
    description: "",
    unit_price: "",
    pricing_model: "flat",
    min_qty: "",
    max_qty: "",
    lead_time_days: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
        setVendorForm(prev => ({ ...prev, contact_email: session.user.email || "" }));
        fetchVendorData(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/login");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchVendorData = async (userId: string) => {
    // Check if user is a vendor
    const { data: vendorData } = await supabase
      .from("vendors")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (vendorData) {
      setVendor(vendorData);

      // Fetch services
      const { data: servicesData } = await supabase
        .from("vendor_services")
        .select("*")
        .eq("vendor_id", vendorData.id)
        .order("created_at", { ascending: false });

      if (servicesData) setServices(servicesData);

      // Fetch quotes
      const { data: quotesData } = await supabase
        .from("event_vendor_quotes")
        .select("*")
        .in("vendor_service_id", servicesData?.map(s => s.id) || [])
        .order("created_at", { ascending: false });

      if (quotesData) setQuotes(quotesData);
    }
  };

  const handleRegisterVendor = async () => {
    if (!user) return;
    
    if (!vendorForm.business_name || !vendorForm.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in the business name and category.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("vendors")
      .insert({
        user_id: user.id,
        business_name: vendorForm.business_name,
        category: vendorForm.category as any,
        description: vendorForm.description || null,
        contact_email: vendorForm.contact_email || null,
        contact_phone: vendorForm.contact_phone || null,
        website_url: vendorForm.website_url || null,
        service_area: vendorForm.service_area ? vendorForm.service_area.split(",").map(s => s.trim()) : null,
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to register as vendor. Please try again.",
        variant: "destructive",
      });
    } else {
      setVendor(data);
      setShowRegisterDialog(false);
      toast({
        title: "Success!",
        description: "Your vendor profile has been created.",
      });
    }
  };

  const handleAddService = async () => {
    if (!vendor) return;
    
    if (!serviceForm.title || !serviceForm.unit_price) {
      toast({
        title: "Missing Information",
        description: "Please fill in the service name and price.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("vendor_services")
      .insert({
        vendor_id: vendor.id,
        title: serviceForm.title,
        description: serviceForm.description || null,
        unit_price: parseFloat(serviceForm.unit_price) * 100,
        pricing_model: serviceForm.pricing_model as any,
        min_qty: serviceForm.min_qty ? parseInt(serviceForm.min_qty) : null,
        max_qty: serviceForm.max_qty ? parseInt(serviceForm.max_qty) : null,
        lead_time_days: serviceForm.lead_time_days ? parseInt(serviceForm.lead_time_days) : null,
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add service. Please try again.",
        variant: "destructive",
      });
    } else {
      setServices(prev => [data, ...prev]);
      setShowServiceDialog(false);
      setServiceForm({
        title: "",
        description: "",
        unit_price: "",
        pricing_model: "flat",
        min_qty: "",
        max_qty: "",
        lead_time_days: "",
      });
      toast({
        title: "Service Added!",
        description: "Your service is now visible to event creators.",
      });
    }
  };

  const handleQuoteResponse = async (quoteId: string, price: number) => {
    const { error } = await supabase
      .from("event_vendor_quotes")
      .update({
        quoted_price: price * 100,
        status: "quoted",
        responded_at: new Date().toISOString(),
      })
      .eq("id", quoteId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit quote. Please try again.",
        variant: "destructive",
      });
    } else {
      setQuotes(prev => prev.map(q => 
        q.id === quoteId 
          ? { ...q, quoted_price: price * 100, status: "quoted", responded_at: new Date().toISOString() }
          : q
      ));
      toast({
        title: "Quote Submitted!",
        description: "The event creator has been notified.",
      });
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      requested: "bg-yellow-500/20 text-yellow-400",
      quoted: "bg-blue-500/20 text-blue-400",
      accepted: "bg-green-500/20 text-green-400",
      rejected: "bg-red-500/20 text-red-400",
      expired: "bg-muted text-muted-foreground",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  const pendingQuotes = quotes.filter(q => q.status === "requested");
  const activeQuotes = quotes.filter(q => q.status === "quoted" || q.status === "accepted");

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  // Show registration prompt if not a vendor
  if (!vendor) {
    return (
      <Layout>
        <section className="pt-8 pb-20">
          <div className="container px-4">
            <div className="max-w-2xl mx-auto text-center">
              <Store className="w-16 h-16 text-primary mx-auto mb-6" />
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Become a <span className="text-primary">Vendor</span>
              </h1>
              <p className="text-muted-foreground mb-8">
                Join our marketplace and offer your services to event creators. 
                Get discovered, receive quote requests, and grow your business.
              </p>

              <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
                <DialogTrigger asChild>
                  <Button variant="default" size="lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Register as Vendor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Vendor Registration</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Business Name *</Label>
                      <Input 
                        value={vendorForm.business_name}
                        onChange={(e) => setVendorForm(prev => ({ ...prev, business_name: e.target.value }))}
                        placeholder="Your Business Name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select 
                        value={vendorForm.category}
                        onValueChange={(v) => setVendorForm(prev => ({ ...prev, category: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {VENDOR_CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        value={vendorForm.description}
                        onChange={(e) => setVendorForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Tell us about your services..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Contact Email</Label>
                        <Input 
                          type="email"
                          value={vendorForm.contact_email}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, contact_email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input 
                          type="tel"
                          value={vendorForm.contact_phone}
                          onChange={(e) => setVendorForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input 
                        type="url"
                        value={vendorForm.website_url}
                        onChange={(e) => setVendorForm(prev => ({ ...prev, website_url: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Service Areas (comma-separated)</Label>
                      <Input 
                        value={vendorForm.service_area}
                        onChange={(e) => setVendorForm(prev => ({ ...prev, service_area: e.target.value }))}
                        placeholder="Austin, Dallas, Houston"
                      />
                    </div>

                    <Button 
                      onClick={handleRegisterVendor} 
                      disabled={saving}
                      className="w-full"
                      variant="default"
                    >
                      {saving ? "Creating..." : "Create Vendor Profile"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="mt-12 grid sm:grid-cols-3 gap-6 text-left">
                <Card className="glass">
                  <CardContent className="pt-6">
                    <Package className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">List Your Services</h3>
                    <p className="text-sm text-muted-foreground">
                      Create service listings with your pricing models and availability.
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass">
                  <CardContent className="pt-6">
                    <MessageSquare className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Receive Quotes</h3>
                    <p className="text-sm text-muted-foreground">
                      Get quote requests from event creators and respond with custom pricing.
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass">
                  <CardContent className="pt-6">
                    <DollarSign className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">Get Paid</h3>
                    <p className="text-sm text-muted-foreground">
                      Secure payments through our platform with automatic invoicing.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="pt-8 pb-20">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Store className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-display text-2xl md:text-3xl font-bold">
                    {vendor.business_name}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Badge className="bg-primary/20 text-primary">
                      {VENDOR_CATEGORIES.find(c => c.value === vendor.category)?.label}
                    </Badge>
                    <Badge className={
                      vendor.verification_status === "verified" 
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }>
                      {vendor.verification_status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
                <DialogTrigger asChild>
                  <Button variant="default">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Service</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Service Name *</Label>
                      <Input 
                        value={serviceForm.title}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Professional Bartending"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        value={serviceForm.description}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what's included..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price *</Label>
                        <Input 
                          type="number"
                          value={serviceForm.unit_price}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, unit_price: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Pricing Model</Label>
                        <Select 
                          value={serviceForm.pricing_model}
                          onValueChange={(v) => setServiceForm(prev => ({ ...prev, pricing_model: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRICING_MODELS.map(pm => (
                              <SelectItem key={pm.value} value={pm.value}>
                                {pm.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Min Qty</Label>
                        <Input 
                          type="number"
                          value={serviceForm.min_qty}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, min_qty: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Qty</Label>
                        <Input 
                          type="number"
                          value={serviceForm.max_qty}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, max_qty: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Lead Days</Label>
                        <Input 
                          type="number"
                          value={serviceForm.lead_time_days}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, lead_time_days: e.target.value }))}
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={handleAddService} 
                      disabled={saving}
                      className="w-full"
                      variant="default"
                    >
                      {saving ? "Adding..." : "Add Service"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="glass">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{services.length}</p>
                      <p className="text-xs text-muted-foreground">Services</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{pendingQuotes.length}</p>
                      <p className="text-xs text-muted-foreground">Pending Quotes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{quotes.filter(q => q.status === "accepted").length}</p>
                      <p className="text-xs text-muted-foreground">Accepted</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                      <Star className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{vendor.rating_avg?.toFixed(1) || "—"}</p>
                      <p className="text-xs text-muted-foreground">Rating ({vendor.review_count || 0})</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="services" className="space-y-6">
              <TabsList className="glass">
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="quotes">
                  Quotes
                  {pendingQuotes.length > 0 && (
                    <Badge className="ml-2 bg-accent text-accent-foreground">
                      {pendingQuotes.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
              </TabsList>

              <TabsContent value="services" className="space-y-4">
                {services.length === 0 ? (
                  <Card className="glass text-center py-12">
                    <CardContent>
                      <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No services yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Add your first service to start receiving quote requests.
                      </p>
                      <Button variant="default" onClick={() => setShowServiceDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Service
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <Card key={service.id} className="glass">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{service.title}</CardTitle>
                              <CardDescription>
                                {formatCurrency(service.unit_price)} / {service.pricing_model}
                              </CardDescription>
                            </div>
                            <Badge className={service.active ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}>
                              {service.active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mb-4">
                              {service.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {service.min_qty && <span>Min: {service.min_qty}</span>}
                            {service.max_qty && <span>Max: {service.max_qty}</span>}
                            {service.lead_time_days && <span>Lead time: {service.lead_time_days} days</span>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="quotes" className="space-y-4">
                {quotes.length === 0 ? (
                  <Card className="glass text-center py-12">
                    <CardContent>
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No quote requests yet</h3>
                      <p className="text-muted-foreground">
                        When event creators request quotes, they'll appear here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {quotes.map((quote) => {
                      const service = services.find(s => s.id === quote.vendor_service_id);
                      return (
                        <Card key={quote.id} className="glass">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">{service?.title || "Unknown Service"}</h4>
                                  <Badge className={getStatusColor(quote.status)}>
                                    {quote.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Requested: {format(new Date(quote.created_at), "MMM d, yyyy")}
                                </p>
                                {quote.requested_qty && (
                                  <p className="text-sm">Quantity: {quote.requested_qty}</p>
                                )}
                                {quote.requested_hours && (
                                  <p className="text-sm">Hours: {quote.requested_hours}</p>
                                )}
                                {quote.notes && (
                                  <p className="text-sm text-muted-foreground mt-2">
                                    Notes: {quote.notes}
                                  </p>
                                )}
                              </div>
                              
                              {quote.status === "requested" && (
                                <div className="flex items-center gap-2">
                                  <Input 
                                    type="number" 
                                    placeholder="Your price"
                                    className="w-24"
                                    id={`quote-${quote.id}`}
                                  />
                                  <Button 
                                    size="sm"
                                    onClick={() => {
                                      const input = document.getElementById(`quote-${quote.id}`) as HTMLInputElement;
                                      if (input?.value) {
                                        handleQuoteResponse(quote.id, parseFloat(input.value));
                                      }
                                    }}
                                  >
                                    Submit
                                  </Button>
                                </div>
                              )}
                              
                              {quote.quoted_price && (
                                <div className="text-right">
                                  <p className="font-semibold">{formatCurrency(quote.quoted_price)}</p>
                                  {quote.responded_at && (
                                    <p className="text-xs text-muted-foreground">
                                      Quoted {format(new Date(quote.responded_at), "MMM d")}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="profile" className="space-y-4">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Business Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Business Name</Label>
                        <p className="font-medium">{vendor.business_name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Category</Label>
                        <p className="font-medium">
                          {VENDOR_CATEGORIES.find(c => c.value === vendor.category)?.label}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Email</Label>
                        <p className="font-medium">{vendor.contact_email || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Phone</Label>
                        <p className="font-medium">{vendor.contact_phone || "—"}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-muted-foreground">Service Areas</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {vendor.service_area?.map(area => (
                            <Badge key={area} variant="secondary">{area}</Badge>
                          )) || <span className="text-muted-foreground">—</span>}
                        </div>
                      </div>
                      {vendor.description && (
                        <div className="sm:col-span-2">
                          <Label className="text-muted-foreground">Description</Label>
                          <p className="font-medium">{vendor.description}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </Layout>
  );
}
