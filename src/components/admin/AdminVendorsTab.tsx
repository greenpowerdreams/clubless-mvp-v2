import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Store, 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Vendor {
  id: string;
  business_name: string;
  category: string;
  description: string | null;
  contact_email: string | null;
  verification_status: string;
  rating_avg: number | null;
  review_count: number | null;
  service_area: string[] | null;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "suspended", label: "Suspended" },
  { value: "archived", label: "Archived" },
];

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

export function AdminVendorsTab() {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    const { data } = await supabase
      .from("vendors")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setVendors(data);
    setLoading(false);
  };

  const updateVendorStatus = async (vendorId: string, newStatus: string) => {
    const { error } = await supabase
      .from("vendors")
      .update({ verification_status: newStatus as "pending" | "verified" | "suspended" | "archived" })
      .eq("id", vendorId);

    if (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } else {
      setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, verification_status: newStatus } : v));
      toast({ title: "Status Updated" });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400",
      verified: "bg-green-500/20 text-green-400",
      suspended: "bg-destructive/20 text-destructive",
      archived: "bg-muted text-muted-foreground",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesStatus = statusFilter === "all" || vendor.verification_status === statusFilter;
    const matchesSearch = vendor.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.contact_email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading vendors...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{vendors.length}</p>
            <p className="text-xs text-muted-foreground">Total Vendors</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-green-400">{vendors.filter(v => v.verification_status === "verified").length}</p>
            <p className="text-xs text-muted-foreground">Verified</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-yellow-400">{vendors.filter(v => v.verification_status === "pending").length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-destructive">{vendors.filter(v => v.verification_status === "suspended").length}</p>
            <p className="text-xs text-muted-foreground">Suspended</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vendors List */}
      {filteredVendors.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
          <p className="text-muted-foreground">
            Vendors will appear here when they register.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVendors.map((vendor) => (
            <Card key={vendor.id} className="glass">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{vendor.business_name}</h3>
                      <Badge className={getStatusColor(vendor.verification_status)}>
                        {vendor.verification_status}
                      </Badge>
                      <Badge variant="secondary">
                        {CATEGORY_LABELS[vendor.category] || vendor.category}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {vendor.contact_email && <span>{vendor.contact_email}</span>}
                      {vendor.rating_avg && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          {vendor.rating_avg.toFixed(1)} ({vendor.review_count})
                        </span>
                      )}
                      {vendor.service_area && vendor.service_area.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {vendor.service_area.slice(0, 3).join(", ")}
                        </span>
                      )}
                    </div>
                    {vendor.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {vendor.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {vendor.verification_status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateVendorStatus(vendor.id, "verified")}
                          className="bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateVendorStatus(vendor.id, "suspended")}
                          className="border-destructive/30 text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    
                    {vendor.verification_status === "verified" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateVendorStatus(vendor.id, "suspended")}
                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      >
                        Suspend
                      </Button>
                    )}
                    
                    {vendor.verification_status === "suspended" && (
                      <Button
                        size="sm"
                        onClick={() => updateVendorStatus(vendor.id, "verified")}
                      >
                        Reinstate
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
