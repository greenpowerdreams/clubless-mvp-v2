import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ConnectionCounts } from "../types";

export function useConnectionCounts(userId: string | undefined) {
  return useQuery({
    queryKey: ["connection-counts", userId],
    queryFn: async (): Promise<ConnectionCounts> => {
      const { data, error } = await supabase.rpc("get_connection_counts", {
        p_user_id: userId!,
      });
      if (error) throw error;
      if (!data || data.length === 0) return { followers_count: 0, following_count: 0 };
      return data[0] as ConnectionCounts;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useIsFollowing(followerId: string | undefined, followingId: string | undefined) {
  return useQuery({
    queryKey: ["is-following", followerId, followingId],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("connections")
        .select("id")
        .eq("follower_id", followerId!)
        .eq("following_id", followingId!)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!followerId && !!followingId && followerId !== followingId,
    staleTime: 30_000,
  });
}

export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      followerId,
      followingId,
      isCurrentlyFollowing,
    }: {
      followerId: string;
      followingId: string;
      isCurrentlyFollowing: boolean;
    }) => {
      if (isCurrentlyFollowing) {
        const { error } = await supabase
          .from("connections")
          .delete()
          .eq("follower_id", followerId)
          .eq("following_id", followingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("connections")
          .insert({ follower_id: followerId, following_id: followingId });
        if (error) throw error;
      }
      return { followerId, followingId };
    },
    onSuccess: ({ followerId, followingId }) => {
      queryClient.invalidateQueries({ queryKey: ["is-following", followerId, followingId] });
      queryClient.invalidateQueries({ queryKey: ["connection-counts", followingId] });
      queryClient.invalidateQueries({ queryKey: ["connection-counts", followerId] });
    },
  });
}
