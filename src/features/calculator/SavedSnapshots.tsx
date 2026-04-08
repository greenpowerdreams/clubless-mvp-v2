import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCalculatorSnapshots, useDeleteSnapshot } from "./hooks/useCalculatorSnapshots";
import { useToast } from "@/hooks/use-toast";
import { History, Trash2, TrendingUp, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface SavedSnapshotsProps {
  userId: string;
  onLoad?: (inputs: any) => void;
}

function getViabilityBadge(score: number | null) {
  if (score === null) return null;
  if (score >= 8) return <Badge className="bg-green-500/20 text-green-400">Highly Viable ({score})</Badge>;
  if (score >= 6) return <Badge className="bg-blue-500/20 text-blue-400">Viable ({score})</Badge>;
  if (score >= 4) return <Badge className="bg-yellow-500/20 text-yellow-400">Marginal ({score})</Badge>;
  return <Badge className="bg-destructive/20 text-destructive">High Risk ({score})</Badge>;
}

export function SavedSnapshots({ userId, onLoad }: SavedSnapshotsProps) {
  const { data: snapshots, isLoading } = useCalculatorSnapshots(userId);
  const deleteSnapshot = useDeleteSnapshot();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await deleteSnapshot.mutateAsync({ id, userId });
      toast({ title: "Snapshot deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <Skeleton className="h-48 rounded-xl" />;
  }

  if (!snapshots || snapshots.length === 0) {
    return null; // Don't show section if no snapshots
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Saved Calculations ({snapshots.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {snapshots.map((snapshot) => {
          const outputs = snapshot.outputs_json;
          return (
            <div
              key={snapshot.id}
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {(snapshot.inputs_json as any).attendance} guests @ $
                    {(snapshot.inputs_json as any).ticketPrice}
                  </span>
                  {getViabilityBadge(snapshot.viability_score)}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="text-green-400 font-medium">
                    ${Math.round((outputs as any).yourTakeHome).toLocaleString()} take-home
                  </span>
                  <span>
                    {format(new Date(snapshot.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {onLoad && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLoad(snapshot.inputs_json)}
                  >
                    Load
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(snapshot.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
