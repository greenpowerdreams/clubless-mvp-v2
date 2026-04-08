import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  user_id: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  primary_role: string | null;
}

export function useUserSearch(
  query: string,
  filters?: { role?: string; city?: string },
  enabled = true
) {
  return useQuery({
    queryKey: ["user-search", query, filters?.role, filters?.city],
    enabled: enabled && query.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_users", {
        p_query: query || null,
        p_role: filters?.role || null,
        p_city: filters?.city || null,
        p_limit: 20,
        p_offset: 0,
      });
      if (error) throw error;
      return (data ?? []) as SearchResult[];
    },
  });
}
