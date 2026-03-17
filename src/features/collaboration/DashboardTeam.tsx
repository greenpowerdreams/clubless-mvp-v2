import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyCollaborations, useRespondToCollaboration } from "./hooks/useCollaborations";
import { useToast } from "@/hooks/use-toast";
import { Users, Check, X, Calendar, MapPin, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface DashboardTeamProps {
  userId: string;
}

const ROLE_COLORS: Record<string, string> = {
  "co-host": "bg-primary/20 text-primary",
  promoter: "bg-blue-500/20 text-blue-400",
  dj: "bg-purple-500/20 text-purple-400",
  mc: "bg-accent/20 text-accent",
  manager: "bg-green-500/20 text-green-400",
};

const STATUS_COLORS: Record<string, string> = {
  invited: "bg-yellow-500/20 text-yellow-400",
  accepted: "bg-green-500/20 text-green-400",
  declined: "bg-destructive/20 text-destructive",
  removed: "bg-muted text-muted-foreground",
};

export function DashboardTeam({ userId }: DashboardTeamProps) {
  const { data: collaborations, isLoading } = useMyCollaborations(userId);
  const respondToCollab = useRespondToCollaboration();
  const { toast } = useToast();

  const handleRespond = async (id: string, status: "accepted" | "declined") => {
    try {
      await respondToCollab.mutateAsync({ id, status });
      toast({ title: status === "accepted" ? "Collaboration accepted" : "Invitation declined" });
    } catch {
      toast({ title: "Failed to respond", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  const pending = (collaborations ?? []).filter((c) => c.status === "invited");
  const active = (collaborations ?? []).filter((c) => c.status === "accepted");
  const past = (collaborations ?? []).filter((c) => c.status === "declined" || c.status === "removed");

  if (!collaborations || collaborations.length === 0) {
    return (
      <Card className="glass text-center py-12">
        <CardContent>
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No collaborations yet</h3>
          <p className="text-muted-foreground">
            When event creators invite you to collaborate, invitations will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Invitations */}
      {pending.length > 0 && (
        <Card className="glass border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              Pending Invitations ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.map((collab) => {
              const event = (collab as any).events;
              return (
                <div
                  key={collab.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                >
                  <div>
                    <h4 className="font-medium">{event?.title || "Event"}</h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <Badge className={ROLE_COLORS[collab.role] || "bg-muted text-muted-foreground"}>
                        {collab.role}
                      </Badge>
                      {collab.revenue_split_percent !== null && (
                        <span className="text-green-400">
                          {collab.revenue_split_percent}% split
                        </span>
                      )}
                      {event?.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.city}
                        </span>
                      )}
                      {event?.start_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(event.start_at), "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleRespond(collab.id, "accepted")}
                      disabled={respondToCollab.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRespond(collab.id, "declined")}
                      disabled={respondToCollab.isPending}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Active Collaborations */}
      {active.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Active Collaborations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {active.map((collab) => {
              const event = (collab as any).events;
              return (
                <div
                  key={collab.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                >
                  <div>
                    <h4 className="font-medium">{event?.title || "Event"}</h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <Badge className={ROLE_COLORS[collab.role] || "bg-muted"}>
                        {collab.role}
                      </Badge>
                      {collab.revenue_split_percent !== null && (
                        <span className="text-green-400">
                          {collab.revenue_split_percent}% split
                        </span>
                      )}
                      {event?.start_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(event.start_at), "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge className={STATUS_COLORS.accepted}>Active</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Past */}
      {past.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Past</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {past.map((collab) => {
              const event = (collab as any).events;
              return (
                <div
                  key={collab.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 opacity-60"
                >
                  <div>
                    <h4 className="font-medium">{event?.title || "Event"}</h4>
                    <Badge className={ROLE_COLORS[collab.role] || "bg-muted"} >
                      {collab.role}
                    </Badge>
                  </div>
                  <Badge className={STATUS_COLORS[collab.status]}>
                    {collab.status}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
