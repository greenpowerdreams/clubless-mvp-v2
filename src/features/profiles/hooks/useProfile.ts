import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PublicProfile } from "@/features/collaboration/types";

export function usePublicProfile(identifier: string | undefined) {
  return useQuery({
    queryKey: ["public-profile", identifier],
    queryFn: async (): Promise<PublicProfile | null> => {
      // Try slug first, then user_id
      let query = supabase.from("profiles").select("*");

      // UUID pattern check
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        identifier!
      );

      if (isUuid) {
        query = query.eq("user_id", identifier!);
      } else {
        query = query.eq("slug", identifier!);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as PublicProfile | null;
    },
    enabled: !!identifier,
    staleTime: 60_000,
  });
}

export function useCreatorDirectory(city?: string) {
  return useQuery({
    queryKey: ["creator-directory", city],
    queryFn: async (): Promise<PublicProfile[]> => {
      let query = supabase
        .from("profiles")
        .select("*")
        .eq("public_profile", true)
        .not("creator_type", "is", null)
        .order("verified", { ascending: false })
        .order("display_name", { ascending: true });

      if (city && city !== "All Cities") {
        query = query.or(`city.eq.${city},home_city.eq.${city}`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return (data ?? []) as PublicProfile[];
    },
    staleTime: 60_000,
  });
}
