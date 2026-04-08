import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { ComingSoonVendors } from "@/components/waitlist/ComingSoonVendors";
import { supabase } from "@/integrations/supabase/client";
import { IMAGES, VENDOR_CATEGORIES_WITH_IMAGES } from "@/lib/images";
import { EVENT_TYPES } from "@/lib/eventTypes";
import {
  Store,
  Search,
  Star,
  MapPin,
  CheckCircle,
  ArrowRight,
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
  { value: "florist", label: "Florist" },
  { value: "photographer", label: "Photography" },
  { value: "videographer", label: "Videographer" },
  { value: "officiant", label: "Officiant" },
  { value: "cake_maker", label: "Cakes" },
  { value: "furniture_rental", label: "Furniture Rental" },
  { value: "lighting", label: "Lighting" },
  { value: "transportation", label: "Transportation" },
  { value: "entertainment", label: "Entertainment" },
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
  florist: "🌸",
  photographer: "📷",
  videographer: "🎥",
  officiant: "💍",
  cake_maker: "🎂",
  furniture_rental: "🛋️",
  lighting: "💡",
  transportation: "🚌",
  entertainment: "🎭",
  other: "📦",
};

export default function VendorMarketplace() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [services, setServices] = useState<VendorService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedEventType, setSelectedEventType] = useState("all");

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    const { data: vendorsData } = await supabase
      .from("vendors")
      .select("*")
      .eq("verification_status", "verified")
      .order("featured", { ascending: false })
      .order("rating_avg", { ascending: false, nullsFirst: false });

    if (vendorsData) {
      setVendors(vendorsData);

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

  // Categories allowed for the selected event type
  const allowedCategories = selectedEventType === "all"
    ? null
    : EVENT_TYPES.find((e) => e.id === selectedEventType)?.vendorCategories ?? null;

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "all" || vendor.category === selectedCategory;

    const matchesCity = selectedCity === "all" ||
      vendor.service_area?.some(area => area.toLowerCase().includes(selectedCity.toLowerCase()));

    const matchesEventType = !allowedCategories || allowedCategories.includes(vendor.category as never);

    return matchesSearch && matchesCategory && matchesCity && matchesEventType;
  });

  // Visible category tiles — scoped by event type when one is selected
  const visibleCategoryTiles = allowedCategories
    ? VENDOR_CATEGORIES_WITH_IMAGES.filter((c) => allowedCategories.includes(c.id as never))
    : VENDOR_CATEGORIES_WITH_IMAGES;

  const allCities = [...new Set(vendors.flatMap(v => v.service_area || []))].sort();
  const hasVerifiedVendors = vendors.length > 0;

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading vendors...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={IMAGES.vendors.bartending}
            alt="Vendor marketplace"
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
        </div>

        <div className="container px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Vendor <span className="text-accent">Marketplace</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Vetted vendors for every part of your night
            </p>
            <Button variant="outline" asChild>
              <Link to="/vendor/apply">Become a Vendor</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-20">
        <div className="container px-4">
          {!hasVerifiedVendors ? (
            // Pre-launch: Coming Soon state
            <ComingSoonVendors />
          ) : (
            <div className="max-w-5xl mx-auto">
              {/* Event Type Filter Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => { setSelectedEventType("all"); setSelectedCategory("all"); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedEventType === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  All Events
                </button>
                {EVENT_TYPES.map((type) => {
                  const Icon = type.Icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => { setSelectedEventType(type.id); setSelectedCategory("all"); }}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedEventType === type.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {type.label}
                    </button>
                  );
                })}
              </div>

              {/* Category Navigation */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
                {visibleCategoryTiles.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(selectedCategory === category.id ? "all" : category.id)}
                    className={`group rounded-xl overflow-hidden border transition-all duration-300 ${
                      selectedCategory === category.id 
                        ? "border-primary ring-2 ring-primary/20" 
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <ImageWithFallback
                        src={category.image}
                        alt={category.label}
                        className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                        fallbackType="vendor"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="font-semibold text-xs text-foreground truncate">
                          {category.label}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Filters */}
              <div className="p-4 rounded-xl bg-card border border-border mb-8">
                <div className="flex flex-col md:flex-row gap-3">
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
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {VENDOR_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.value !== "all" && <span className="mr-2">{CATEGORY_ICONS[cat.value]}</span>}
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="w-full md:w-[160px]">
                      <SelectValue placeholder="Location" />
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

              {/* Vendors Grid */}
              {filteredVendors.length === 0 ? (
                <div className="text-center py-16 rounded-xl bg-card border border-border">
                  <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
                  <p className="text-muted-foreground text-sm">
                    Try adjusting your filters or search terms.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVendors.map((vendor) => {
                    const vendorServices = services.filter(s => s.vendor_id === vendor.id);
                    const lowestPrice = vendorServices.length > 0 
                      ? Math.min(...vendorServices.map(s => s.unit_price))
                      : null;

                    return (
                      <Link 
                        key={vendor.id} 
                        to={`/vendors/${vendor.id}`}
                        className={`block rounded-xl bg-card border border-border p-5 hover:border-primary/30 transition-colors group ${
                          vendor.featured ? "ring-1 ring-primary/20" : ""
                        }`}
                      >
                        {vendor.featured && (
                          <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded mb-3">
                            Featured
                          </span>
                        )}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0">
                            {CATEGORY_ICONS[vendor.category] || "📦"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                              {vendor.business_name}
                              {vendor.verification_status === "verified" && (
                                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {VENDOR_CATEGORIES.find(c => c.value === vendor.category)?.label}
                            </p>
                          </div>
                        </div>

                        {vendor.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {vendor.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-sm mb-3">
                          <div className="flex items-center gap-1">
                            {vendor.rating_avg ? (
                              <>
                                <Star className="w-4 h-4 text-accent fill-accent" />
                                <span className="font-medium">{vendor.rating_avg.toFixed(1)}</span>
                                <span className="text-muted-foreground">({vendor.review_count})</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">No reviews</span>
                            )}
                          </div>
                          {lowestPrice && (
                            <span className="text-muted-foreground">
                              From {formatCurrency(lowestPrice)}
                            </span>
                          )}
                        </div>

                        {vendor.service_area && vendor.service_area.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="truncate">
                              {vendor.service_area.slice(0, 2).join(", ")}
                              {vendor.service_area.length > 2 && ` +${vendor.service_area.length - 2}`}
                            </span>
                          </div>
                        )}

                        {vendorServices.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {vendorServices.slice(0, 3).map(service => (
                              <Badge key={service.id} variant="secondary" className="text-xs font-normal">
                                {service.title}
                              </Badge>
                            ))}
                            {vendorServices.length > 3 && (
                              <Badge variant="secondary" className="text-xs font-normal">
                                +{vendorServices.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-border">
                          <span className="text-sm font-medium text-primary group-hover:underline inline-flex items-center gap-1">
                            View Profile
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
