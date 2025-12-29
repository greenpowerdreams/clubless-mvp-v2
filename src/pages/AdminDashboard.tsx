import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Calendar,
  Users,
  MapPin,
  Mail,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  Instagram,
  DollarSign,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export default function AdminDashboard() {
  const { toast } = useToast();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const { data, error } = await supabase
        .from("event_proposals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Type assertion since we know the structure matches
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-strong border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">Clubless Admin</span>
          </Link>
          <Badge variant="outline">Admin Panel</Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">
            Event Proposals
          </h1>
          <p className="text-muted-foreground">
            Review and manage incoming event proposals.
          </p>
        </div>

        {proposals.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">
              No Proposals Yet
            </h3>
            <p className="text-muted-foreground">
              Event proposals will appear here when submitted.
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Proposals List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">All Proposals</h2>
                <span className="text-sm text-muted-foreground">
                  {proposals.length} total
                </span>
              </div>

              <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                {proposals.map((proposal) => (
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
                      {proposal.profit_summary?.attendance && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {proposal.profit_summary.attendance}
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

                  {/* Profit Summary */}
                  {selectedProposal.profit_summary && (
                    <div className="mb-8">
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        Profit Projection from Calculator
                      </h3>
                      <div className="bg-gradient-primary/10 border border-primary/20 rounded-xl p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {selectedProposal.profit_summary.attendance && (
                            <div>
                              <p className="text-xs text-muted-foreground">Attendance</p>
                              <p className="font-semibold">{selectedProposal.profit_summary.attendance}</p>
                            </div>
                          )}
                          {selectedProposal.profit_summary.totalRevenue && (
                            <div>
                              <p className="text-xs text-muted-foreground">Total Revenue</p>
                              <p className="font-semibold">{formatCurrency(selectedProposal.profit_summary.totalRevenue)}</p>
                            </div>
                          )}
                          {selectedProposal.profit_summary.totalCosts && (
                            <div>
                              <p className="text-xs text-muted-foreground">Total Costs</p>
                              <p className="font-semibold">{formatCurrency(selectedProposal.profit_summary.totalCosts)}</p>
                            </div>
                          )}
                          {selectedProposal.profit_summary.yourTakeHome && (
                            <div>
                              <p className="text-xs text-muted-foreground">Their Take-Home</p>
                              <p className="font-semibold text-primary">{formatCurrency(selectedProposal.profit_summary.yourTakeHome)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Event Concept */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Event Concept
                    </h3>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
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
