import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserStats } from "./types";

export function useUserStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-stats", userId],
    queryFn: async (): Promise<UserStats | null> => {
      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();

      if (error) throw error;
      return data as UserStats | null;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}
