import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSEO } from "@/shared/hooks/useSEO";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  Search,
  Calendar,
  MapPin,
  Users,
  Star,
  ArrowRight,
  ArrowUpRight,
  Music,
  Store,
  Ticket,
  CheckCircle,
  Filter,
  Compass,
  Sparkles,
} from "lucide-react";
import { format, addDays } from "date-fns";

// ─── Landing page Supabase (curated Seattle scene) ──────────────────────────
const SB_URL =
  import.meta.env.VITE_CURATED_SUPABASE_URL ||
  "https://sdnjbzmyayapmseipcvw.supabase.co";
const SB_KEY =
  import.meta.env.VITE_CURATED_SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbmpiem15YXlhcG1zZWlwY3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzg0MjIsImV4cCI6MjA4ODkxNDQyMn0.1MOFLVoTUX3PM-rNoIW3Kt61dwgFwbSIsMwOaZRDKQU";
const HDR = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

// ─── Types ──────────────────────────────────────────────────────────────────

interface CuratedEvent {
  name: string;
  venue: string;
  neighborhood: string;
  event_date: string;
  event_time: string;
  genre: string;
  image_url: string;
  ticket_url: string;
  source_url: string;
  price: string | null;
  featured: boolean;
  popularity_score: number;
}

interface PlatformEvent {
  id: string;
  title: string;
  city: string;
  start_at: string;
  capacity: number;
  cover_image_url: string | null;
  theme: string | null;
  status: string;
  slug: string | null;
  tickets: { price_cents: number; qty_total: number; qty_sold: number }[];
}

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

interface Creator {
  id: string;
  display_name: string | null;
  stage_name: string | null;
  bio: string | null;
  city: string | null;
  creator_type: string | null;
  genres: string[] | null;
  verified: boolean | null;
  booking_open: boolean | null;
  avatar_url: string | null;
  slug: string | null;
  instagram_handle: string | null;
}

// ─── Unified event for display ──────────────────────────────────────────────

interface UnifiedEvent {
  type: "curated" | "platform";
  // Common display fields
  name: string;
  date: string; // ISO date or date string for sorting
  time: string;
  venue: string;
  location: string;
  genre: string;
  price: string;
  imageUrl: string | null;
  featured: boolean;
  // Platform-specific
  platformId?: string;
  platformSlug?: string;
  spotsLeft?: number;
  // Curated-specific
  externalUrl?: string;
  popularityScore?: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const GENRE_FILTERS = [
  "All Genres",
  "House",
  "Techno",
  "Hip-Hop",
  "R&B",
  "Latin",
  "EDM",
  "Jazz",
  "Rock",
  "Pop",
  "Indie",
  "Afrobeats",
  "Reggaeton",
  "Amapiano",
  "Drum & Bass",
  "Live Music",
];

const TIME_RANGES = [
  { label: "This Week", days: 7 },
  { label: "Next 2 Weeks", days: 14 },
  { label: "This Month", days: 30 },
  { label: "Next 3 Months", days: 90 },
];

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
  { value: "entertainment", label: "Entertainment" },
  { value: "other", label: "Other" },
];

const CATEGORY_ICONS: Record<string, string> = {
  bartending: "\uD83C\uDF78",
  security: "\uD83D\uDEE1\uFE0F",
  catering: "\uD83C\uDF7D\uFE0F",
  av_equipment: "\uD83C\uDFAC",
  decor: "\u2728",
  photo_video: "\uD83D\uDCF8",
  staffing: "\uD83D\uDC65",
  dj_equipment: "\uD83C\uDFA7",
  florist: "\uD83C\uDF38",
  photographer: "\uD83D\uDCF7",
  videographer: "\uD83C\uDFA5",
  entertainment: "\uD83C\uDFAD",
  other: "\uD83D\uDCE6",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(timeStr: string) {
  if (!timeStr) return "";
  const first = timeStr.split(" - ")[0].trim();
  const upper = first.toUpperCase();
  if (upper.includes("AM") || upper.includes("PM"))
    return first.replace(/\s+/g, " ").trim();
  const parts = first.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] ?? "0", 10);
  if (isNaN(h)) return "";
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  const mins = isNaN(m) ? 0 : m;
  return mins === 0
    ? `${hour} ${period}`
    : `${hour}:${mins.toString().padStart(2, "0")} ${period}`;
}

function formatEventDate(dateStr: string) {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    return format(new Date(year, month - 1, day), "EEE, MMM d");
  } catch {
    return dateStr;
  }
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

function getLowestPrice(
  tickets: PlatformEvent["tickets"]
): number | null {
  if (!tickets?.length) return null;
  const prices = tickets.map((t) => t.price_cents).filter((p) => p > 0);
  return prices.length === 0 ? 0 : Math.min(...prices);
}

function formatPrice(cents: number | null) {
  if (cents === null) return "TBA";
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(0)}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Discover() {
  useSEO({
    title: "Discover Seattle Events, DJs & Vendors | Clubless Collective",
    description:
      "Find every event happening in Seattle. Browse DJs, vendors, and experiences — all in one place. The Expedia for nightlife.",
    keywords:
      "seattle events, discover seattle, seattle djs, seattle nightlife, event vendors seattle, things to do seattle",
    url: "/discover",
    type: "website",
  });

  const { user } = useAuth();

  // ─── Shared state ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("events");
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Events state ──────────────────────────────────────────────
  const [curatedEvents, setCuratedEvents] = useState<CuratedEvent[]>([]);
  const [platformEvents, setPlatformEvents] = useState<PlatformEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(14);
  const [genreFilter, setGenreFilter] = useState("All Genres");
  const [clublessOnly, setClublessOnly] = useState(false);
  const [priceFilter, setPriceFilter] = useState("all");

  // ─── Vendors state ─────────────────────────────────────────────
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [vendorCategory, setVendorCategory] = useState("all");

  // ─── Creators state ────────────────────────────────────────────
  const [creators, setCreators] = useState<Creator[]>([]);
  const [creatorsLoading, setCreatorsLoading] = useState(true);
  const [creatorTypeFilter, setCreatorTypeFilter] = useState("all");

  // ─── Fetch all data on mount ───────────────────────────────────

  // Curated events
  useEffect(() => {
    const fetchCurated = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const maxDate = addDays(new Date(), timeRange)
          .toISOString()
          .split("T")[0];
        const fields =
          "name,venue,neighborhood,event_date,event_time,genre,image_url,ticket_url,source_url,price,featured,popularity_score";
        const res = await fetch(
          `${SB_URL}/rest/v1/events?event_date=gte.${today}&event_date=lte.${maxDate}&image_url=neq.&order=event_date.asc,popularity_score.desc&limit=100&select=${fields}`,
          { headers: HDR }
        );
        if (!res.ok) throw new Error("Failed to fetch");
        setCuratedEvents(await res.json());
      } catch (err) {
        console.error("Curated fetch error:", err);
      }
    };
    fetchCurated();
  }, [timeRange]);

  // Platform events
  useEffect(() => {
    const fetchPlatform = async () => {
      try {
        const { data } = await supabase
          .from("events")
          .select(
            "id, title, city, start_at, capacity, cover_image_url, theme, status, slug, tickets(price_cents, qty_total, qty_sold)"
          )
          .eq("source", "platform")
          .in("status", ["published", "live"])
          .gte("end_at", new Date().toISOString())
          .order("start_at", { ascending: true });
        setPlatformEvents(data || []);
      } catch (err) {
        console.error("Platform fetch error:", err);
      }
    };
    fetchPlatform().then(() => setEventsLoading(false));
  }, []);

  // Vendors
  useEffect(() => {
    const fetchVendors = async () => {
      const { data } = await supabase
        .from("vendors")
        .select("*")
        .eq("verification_status", "verified")
        .order("featured", { ascending: false })
        .order("rating_avg", { ascending: false, nullsFirst: false });
      if (data) setVendors(data);
      setVendorsLoading(false);
    };
    fetchVendors();
  }, []);

  // Creators/DJs
  useEffect(() => {
    const fetchCreators = async () => {
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, display_name, stage_name, bio, city, creator_type, genres, verified, booking_open, avatar_url, slug, instagram_handle"
        )
        .eq("public_profile", true)
        .not("creator_type", "is", null)
        .order("verified", { ascending: false })
        .order("display_name", { ascending: true });
      if (data) setCreators(data);
      setCreatorsLoading(false);
    };
    fetchCreators();
  }, []);

  // ─── Unified events ─────────────────────────────────────────────

  const unifiedEvents = useMemo<UnifiedEvent[]>(() => {
    const unified: UnifiedEvent[] = [];

    // Add curated events
    for (const e of curatedEvents) {
      unified.push({
        type: "curated",
        name: e.name,
        date: e.event_date,
        time: formatTime(e.event_time),
        venue: e.venue || "",
        location: e.neighborhood || "Seattle",
        genre: e.genre || "",
        price: e.price && /^\$/.test(e.price) ? e.price : e.price === "FREE" ? "Free" : e.price || "TBA",
        imageUrl:
          e.image_url && /^https?:\/\//i.test(e.image_url)
            ? e.image_url
            : null,
        featured: e.featured,
        externalUrl: e.ticket_url || e.source_url,
        popularityScore: e.popularity_score,
      });
    }

    // Add platform events
    for (const e of platformEvents) {
      const { date, time } = formatDateTime(e.start_at);
      const priceCents = getLowestPrice(e.tickets);
      const available =
        e.tickets?.reduce((s, t) => s + (t.qty_total - t.qty_sold), 0) ?? 0;

      unified.push({
        type: "platform",
        name: e.title,
        date: e.start_at.split("T")[0],
        time,
        venue: "",
        location: e.city || "Seattle",
        genre: e.theme || "",
        price: formatPrice(priceCents),
        imageUrl: e.cover_image_url,
        featured: e.status === "live",
        platformId: e.id,
        platformSlug: e.slug ?? undefined,
        spotsLeft: available,
      });
    }

    // Sort: featured first, then by date
    unified.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.date.localeCompare(b.date);
    });

    return unified;
  }, [curatedEvents, platformEvents]);

  // ─── Filtered events ────────────────────────────────────────────

  const filteredEvents = useMemo(() => {
    return unifiedEvents.filter((e) => {
      // Clubless-only toggle
      if (clublessOnly && e.type !== "platform") return false;

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchable = `${e.name} ${e.venue} ${e.location} ${e.genre}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      // Genre
      if (genreFilter !== "All Genres") {
        const g = e.genre.toLowerCase();
        if (!g.includes(genreFilter.toLowerCase())) return false;
      }

      // Price
      if (priceFilter === "free" && e.price !== "Free") return false;
      if (priceFilter === "under25") {
        const num = parseInt(e.price.replace(/[^0-9]/g, ""), 10);
        if (isNaN(num)) return true; // TBA passes
        if (num > 25) return false;
      }
      if (priceFilter === "under50") {
        const num = parseInt(e.price.replace(/[^0-9]/g, ""), 10);
        if (isNaN(num)) return true;
        if (num > 50) return false;
      }

      return true;
    });
  }, [unifiedEvents, searchQuery, genreFilter, clublessOnly, priceFilter]);

  // ─── Filtered vendors ──────────────────────────────────────────

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (vendorCategory !== "all" && v.category !== vendorCategory)
        return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !v.business_name.toLowerCase().includes(q) &&
          !v.description?.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [vendors, vendorCategory, searchQuery]);

  // ─── Filtered creators ─────────────────────────────────────────

  const filteredCreators = useMemo(() => {
    return creators.filter((c) => {
      if (
        creatorTypeFilter !== "all" &&
        c.creator_type !== creatorTypeFilter
      )
        return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = (c.stage_name || c.display_name || "").toLowerCase();
        const bio = (c.bio || "").toLowerCase();
        const genres = (c.genres || []).join(" ").toLowerCase();
        if (!name.includes(q) && !bio.includes(q) && !genres.includes(q))
          return false;
      }
      return true;
    });
  }, [creators, creatorTypeFilter, searchQuery]);

  // Unique creator types for filter
  const creatorTypes = useMemo(() => {
    const types = [...new Set(creators.map((c) => c.creator_type).filter(Boolean))] as string[];
    return types.sort();
  }, [creators]);

  // Count badges
  const eventCount = filteredEvents.length;
  const vendorCount = filteredVendors.length;
  const creatorCount = filteredCreators.length;

  return (
    <Layout>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="container px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Compass className="w-3 h-3 mr-1" />
              Seattle
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Discover <span className="text-primary">Everything</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Every event, every DJ, every vendor. One place.
            </p>

            {/* Unified search */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search events, artists, vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-base bg-card border-border rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <section className="pb-20">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <TabsList className="bg-card border border-border">
                  <TabsTrigger value="events" className="gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Events
                    <Badge
                      variant="secondary"
                      className="ml-1 text-xs h-5 px-1.5"
                    >
                      {eventCount}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="vendors" className="gap-1.5">
                    <Store className="w-4 h-4" />
                    Vendors
                    <Badge
                      variant="secondary"
                      className="ml-1 text-xs h-5 px-1.5"
                    >
                      {vendorCount}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="creators" className="gap-1.5">
                    <Music className="w-4 h-4" />
                    DJs & Artists
                    <Badge
                      variant="secondary"
                      className="ml-1 text-xs h-5 px-1.5"
                    >
                      {creatorCount}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ── Events tab ─────────────────────────────────────── */}
              <TabsContent value="events">
                {/* Filters bar */}
                <div className="p-4 rounded-xl bg-card border border-border mb-6">
                  <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                    <Select
                      value={String(timeRange)}
                      onValueChange={(v) => setTimeRange(Number(v))}
                    >
                      <SelectTrigger className="w-full md:w-[160px]">
                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_RANGES.map((r) => (
                          <SelectItem key={r.days} value={String(r.days)}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={genreFilter}
                      onValueChange={setGenreFilter}
                    >
                      <SelectTrigger className="w-full md:w-[160px]">
                        <Music className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GENRE_FILTERS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={priceFilter}
                      onValueChange={setPriceFilter}
                    >
                      <SelectTrigger className="w-full md:w-[160px]">
                        <Ticket className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Price</SelectItem>
                        <SelectItem value="free">Free Only</SelectItem>
                        <SelectItem value="under25">Under $25</SelectItem>
                        <SelectItem value="under50">Under $50</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2 ml-auto">
                      <Switch
                        checked={clublessOnly}
                        onCheckedChange={setClublessOnly}
                        id="clubless-only"
                      />
                      <label
                        htmlFor="clubless-only"
                        className="text-sm text-muted-foreground whitespace-nowrap cursor-pointer"
                      >
                        Hosted on Clubless
                      </label>
                    </div>
                  </div>
                </div>

                {/* Events grid */}
                {eventsLoading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-72 rounded-xl" />
                    ))}
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <EmptyState
                    icon={<Calendar className="w-12 h-12" />}
                    title="No events found"
                    description="Try adjusting your filters or search terms."
                  />
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEvents.map((event, idx) => (
                      <EventCard key={`${event.type}-${idx}`} event={event} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ── Vendors tab ────────────────────────────────────── */}
              <TabsContent value="vendors">
                {/* Filter bar */}
                <div className="p-4 rounded-xl bg-card border border-border mb-6">
                  <div className="flex flex-col md:flex-row gap-3">
                    <Select
                      value={vendorCategory}
                      onValueChange={setVendorCategory}
                    >
                      <SelectTrigger className="w-full md:w-[200px]">
                        <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VENDOR_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.value !== "all" && (
                              <span className="mr-2">
                                {CATEGORY_ICONS[cat.value]}
                              </span>
                            )}
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {vendorsLoading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-48 rounded-xl" />
                    ))}
                  </div>
                ) : filteredVendors.length === 0 ? (
                  <EmptyState
                    icon={<Store className="w-12 h-12" />}
                    title="No vendors found"
                    description="Try a different category or search term."
                  />
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredVendors.map((vendor) => (
                      <VendorCard key={vendor.id} vendor={vendor} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ── Creators tab ───────────────────────────────────── */}
              <TabsContent value="creators">
                {/* Filter bar */}
                <div className="p-4 rounded-xl bg-card border border-border mb-6">
                  <div className="flex flex-col md:flex-row gap-3">
                    <Select
                      value={creatorTypeFilter}
                      onValueChange={setCreatorTypeFilter}
                    >
                      <SelectTrigger className="w-full md:w-[200px]">
                        <Music className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {creatorTypes.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {creatorsLoading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-48 rounded-xl" />
                    ))}
                  </div>
                ) : filteredCreators.length === 0 ? (
                  <EmptyState
                    icon={<Music className="w-12 h-12" />}
                    title="No creators found"
                    description="Try adjusting your search."
                  />
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCreators.map((creator) => (
                      <CreatorCard key={creator.id} creator={creator} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Got Something to Offer?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Whether you're a DJ, vendor, or event creator — get in front of
              Seattle's audience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/dashboard/events/new">
                  Host an Event
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/vendor/apply">Become a Vendor</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-16 rounded-xl bg-card border border-border">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

function EventCard({ event }: { event: UnifiedEvent }) {
  const isPlatform = event.type === "platform";

  // Platform events link internally; curated link externally
  if (isPlatform && event.platformId) {
    const href = event.platformSlug
      ? `/e/${event.platformSlug}`
      : `/events/${event.platformId}`;

    return (
      <Link to={href} className="group block">
        <div className="rounded-xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 h-full flex flex-col">
          {event.imageUrl && (
            <div className="aspect-[16/10] relative overflow-hidden bg-muted">
              <img
                src={event.imageUrl}
                alt={event.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 flex gap-1.5">
                <Badge className="bg-primary text-primary-foreground text-xs">
                  <Ticket className="w-3 h-3 mr-1" />
                  Clubless
                </Badge>
                {event.featured && (
                  <Badge className="bg-destructive text-destructive-foreground text-xs">
                    Live Now
                  </Badge>
                )}
              </div>
              <div className="absolute bottom-3 right-3">
                <span className="px-2.5 py-1 rounded-lg bg-black/70 text-white text-sm font-semibold">
                  {event.price}
                </span>
              </div>
            </div>
          )}
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors mb-2">
              {event.name}
            </h3>
            <div className="space-y-1 text-sm text-muted-foreground mt-auto">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>
                  {formatEventDate(event.date)} · {event.time}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>{event.location}</span>
                </div>
              )}
              {event.spotsLeft !== undefined && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span>{event.spotsLeft} spots left</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Curated external event
  const CardWrapper = event.externalUrl ? "a" : "div";
  const cardProps = event.externalUrl
    ? {
        href: event.externalUrl,
        target: "_blank",
        rel: "noopener noreferrer",
      }
    : {};

  return (
    <CardWrapper
      {...(cardProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      className="group block"
    >
      <div className={`rounded-xl overflow-hidden bg-card border transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 h-full flex flex-col ${event.featured ? "border-primary/30 ring-1 ring-primary/20" : "border-border hover:border-primary/30"}`}>
        {event.imageUrl && (
          <div className="aspect-[16/10] relative overflow-hidden bg-muted">
            <img
              src={event.imageUrl}
              alt={event.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            {event.featured && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              </div>
            )}
            {event.price && event.price !== "TBA" && (
              <div className="absolute bottom-3 right-3">
                <span className="px-2.5 py-1 rounded-lg bg-black/70 text-white text-sm font-semibold">
                  {event.price === "Free" ? "Free" : `From ${event.price}`}
                </span>
              </div>
            )}
          </div>
        )}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {event.name}
            </h3>
            {event.externalUrl && (
              <ArrowUpRight className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
            )}
          </div>
          <div className="space-y-1 text-sm text-muted-foreground mt-2 mb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {formatEventDate(event.date)}
                {event.time && ` · ${event.time}`}
              </span>
            </div>
            {event.venue && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{event.venue}</span>
              </div>
            )}
            {event.location && !event.venue && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
          {event.genre && (
            <div className="mt-auto">
              <Badge variant="secondary" className="text-xs">
                {event.genre}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </CardWrapper>
  );
}

function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Link
      to={`/vendors/${vendor.id}`}
      className={`block rounded-xl bg-card border border-border p-5 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 group ${
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
          {CATEGORY_ICONS[vendor.category] || "\uD83D\uDCE6"}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground flex items-center gap-1.5 truncate">
            {vendor.business_name}
            {vendor.verification_status === "verified" && (
              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
            )}
          </h3>
          <p className="text-sm text-muted-foreground">
            {VENDOR_CATEGORIES.find((c) => c.value === vendor.category)
              ?.label || vendor.category}
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
              <span className="font-medium">
                {vendor.rating_avg.toFixed(1)}
              </span>
              <span className="text-muted-foreground">
                ({vendor.review_count})
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">No reviews yet</span>
          )}
        </div>
      </div>

      {vendor.service_area && vendor.service_area.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">
            {vendor.service_area.slice(0, 2).join(", ")}
            {vendor.service_area.length > 2 &&
              ` +${vendor.service_area.length - 2}`}
          </span>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-border">
        <span className="text-sm font-medium text-primary group-hover:underline inline-flex items-center gap-1">
          View Profile
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}

function CreatorCard({ creator }: { creator: Creator }) {
  const name = creator.stage_name || creator.display_name || "Unknown";
  const linkPath = creator.slug
    ? `/u/${creator.slug}`
    : `/u/${creator.id}`;

  return (
    <Link to={linkPath} className="group block">
      <div className="rounded-xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            {creator.avatar_url ? (
              <img
                src={creator.avatar_url}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="w-6 h-6 text-muted-foreground" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                {name}
              </h3>
              {creator.verified && (
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              {creator.creator_type && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {creator.creator_type}
                </Badge>
              )}
              {creator.city && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {creator.city}
                </span>
              )}
            </div>
          </div>
        </div>

        {creator.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-3">
            {creator.bio}
          </p>
        )}

        {creator.genres && creator.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {creator.genres.slice(0, 4).map((g) => (
              <Badge key={g} variant="outline" className="text-xs">
                {g}
              </Badge>
            ))}
            {creator.genres.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{creator.genres.length - 4}
              </Badge>
            )}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          {creator.booking_open ? (
            <Badge className="bg-green-500/10 text-green-500 border-0 text-xs">
              Open for Booking
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">
              Not currently booking
            </span>
          )}
          <span className="text-sm font-medium text-primary group-hover:underline inline-flex items-center gap-1">
            View
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
