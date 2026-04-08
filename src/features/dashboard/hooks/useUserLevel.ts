import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserLevel } from "./types";

export function useUserLevel(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-level", userId],
    queryFn: async (): Promise<UserLevel | null> => {
      const { data, error } = await supabase.rpc("get_user_level", {
        p_user_id: userId!,
      });

      if (error) throw error;
      if (!data || data.length === 0) return null;
      return data[0] as UserLevel;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}
