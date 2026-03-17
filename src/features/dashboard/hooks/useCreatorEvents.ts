import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CreatorData } from "./types";

export function useCreatorEvents(userId: string | undefined) {
  return useQuery({
    queryKey: ["creator-events", userId],
    queryFn: async (): Promise<CreatorData> => {
      // Fetch events created by this user
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("creator_id", userId!)
        .order("start_at", { ascending: false });

      if (eventsError) throw eventsError;
      if (!events || events.length === 0) {
        return { events: [], tickets: [], orders: [], payouts: [] };
      }

      const eventIds = events.map((e) => e.id);

      // Fetch related data in parallel
      const [ticketsResult, ordersResult, payoutsResult] = await Promise.all([
        supabase.from("tickets").select("*").in("event_id", eventIds),
        supabase
          .from("orders")
          .select("*")
          .in("event_id", eventIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("payouts")
          .select("*")
          .in("event_id", eventIds)
          .order("created_at", { ascending: false }),
      ]);

      if (ticketsResult.error) throw ticketsResult.error;
      if (ordersResult.error) throw ordersResult.error;
      if (payoutsResult.error) throw payoutsResult.error;

      return {
        events: events as CreatorData["events"],
        tickets: (ticketsResult.data ?? []) as CreatorData["tickets"],
        orders: (ordersResult.data ?? []) as CreatorData["orders"],
        payouts: (payoutsResult.data ?? []) as CreatorData["payouts"],
      };
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}
