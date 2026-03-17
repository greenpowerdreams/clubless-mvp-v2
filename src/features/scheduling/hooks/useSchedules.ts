import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Schedule } from "../types";

export function useSchedules(userId: string | undefined) {
  return useQuery({
    queryKey: ["schedules", userId],
    queryFn: async (): Promise<Schedule[]> => {
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", userId!)
        .order("start_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Schedule[];
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useCitySchedules(city: string | undefined, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["city-schedules", city, startDate, endDate],
    queryFn: async (): Promise<(Schedule & { profiles: { display_name: string | null; stage_name: string | null; avatar_url: string | null; genres: string[] | null } })[]> => {
      let query = supabase
        .from("schedules")
        .select("*, profiles!inner(display_name, stage_name, avatar_url, genres)")
        .eq("visibility", "public")
        .eq("schedule_type", "gig")
        .order("start_at", { ascending: true });

      if (city && city !== "All Cities") {
        query = query.eq("city", city);
      }
      if (startDate) {
        query = query.gte("start_at", startDate);
      }
      if (endDate) {
        query = query.lte("start_at", endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as any;
    },
    enabled: true,
    staleTime: 30_000,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schedule: Omit<Schedule, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("schedules")
        .insert(schedule)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["schedules", data.user_id] });
      queryClient.invalidateQueries({ queryKey: ["city-schedules"] });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase.from("schedules").delete().eq("id", id);
      if (error) throw error;
      return { id, userId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["schedules", data.userId] });
      queryClient.invalidateQueries({ queryKey: ["city-schedules"] });
    },
  });
}
