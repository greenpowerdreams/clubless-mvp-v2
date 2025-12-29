import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Clock, CheckCircle, XCircle, ExternalLink } from "lucide-react";

interface ProposalStatus {
  id: string;
  status: string;
  eventbrite_status: string | null;
  eventbrite_url: string | null;
  city: string;
  preferred_date: string;
  created_at: string;
}

export default function ProposalStatus() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [proposals, setProposals] = useState<ProposalStatus[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase.rpc("get_proposal_status", {
        lookup_email: email.trim(),
      });

      if (error) throw error;

      setProposals(data || []);
      if (!data || data.length === 0) {
        toast.info("No proposals found for this email");
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
      toast.error("Failed to fetch proposal status");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return "Pending Review";
    }
  };

  return (
    <Layout>
      <section className="min-h-screen py-20 pt-32">
        <div className="container px-4 max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Check Proposal <span className="text-gradient-brand">Status</span>
            </h1>
            <p className="text-muted-foreground">
              Enter the email you used when submitting your event proposal to check its status.
            </p>
          </div>

          <form onSubmit={handleSearch} className="glass rounded-xl p-6 mb-8">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button type="submit" variant="gradient" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  "Searching..."
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Check Status
                  </>
                )}
              </Button>
            </div>
          </form>

          {searched && proposals.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Your Proposals</h2>
              {proposals.map((proposal) => (
                <div key={proposal.id} className="glass rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold">{proposal.city}</p>
                      <p className="text-sm text-muted-foreground">
                        Preferred date: {proposal.preferred_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(proposal.status)}
                      <span className="text-sm font-medium">
                        {getStatusLabel(proposal.status)}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mb-3">
                    Submitted: {new Date(proposal.created_at).toLocaleDateString()}
                  </div>

                  {proposal.eventbrite_url && (
                    <a
                      href={proposal.eventbrite_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on Eventbrite
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {searched && proposals.length === 0 && (
            <div className="text-center py-12 glass rounded-xl">
              <p className="text-muted-foreground">
                No proposals found for this email address.
              </p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
