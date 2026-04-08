import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSchedules, useCreateSchedule, useDeleteSchedule } from "./hooks/useSchedules";
import { useBookings, useRespondToBooking } from "./hooks/useBookings";
import { SCHEDULE_TYPE_LABELS } from "./types";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Music,
} from "lucide-react";
import { format, isAfter, isBefore, addDays, startOfDay } from "date-fns";

interface DashboardScheduleProps {
  userId: string;
}

export function DashboardSchedule({ userId }: DashboardScheduleProps) {
  const { data: schedules, isLoading: schedulesLoading } = useSchedules(userId);
  const { data: bookingsData, isLoading: bookingsLoading } = useBookings(userId);
  const createSchedule = useCreateSchedule();
  const deleteSchedule = useDeleteSchedule();
  const respondToBooking = useRespondToBooking();
  const { toast } = useToast();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    title: "",
    schedule_type: "gig" as const,
    start_at: "",
    end_at: "",
    city: "",
    visibility: "public" as const,
    notes: "",
  });

  if (schedulesLoading || bookingsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const upcomingSchedules = (schedules ?? []).filter((s) =>
    isAfter(new Date(s.start_at), new Date())
  );

  const pendingIncoming = (bookingsData?.incoming ?? []).filter(
    (b) => b.status === "pending"
  );

  const handleAddSchedule = async () => {
    if (!newSchedule.title || !newSchedule.start_at || !newSchedule.end_at) {
      toast({ title: "Missing fields", description: "Title, start, and end time are required.", variant: "destructive" });
      return;
    }

    try {
      await createSchedule.mutateAsync({
        user_id: userId,
        event_id: null,
        title: newSchedule.title,
        schedule_type: newSchedule.schedule_type,
        start_at: new Date(newSchedule.start_at).toISOString(),
        end_at: new Date(newSchedule.end_at).toISOString(),
        city: newSchedule.city || null,
        venue_id: null,
        visibility: newSchedule.visibility,
        notes: newSchedule.notes || null,
      });
      setShowAddDialog(false);
      setNewSchedule({ title: "", schedule_type: "gig", start_at: "", end_at: "", city: "", visibility: "public", notes: "" });
      toast({ title: "Schedule added" });
    } catch {
      toast({ title: "Failed to add schedule", variant: "destructive" });
    }
  };

  const handleRespond = async (bookingId: string, status: "accepted" | "declined") => {
    try {
      await respondToBooking.mutateAsync({ id: bookingId, status });
      toast({ title: status === "accepted" ? "Booking accepted" : "Booking declined" });
    } catch {
      toast({ title: "Failed to respond", variant: "destructive" });
    }
  };

  const handleDelete = async (scheduleId: string) => {
    try {
      await deleteSchedule.mutateAsync({ id: scheduleId, userId });
      toast({ title: "Schedule removed" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Booking Requests */}
      {pendingIncoming.length > 0 && (
        <Card className="glass border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <AlertTriangle className="w-5 h-5" />
              Booking Requests ({pendingIncoming.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingIncoming.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
              >
                <div>
                  <p className="font-medium">
                    {booking.booking_type === "dj" ? "DJ Booking" : "Booking"} Request
                  </p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    {booking.set_start_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(booking.set_start_at), "MMM d, h:mm a")}
                      </span>
                    )}
                    {booking.proposed_rate_cents && (
                      <span className="text-green-400">
                        ${(booking.proposed_rate_cents / 100).toFixed(0)} proposed
                      </span>
                    )}
                  </div>
                  {booking.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{booking.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleRespond(booking.id, "accepted")}
                    disabled={respondToBooking.isPending}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRespond(booking.id, "declined")}
                    disabled={respondToBooking.isPending}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Schedule Header + Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Your Schedule
        </h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add to Schedule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g. Afrohouse Fridays @ Monkey Loft"
                  value={newSchedule.title}
                  onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newSchedule.schedule_type}
                  onValueChange={(v) => setNewSchedule({ ...newSchedule, schedule_type: v as any })}
                >
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gig">Gig</SelectItem>
                    <SelectItem value="availability">Available</SelectItem>
                    <SelectItem value="block">Blocked</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start</Label>
                  <Input
                    type="datetime-local"
                    value={newSchedule.start_at}
                    onChange={(e) => setNewSchedule({ ...newSchedule, start_at: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End</Label>
                  <Input
                    type="datetime-local"
                    value={newSchedule.end_at}
                    onChange={(e) => setNewSchedule({ ...newSchedule, end_at: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  placeholder="Seattle"
                  value={newSchedule.city}
                  onChange={(e) => setNewSchedule({ ...newSchedule, city: e.target.value })}
                  className="bg-secondary/50"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleAddSchedule}
                disabled={createSchedule.isPending}
              >
                {createSchedule.isPending ? "Adding..." : "Add to Schedule"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Schedule */}
      {upcomingSchedules.length === 0 ? (
        <Card className="glass text-center py-12">
          <CardContent>
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No upcoming schedule</h3>
            <p className="text-muted-foreground mb-4">
              Add gigs, availability blocks, or holds to your schedule
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {upcomingSchedules.map((schedule) => {
            const typeInfo = SCHEDULE_TYPE_LABELS[schedule.schedule_type] || SCHEDULE_TYPE_LABELS.gig;
            return (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Music className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{schedule.title}</h4>
                      <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(schedule.start_at), "EEE, MMM d")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(schedule.start_at), "h:mm a")} -{" "}
                        {format(new Date(schedule.end_at), "h:mm a")}
                      </span>
                      {schedule.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {schedule.city}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(schedule.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
