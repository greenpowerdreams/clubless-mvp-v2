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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ExternalLink,
  Globe,
  Eye,
  Send,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { EmailLogsTab } from "@/components/admin/EmailLogsTab";
import { ErrorLogsTab } from "@/components/admin/ErrorLogsTab";
import { AdminEventsTab } from "@/components/admin/AdminEventsTab";
import { AdminPayoutsTab } from "@/components/admin/AdminPayoutsTab";
import { AdminVendorsTab } from "@/components/admin/AdminVendorsTab";
import { AdminRefundsTab } from "@/components/admin/AdminRefundsTab";

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
  submitter_name: string;
  submitter_email: string;
  instagram_handle: string | null;
  city: string;
  event_concept: string;
  preferred_event_date: string;
  fee_model: string;
  full_calculator_json: ProfitSummary | null;
  projected_revenue: number | null;
  projected_costs: number | null;
  projected_profit: number | null;
  status: string;
  status_notes: string | null;
  status_updated_at: string;
  created_at: string;
  approved_at: string | null;
  published_at: string | null;
  completed_at: string | null;
  eventbrite_url: string | null;
  eventbrite_status: string | null;
}

type ProposalStatus = "submitted" | "under_review" | "needs_info" | "approved" | "published" | "completed" | "rejected";

const STATUS_OPTIONS: { value: ProposalStatus; label: string; color: string }[] = [
  { value: "submitted", label: "Submitted", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "under_review", label: "Under Review", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { value: "needs_info", label: "Needs Info", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { value: "approved", label: "Approved", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "published", label: "Published", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { value: "completed", label: "Completed", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "rejected", label: "Rejected", color: "bg-red-500/20 text-red-400 border-red-500/30" },
];

type SortField = "created_at" | "preferred_event_date" | "city" | "profit";
type SortDirection = "asc" | "desc";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading, signOut } = useAdminAuth();
  
  const [activeTab, setActiveTab] = useState("proposals");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventbriteUrlInput, setEventbriteUrlInput] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Status change dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ProposalStatus | null>(null);
  const [statusNotes, setStatusNotes] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  // Sync eventbrite URL input when switching proposals
  useEffect(() => {
    setEventbriteUrlInput(selectedProposal?.eventbrite_url || "");
  }, [selectedProposal?.id]);

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
        case "preferred_event_date":
          comparison = new Date(a.preferred_event_date).getTime() - new Date(b.preferred_event_date).getTime();
          break;
        case "city":
          comparison = a.city.localeCompare(b.city);
          break;
        case "profit":
          const profitA = a.projected_profit || 0;
          const profitB = b.projected_profit || 0;
          comparison = profitA - profitB;
          break;
      }
      
      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [proposals, sortField, sortDirection, statusFilter]);

  const openStatusDialog = (status: ProposalStatus) => {
    setPendingStatus(status);
    setStatusNotes(selectedProposal?.status_notes || "");
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedProposal || !pendingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const updateData: Record<string, unknown> = {
        status: pendingStatus,
        status_notes: statusNotes.trim() || null,
      };

      // Set timestamps for specific statuses
      if (pendingStatus === "approved") {
        updateData.approved_at = new Date().toISOString();
      }
      if (pendingStatus === "published") {
        updateData.published_at = new Date().toISOString();
      }
      if (pendingStatus === "completed") {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("event_proposals")
        .update(updateData)
        .eq("id", selectedProposal.id);

      if (error) throw error;

      // Send status update email
      try {
        await supabase.functions.invoke("send-status-email", {
          body: {
            proposal_id: selectedProposal.id,
            new_status: pendingStatus,
            status_notes: statusNotes.trim() || null,
          },
        });
      } catch (emailError) {
        console.error("Failed to send status email:", emailError);
        // Don't fail the status update if email fails
      }

      // Update local state
      const updatedProposal = {
        ...selectedProposal,
        status: pendingStatus,
        status_notes: statusNotes.trim() || null,
        ...(pendingStatus === "approved" && { approved_at: new Date().toISOString() }),
        ...(pendingStatus === "published" && { published_at: new Date().toISOString() }),
        ...(pendingStatus === "completed" && { completed_at: new Date().toISOString() }),
      };

      setProposals((prev) =>
        prev.map((p) => (p.id === selectedProposal.id ? updatedProposal : p))
      );
      setSelectedProposal(updatedProposal);

      toast({
        title: "Status Updated",
        description: `Proposal status changed to "${STATUS_OPTIONS.find(s => s.value === pendingStatus)?.label}"`,
      });

      setStatusDialogOpen(false);
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update proposal status",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const markAsPublished = async () => {
    if (!selectedProposal || !eventbriteUrlInput.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter the Eventbrite URL first.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    try {
      const { error } = await supabase
        .from("event_proposals")
        .update({ 
          eventbrite_url: eventbriteUrlInput.trim(),
          eventbrite_status: 'published',
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq("id", selectedProposal.id);

      if (error) throw error;

      // Send status email for published status
      try {
        await supabase.functions.invoke("send-status-email", {
          body: {
            proposal_id: selectedProposal.id,
            new_status: "published",
            status_notes: `Your event is now live! Eventbrite link: ${eventbriteUrlInput.trim()}`,
          },
        });
      } catch (emailError) {
        console.error("Failed to send published email:", emailError);
        // Don't fail the publish if email fails
      }

      const updatedProposal = {
        ...selectedProposal,
        eventbrite_url: eventbriteUrlInput.trim(),
        eventbrite_status: 'published',
        status: 'published',
        published_at: new Date().toISOString(),
      };

      setProposals((prev) =>
        prev.map((p) => (p.id === selectedProposal.id ? updatedProposal : p))
      );
      setSelectedProposal(updatedProposal);

      toast({
        title: "Published!",
        description: "Event is now published on Eventbrite.",
      });
    } catch (error) {
      console.error("Error marking as published:", error);
      toast({
        title: "Error",
        description: "Failed to save Eventbrite URL",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
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
      "Status Notes",
      "Projected Revenue",
      "Projected Costs",
      "Projected Profit",
      "Event Concept",
      "Submitted At",
    ];

    const rows = sortedProposals.map((p) => [
      p.submitter_name,
      p.submitter_email,
      p.instagram_handle || "",
      p.city,
      p.preferred_event_date,
      p.fee_model,
      p.status,
      p.status_notes || "",
      p.projected_revenue || "",
      p.projected_costs || "",
      p.projected_profit || "",
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
    const statusConfig = STATUS_OPTIONS.find(s => s.value === status);
    if (statusConfig) {
      return <Badge className={statusConfig.color}>{statusConfig.label}</Badge>;
    }
    return <Badge className="bg-muted text-muted-foreground">Unknown</Badge>;
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "—";
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
      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Change Status to "{STATUS_OPTIONS.find(s => s.value === pendingStatus)?.label}"
            </DialogTitle>
            <DialogDescription>
              {pendingStatus === "needs_info" && "The user will be prompted to check their email for more details."}
              {pendingStatus === "approved" && "This will set the approved_at timestamp."}
              {pendingStatus === "rejected" && "This will mark the proposal as rejected."}
              {pendingStatus === "completed" && "This will mark the event as completed."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status-notes">Status Notes (optional)</Label>
              <Textarea
                id="status-notes"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder={
                  pendingStatus === "needs_info" 
                    ? "e.g., Need venue confirmation, waiting on date availability..."
                    : pendingStatus === "rejected"
                    ? "e.g., Location not currently supported..."
                    : "Add any notes about this status change..."
                }
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStatusChange} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="glass-strong border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
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
        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-7">
              <TabsTrigger value="proposals" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Proposals</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Events</span>
              </TabsTrigger>
              <TabsTrigger value="payouts" className="gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Payouts</span>
              </TabsTrigger>
              <TabsTrigger value="refunds" className="gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Refunds</span>
              </TabsTrigger>
              <TabsTrigger value="vendors" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Vendors</span>
              </TabsTrigger>
              <TabsTrigger value="emails" className="gap-2">
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Emails</span>
              </TabsTrigger>
              <TabsTrigger value="errors" className="gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Errors</span>
              </TabsTrigger>
            </TabsList>
            
            {activeTab === "proposals" && (
              <Button onClick={exportToCSV} variant="outline" disabled={sortedProposals.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>

          {/* Proposals Tab */}
          <TabsContent value="proposals" className="space-y-6">
            {/* Filters & Sort */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Submit Date</SelectItem>
                    <SelectItem value="preferred_event_date">Event Date</SelectItem>
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
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
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
                          <h3 className="font-semibold truncate">{proposal.submitter_name}</h3>
                          {getStatusBadge(proposal.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 truncate">
                          {proposal.city}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(proposal.preferred_event_date).toLocaleDateString()}
                          </span>
                          {proposal.projected_profit && (
                            <span className="flex items-center gap-1 text-primary">
                              <DollarSign className="w-3 h-3" />
                              {formatCurrency(proposal.projected_profit)}
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
                              {selectedProposal.submitter_name}
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
                      </div>

                      {/* Status Notes Display */}
                      {selectedProposal.status_notes && (
                        <div className="mb-6 p-4 bg-muted/50 rounded-xl border border-border">
                          <p className="text-sm font-medium mb-1">Status Notes:</p>
                          <p className="text-sm text-muted-foreground">{selectedProposal.status_notes}</p>
                        </div>
                      )}

                      {/* Status Actions */}
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Change Status</h3>
                        <div className="flex flex-wrap gap-2">
                          {STATUS_OPTIONS.map((status) => (
                            <Button
                              key={status.value}
                              size="sm"
                              variant={selectedProposal.status === status.value ? "default" : "outline"}
                              disabled={selectedProposal.status === status.value}
                              onClick={() => openStatusDialog(status.value)}
                              className="text-xs"
                            >
                              {status.value === "under_review" && <Eye className="w-3 h-3 mr-1" />}
                              {status.value === "needs_info" && <HelpCircle className="w-3 h-3 mr-1" />}
                              {status.value === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                              {status.value === "published" && <Send className="w-3 h-3 mr-1" />}
                              {status.value === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                              {status.value === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                              {status.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Contact & Event Info */}
                      <div className="grid sm:grid-cols-2 gap-6 mb-8">
                        <div className="bg-secondary/50 rounded-xl p-4">
                          <h3 className="text-sm font-medium text-muted-foreground mb-3">
                            Contact Information
                          </h3>
                          <div className="space-y-2">
                            <p className="font-medium">{selectedProposal.submitter_name}</p>
                            <p className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-primary" />
                              {selectedProposal.submitter_email}
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
                              {new Date(selectedProposal.preferred_event_date).toLocaleDateString(
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
                      {(selectedProposal.projected_revenue || selectedProposal.full_calculator_json) && (
                        <div className="mb-8">
                          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Profit Projection
                          </h3>
                          
                          <div className="grid sm:grid-cols-3 gap-4">
                            <div className="bg-secondary/50 rounded-xl p-4">
                              <p className="text-sm text-muted-foreground mb-1">Revenue</p>
                              <p className="text-xl font-bold">
                                {formatCurrency(selectedProposal.projected_revenue)}
                              </p>
                            </div>
                            <div className="bg-secondary/50 rounded-xl p-4">
                              <p className="text-sm text-muted-foreground mb-1">Costs</p>
                              <p className="text-xl font-bold">
                                {formatCurrency(selectedProposal.projected_costs)}
                              </p>
                            </div>
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                              <p className="text-sm text-green-400 mb-1">Take-Home</p>
                              <p className="text-xl font-bold text-green-400">
                                {formatCurrency(selectedProposal.projected_profit)}
                              </p>
                            </div>
                          </div>

                          {selectedProposal.full_calculator_json && (
                            <div className="mt-4 p-4 bg-muted/30 rounded-xl">
                              <p className="text-sm font-medium mb-2">Calculator Details</p>
                              <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                                {selectedProposal.full_calculator_json.attendance && (
                                  <p className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Attendance: {selectedProposal.full_calculator_json.attendance}
                                  </p>
                                )}
                                {selectedProposal.full_calculator_json.ticketPrice && (
                                  <p className="flex items-center gap-2">
                                    <Ticket className="w-4 h-4" />
                                    Ticket: {formatCurrency(selectedProposal.full_calculator_json.ticketPrice)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Eventbrite Section - Only for approved/published proposals */}
                      {(selectedProposal.status === "approved" || selectedProposal.status === "published") && (
                        <div className="mb-8">
                          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-primary" />
                            Eventbrite Publishing
                          </h3>
                          
                          {selectedProposal.eventbrite_status === 'published' && selectedProposal.eventbrite_url ? (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-green-400 mb-1">Published on Eventbrite</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-md">
                                    {selectedProposal.eventbrite_url}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                                  onClick={() => window.open(selectedProposal.eventbrite_url!, '_blank')}
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  Open
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                              <p className="text-sm text-muted-foreground">
                                Enter the Eventbrite URL after creating the event manually.
                              </p>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="https://eventbrite.com/e/your-event..."
                                  value={eventbriteUrlInput}
                                  onChange={(e) => setEventbriteUrlInput(e.target.value)}
                                  className="flex-1"
                                />
                                <Button
                                  onClick={markAsPublished}
                                  disabled={isPublishing || !eventbriteUrlInput.trim()}
                                >
                                  {isPublishing ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                  )}
                                  Publish
                                </Button>
                              </div>
                            </div>
                          )}
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
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <AdminEventsTab />
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts">
            <AdminPayoutsTab />
          </TabsContent>

          {/* Refunds Tab */}
          <TabsContent value="refunds">
            <AdminRefundsTab />
          </TabsContent>

          {/* Vendors Tab */}
          <TabsContent value="vendors">
            <AdminVendorsTab />
          </TabsContent>

          {/* Email Logs Tab */}
          <TabsContent value="emails">
            <EmailLogsTab />
          </TabsContent>

          {/* Error Logs Tab */}
          <TabsContent value="errors">
            <ErrorLogsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
