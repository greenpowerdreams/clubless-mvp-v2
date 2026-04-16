import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProposals } from "./hooks/useProposals";
import { getStatusColor, formatStatus, formatCurrencyWhole } from "./hooks/types";
import { Calendar, MapPin, TrendingUp, ChevronRight, Sparkles } from "lucide-react";

interface DashboardProposalsProps {
  userId: string;
}

export function DashboardProposals({ userId }: DashboardProposalsProps) {
  const { data: proposals, isLoading } = useProposals(userId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!proposals || proposals.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No proposals yet</h3>
        <p className="text-muted-foreground mb-4">
          Submit an event idea to get started
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link to="/calculator">Start with Calculator</Link>
          </Button>
          <Button variant="default" asChild>
            <Link to="/dashboard/events/new">Submit Event</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Your Proposals
        </h2>
        <Button variant="default" size="sm" asChild>
          <Link to="/dashboard/events/new">Submit New</Link>
        </Button>
      </div>

      <div className="space-y-4">
        {proposals.map((proposal) => (
          <Link
            key={proposal.id}
            to={`/dashboard/proposals/${proposal.id}`}
            className="block p-4 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      proposal.status
                    )}`}
                  >
                    {formatStatus(proposal.status)}
                  </span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {proposal.city}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(proposal.preferred_event_date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 text-green-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {formatCurrencyWhole(proposal.projected_profit)} projected
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground hidden sm:block" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
