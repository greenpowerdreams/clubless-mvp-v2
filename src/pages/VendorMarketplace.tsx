import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  Store, 
  Search,
  Star,
  MapPin,
  CheckCircle,
  DollarSign,
  Filter
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
}

interface VendorService {
  id: string;
  vendor_id: string;
  title: string;
  description: string | null;
  unit_price: number;
  pricing_model: string;
}

const VENDOR_CATEGORIES = [
  { value: "all", label: "All Categories" },
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

export default function VendorMarketplace() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [services, setServices] = useState<VendorService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    // Fetch verified vendors
    const { data: vendorsData } = await supabase
      .from("vendors")
      .select("*")
      .eq("verification_status", "verified")
      .order("featured", { ascending: false })
      .order("rating_avg", { ascending: false, nullsFirst: false });

    if (vendorsData) {
      setVendors(vendorsData);

      // Fetch services for all vendors
      const { data: servicesData } = await supabase
        .from("vendor_services")
        .select("*")
        .in("vendor_id", vendorsData.map(v => v.id))
        .eq("active", true);

      if (servicesData) setServices(servicesData);
    }

    setLoading(false);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || vendor.category === selectedCategory;
    
    const matchesCity = selectedCity === "all" || 
      vendor.service_area?.some(area => area.toLowerCase().includes(selectedCity.toLowerCase()));

    return matchesSearch && matchesCategory && matchesCity;
  });

  // Get unique cities from all vendors
  const allCities = [...new Set(vendors.flatMap(v => v.service_area || []))].sort();

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading vendors...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="pt-8 pb-20">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                Vendor <span className="text-primary">Marketplace</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                Find trusted vendors for your events. From bartenders to photographers, 
                all verified and ready to make your event amazing.
              </p>
              <Button variant="default" asChild>
                <Link to="/vendor/dashboard">Become a Vendor</Link>
              </Button>
            </div>

            {/* Filters */}
            <div className="glass rounded-xl p-4 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search vendors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {VENDOR_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.value !== "all" && CATEGORY_ICONS[cat.value]} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {allCities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category Quick Filters */}
            <div className="flex flex-wrap gap-2 mb-8">
              {VENDOR_CATEGORIES.slice(1).map(cat => (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(selectedCategory === cat.value ? "all" : cat.value)}
                  className="gap-2"
                >
                  <span>{CATEGORY_ICONS[cat.value]}</span>
                  {cat.label}
                </Button>
              ))}
            </div>

            {/* Vendors Grid */}
            {filteredVendors.length === 0 ? (
              <Card className="glass text-center py-12">
                <CardContent>
                  <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or search terms.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVendors.map((vendor) => {
                  const vendorServices = services.filter(s => s.vendor_id === vendor.id);
                  const lowestPrice = vendorServices.length > 0 
                    ? Math.min(...vendorServices.map(s => s.unit_price))
                    : null;

                  return (
                    <Card key={vendor.id} className={`glass overflow-hidden group hover:border-primary/40 transition-colors ${vendor.featured ? "border-primary/40" : ""}`}>
                      {vendor.featured && (
                        <div className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 text-center">
                          ⭐ Featured Vendor
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl">
                              {CATEGORY_ICONS[vendor.category] || "📦"}
                            </div>
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {vendor.business_name}
                                {vendor.verification_status === "verified" && (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                )}
                              </CardTitle>
                              <CardDescription>
                                {VENDOR_CATEGORIES.find(c => c.value === vendor.category)?.label}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {vendor.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {vendor.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1">
                            {vendor.rating_avg ? (
                              <>
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-medium">{vendor.rating_avg.toFixed(1)}</span>
                                <span className="text-muted-foreground">({vendor.review_count})</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">No reviews yet</span>
                            )}
                          </div>
                          {lowestPrice && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="w-4 h-4" />
                              From {formatCurrency(lowestPrice)}
                            </div>
                          )}
                        </div>

                        {vendor.service_area && vendor.service_area.length > 0 && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">
                              {vendor.service_area.slice(0, 3).join(", ")}
                              {vendor.service_area.length > 3 && ` +${vendor.service_area.length - 3} more`}
                            </span>
                          </div>
                        )}

                        {vendorServices.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {vendorServices.slice(0, 3).map(service => (
                              <Badge key={service.id} variant="secondary" className="text-xs">
                                {service.title}
                              </Badge>
                            ))}
                            {vendorServices.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{vendorServices.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        <Button className="w-full" variant="outline">
                          View Services
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
