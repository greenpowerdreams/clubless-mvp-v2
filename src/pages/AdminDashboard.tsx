import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Zap,
  Calendar,
  Users,
  MapPin,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Instagram,
  DollarSign,
  Loader2,
  Download,
  ArrowUpDown,
  LogOut,
  TrendingUp,
  Ticket,
  Wine,
  Building2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface ProfitSummary {
  attendance?: number;
  ticketPrice?: number;
  totalRevenue?: number;
  totalCosts?: number;
  netProfit?: number;
  yourTakeHome?: number;
  feeModel?: string;
}

interface Proposal {
  id: string;
  name: string;
  email: string;
  instagram_handle: string | null;
  city: string;
  event_concept: string;
  preferred_date: string;
  fee_model: string;
  profit_summary: ProfitSummary | null;
  status: string;
  created_at: string;
}

type SortField = "created_at" | "preferred_date" | "city" | "profit";
type SortDirection = "asc" | "desc";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading, signOut } = useAdminAuth();
  
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [authLoading, user, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchProposals();
    }
  }, [isAdmin]);

  const fetchProposals = async () => {
    try {
      const { data, error } = await supabase
        .from("event_proposals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setProposals((data || []) as unknown as Proposal[]);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      toast({
        title: "Error",
        description: "Failed to load proposals",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sorted and filtered proposals
  const sortedProposals = useMemo(() => {
    let filtered = proposals;
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = proposals.filter(p => p.status === statusFilter);
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "preferred_date":
          comparison = new Date(a.preferred_date).getTime() - new Date(b.preferred_date).getTime();
          break;
        case "city":
          comparison = a.city.localeCompare(b.city);
          break;
        case "profit":
          const profitA = a.profit_summary?.yourTakeHome || 0;
          const profitB = b.profit_summary?.yourTakeHome || 0;
          comparison = profitA - profitB;
          break;
      }
      
      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [proposals, sortField, sortDirection, statusFilter]);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("event_proposals")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      setProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      );
      
      if (selectedProposal?.id === id) {
        setSelectedProposal((prev) => (prev ? { ...prev, status } : null));
      }

      toast({
        title: `Proposal ${status}`,
        description: `The proposal has been ${status}.`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update proposal status",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Instagram",
      "City",
      "Preferred Date",
      "Fee Model",
      "Status",
      "Attendance",
      "Total Revenue",
      "Total Costs",
      "Projected Profit",
      "Event Concept",
      "Submitted At",
    ];

    const rows = sortedProposals.map((p) => [
      p.name,
      p.email,
      p.instagram_handle || "",
      p.city,
      p.preferred_date,
      p.fee_model,
      p.status,
      p.profit_summary?.attendance || "",
      p.profit_summary?.totalRevenue || "",
      p.profit_summary?.totalCosts || "",
      p.profit_summary?.yourTakeHome || "",
      `"${p.event_concept.replace(/"/g, '""')}"`,
      p.created_at,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `clubless-proposals-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast({
      title: "Export Complete",
      description: `Exported ${sortedProposals.length} proposals to CSV`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
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

  const formatFeeModel = (model: string) => {
    return model === "profit-share" ? "Profit Share (50/50)" : "Service Fee (15%)";
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-strong border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">Clubless Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">
              Event Proposals
            </h1>
            <p className="text-muted-foreground">
              Review and manage incoming event proposals.
            </p>
          </div>
          
          <Button onClick={exportToCSV} variant="outline" disabled={sortedProposals.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Submit Date</SelectItem>
                <SelectItem value="preferred_date">Event Date</SelectItem>
                <SelectItem value="city">City</SelectItem>
                <SelectItem value="profit">Projected Profit</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortDirection(d => d === "asc" ? "desc" : "asc")}
            >
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground ml-auto">
            {sortedProposals.length} proposal{sortedProposals.length !== 1 ? "s" : ""}
          </div>
        </div>

        {sortedProposals.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">
              No Proposals Found
            </h3>
            <p className="text-muted-foreground">
              {statusFilter !== "all" 
                ? `No ${statusFilter} proposals yet.`
                : "Event proposals will appear here when submitted."}
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Proposals List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-2">
                {sortedProposals.map((proposal) => (
                  <button
                    key={proposal.id}
                    onClick={() => setSelectedProposal(proposal)}
                    className={`w-full text-left glass rounded-xl p-4 transition-all hover:border-primary/40 ${
                      selectedProposal?.id === proposal.id
                        ? "border-primary ring-1 ring-primary/30"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold truncate">{proposal.name}</h3>
                      {getStatusBadge(proposal.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 truncate">
                      {proposal.city}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(proposal.preferred_date).toLocaleDateString()}
                      </span>
                      {proposal.profit_summary?.yourTakeHome && (
                        <span className="flex items-center gap-1 text-primary">
                          <DollarSign className="w-3 h-3" />
                          {formatCurrency(proposal.profit_summary.yourTakeHome)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Detail View */}
            <div className="lg:col-span-2">
              {selectedProposal ? (
                <div className="glass rounded-2xl p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="font-display text-2xl font-bold">
                          {selectedProposal.name}
                        </h2>
                        {getStatusBadge(selectedProposal.status)}
                      </div>
                      <p className="text-muted-foreground">
                        Submitted{" "}
                        {new Date(selectedProposal.created_at).toLocaleDateString()}{" "}
                        at{" "}
                        {new Date(selectedProposal.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    {selectedProposal.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                          onClick={() => updateStatus(selectedProposal.id, "rejected")}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => updateStatus(selectedProposal.id, "approved")}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Contact & Event Info */}
                  <div className="grid sm:grid-cols-2 gap-6 mb-8">
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        Contact Information
                      </h3>
                      <div className="space-y-2">
                        <p className="font-medium">{selectedProposal.name}</p>
                        <p className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-primary" />
                          {selectedProposal.email}
                        </p>
                        {selectedProposal.instagram_handle && (
                          <p className="flex items-center gap-2 text-sm">
                            <Instagram className="w-4 h-4 text-primary" />
                            {selectedProposal.instagram_handle}
                          </p>
                        )}
                        <p className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-primary" />
                          {selectedProposal.city}
                        </p>
                      </div>
                    </div>

                    <div className="bg-secondary/50 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        Event Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          {new Date(selectedProposal.preferred_date).toLocaleDateString(
                            "en-US",
                            { weekday: "long", year: "numeric", month: "long", day: "numeric" }
                          )}
                        </p>
                        <p className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          {formatFeeModel(selectedProposal.fee_model)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Full Calculator Breakdown */}
                  {selectedProposal.profit_summary && (
                    <div className="mb-8">
                      <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Full Calculator Breakdown
                      </h3>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Revenue */}
                        <div className="bg-secondary/50 rounded-xl p-4">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">Revenue</h4>
                          <div className="space-y-2">
                            {selectedProposal.profit_summary.attendance && (
                              <div className="flex justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                  <Users className="w-4 h-4" /> Attendance
                                </span>
                                <span className="font-medium">{selectedProposal.profit_summary.attendance}</span>
                              </div>
                            )}
                            {selectedProposal.profit_summary.ticketPrice && (
                              <div className="flex justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                  <Ticket className="w-4 h-4" /> Ticket Price
                                </span>
                                <span className="font-medium">{formatCurrency(selectedProposal.profit_summary.ticketPrice)}</span>
                              </div>
                            )}
                            {selectedProposal.profit_summary.totalRevenue && (
                              <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                                <span className="font-medium">Total Revenue</span>
                                <span className="font-bold text-primary">
                                  {formatCurrency(selectedProposal.profit_summary.totalRevenue)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Costs */}
                        <div className="bg-secondary/50 rounded-xl p-4">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">Costs</h4>
                          <div className="space-y-2">
                            {selectedProposal.profit_summary.totalCosts && (
                              <div className="flex justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                  <Building2 className="w-4 h-4" /> Total Costs
                                </span>
                                <span className="font-medium text-destructive">
                                  -{formatCurrency(selectedProposal.profit_summary.totalCosts)}
                                </span>
                              </div>
                            )}
                            {selectedProposal.profit_summary.netProfit && (
                              <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                                <span className="font-medium">Net Profit</span>
                                <span className="font-bold">
                                  {formatCurrency(selectedProposal.profit_summary.netProfit)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Final Take-Home */}
                      <div className="mt-4 bg-gradient-primary/10 border border-primary/20 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-muted-foreground">Organizer Take-Home</p>
                            <p className="text-xs text-muted-foreground">
                              After {selectedProposal.profit_summary.feeModel === "profit-share" ? "50/50" : "15%"} Clubless fee
                            </p>
                          </div>
                          <p className="text-3xl font-display font-bold text-gradient">
                            {formatCurrency(selectedProposal.profit_summary.yourTakeHome || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Event Concept */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Event Concept
                    </h3>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap bg-secondary/30 rounded-xl p-4">
                      {selectedProposal.event_concept}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="glass rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">
                    Select a Proposal
                  </h3>
                  <p className="text-muted-foreground">
                    Click on a proposal from the list to view details and take
                    action.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
