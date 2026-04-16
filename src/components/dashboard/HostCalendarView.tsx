import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, isSameDay, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Plus, Clock } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  status: string;
}

interface CalendarProposal {
  id: string;
  preferred_event_date: string;
  status: string;
  event_concept: string;
}

interface HostCalendarViewProps {
  userId: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_approval: "bg-yellow-500/20 text-yellow-600",
  approved: "bg-blue-500/20 text-blue-600",
  published: "bg-green-500/20 text-green-600",
  live: "bg-primary/20 text-primary",
  completed: "bg-emerald-500/20 text-emerald-600",
  cancelled: "bg-destructive/20 text-destructive",
};

export function HostCalendarView({ userId }: HostCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const { data: events = [] } = useQuery<CalendarEvent[]>({
    queryKey: ["host-calendar-events", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, start_at, end_at, status")
        .eq("creator_id", userId)
        .order("start_at", { ascending: true });
      return data ?? [];
    },
  });

  const { data: proposals = [] } = useQuery<CalendarProposal[]>({
    queryKey: ["host-calendar-proposals", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_proposals")
        .select("id, preferred_event_date, status, event_concept")
        .eq("user_id", userId);
      return data ?? [];
    },
  });

  // Build modifier date sets
  const publishedDates = events
    .filter((e) => e.status === "published" || e.status === "live" || e.status === "approved")
    .map((e) => parseISO(e.start_at));

  const draftDates = events
    .filter((e) => e.status === "draft")
    .map((e) => parseISO(e.start_at));

  const proposalDates = proposals
    .filter((p) => !!p.preferred_event_date)
    .map((p) => parseISO(p.preferred_event_date));

  const modifiers = {
    event: publishedDates,
    draft: draftDates,
    proposal: proposalDates,
  };

  const modifiersClassNames = {
    event: "bg-primary/20 text-primary font-bold rounded-full",
    draft: "bg-muted text-muted-foreground font-semibold rounded-full",
    proposal: "bg-yellow-100 text-yellow-800 font-semibold rounded-full",
  };

  // Items on the selected date
  const selectedEvents = selectedDate
    ? events.filter((e) => isSameDay(parseISO(e.start_at), selectedDate))
    : [];

  const selectedProposals = selectedDate
    ? proposals.filter(
        (p) => !!p.preferred_event_date && isSameDay(parseISO(p.preferred_event_date), selectedDate)
      )
    : [];

  const hasAnyItems = events.length > 0 || proposals.length > 0;
  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;

  if (!hasAnyItems) {
    return (
      <div className="text-center py-16">
        <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No events scheduled yet</h3>
        <p className="text-muted-foreground mb-6">
          Ready to plan your first event?
        </p>
        <Button variant="default" asChild>
          <Link to="/dashboard/events/new">
            <Plus className="w-4 h-4 mr-2" />
            Plan an Event
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-primary/40" />
          Published / Live
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-muted" />
          Draft
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-yellow-200" />
          Proposal
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Calendar picker */}
        <div className="flex-shrink-0 rounded-xl border border-border bg-secondary/30 p-1">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
          />
        </div>

        {/* Selected day panel */}
        <div className="flex-1 min-w-0">
          {selectedDate ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </h3>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/dashboard/events/new${selectedDateStr ? `?date=${selectedDateStr}` : ""}`}>
                    <Plus className="w-3 h-3 mr-1" />
                    Plan event
                  </Link>
                </Button>
              </div>

              {selectedEvents.length === 0 && selectedProposals.length === 0 ? (
                <div className="text-muted-foreground text-sm py-6 text-center border border-dashed border-border rounded-xl">
                  No events on this date.{" "}
                  <Link
                    to={`/dashboard/events/new?date=${selectedDateStr}`}
                    className="text-primary underline underline-offset-2"
                  >
                    Plan one
                  </Link>
                </div>
              ) : null}

              {selectedEvents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Events
                  </p>
                  {selectedEvents.map((ev) => (
                    <Card key={ev.id} className="glass">
                      <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{ev.title}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {format(parseISO(ev.start_at), "h:mm a")}
                            {ev.end_at && ` – ${format(parseISO(ev.end_at), "h:mm a")}`}
                          </p>
                        </div>
                        <Badge className={STATUS_COLORS[ev.status] ?? "bg-muted text-muted-foreground"}>
                          {ev.status.replace(/_/g, " ")}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {selectedProposals.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Proposals
                  </p>
                  {selectedProposals.map((p) => (
                    <Card key={p.id} className="glass border-yellow-500/30">
                      <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {p.event_concept ?? "Event proposal"}
                          </p>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {p.status.replace(/_/g, " ")}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground text-sm gap-2">
              <CalendarDays className="w-8 h-8 opacity-40" />
              <span>Click a date to see your events</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
