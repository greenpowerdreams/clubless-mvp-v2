import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCitySchedules } from "./hooks/useSchedules";
import { Calendar, MapPin, Music, Clock, Sparkles } from "lucide-react";
import { format, startOfDay, addDays } from "date-fns";

const CITIES = ["All Cities", "Seattle", "Los Angeles", "San Francisco", "New York", "Miami", "Austin"];
const TIME_RANGES = [
  { label: "This Week", days: 7 },
  { label: "Next 2 Weeks", days: 14 },
  { label: "This Month", days: 30 },
];

export default function WhosPlaying() {
  const [selectedCity, setSelectedCity] = useState("Seattle");
  const [timeRange, setTimeRange] = useState(7);

  const now = startOfDay(new Date());
  const endDate = addDays(now, timeRange);

  const { data: schedules, isLoading } = useCitySchedules(
    selectedCity,
    now.toISOString(),
    endDate.toISOString()
  );

  // Group by date
  const groupedByDate: Record<string, typeof schedules> = {};
  (schedules ?? []).forEach((schedule) => {
    const dateKey = format(new Date(schedule.start_at), "yyyy-MM-dd");
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey]!.push(schedule);
  });

  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="container px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Who's <span className="text-primary">Playing</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10">
              See every DJ and event happening in your city
            </p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="h-12 bg-secondary border-border">
                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(timeRange)}
                onValueChange={(v) => setTimeRange(Number(v))}
              >
                <SelectTrigger className="h-12 bg-secondary border-border">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGES.map((range) => (
                    <SelectItem key={range.days} value={String(range.days)}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Grid */}
      <section className="py-16 md:py-20">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="text-center py-20 max-w-md mx-auto">
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-3">No gigs scheduled</h3>
                <p className="text-muted-foreground">
                  No DJs have posted gigs in {selectedCity === "All Cities" ? "any city" : selectedCity} for this time period yet.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {sortedDates.map((dateKey) => {
                  const daySchedules = groupedByDate[dateKey]!;
                  const date = new Date(dateKey + "T00:00:00");

                  return (
                    <div key={dateKey}>
                      {/* Date Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/20 flex flex-col items-center justify-center">
                          <span className="text-xs text-primary font-medium">
                            {format(date, "EEE")}
                          </span>
                          <span className="text-lg font-bold text-primary">
                            {format(date, "d")}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-semibold">
                            {format(date, "EEEE, MMMM d")}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {daySchedules.length} {daySchedules.length === 1 ? "set" : "sets"}
                          </p>
                        </div>
                      </div>

                      {/* Gigs for this date */}
                      <div className="space-y-3 ml-[4.25rem]">
                        {daySchedules.map((schedule) => {
                          const profile = (schedule as any).profiles;
                          return (
                            <div
                              key={schedule.id}
                              className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                {profile?.avatar_url ? (
                                  <img
                                    src={profile.avatar_url}
                                    alt=""
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Music className="w-5 h-5 text-primary" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <h4 className="font-medium">
                                    {profile?.stage_name || profile?.display_name || "DJ"}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {schedule.title}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
                                  {profile?.genres && profile.genres.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {profile.genres.slice(0, 3).map((genre: string) => (
                                        <Badge
                                          key={genre}
                                          variant="secondary"
                                          className="text-2xs"
                                        >
                                          {genre}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
