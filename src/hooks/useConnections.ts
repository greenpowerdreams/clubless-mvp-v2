import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Connection {
  connection_id: string;
  connected_user_id: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  primary_role: string | null;
  connected_at: string | null;
}

export interface PendingRequest {
  id: string;
  requester_id: string;
  target_id: string;
  status: string;
  created_at: string;
  requester_profile?: {
    display_name: string | null;
    handle: string | null;
    avatar_url: string | null;
    city: string | null;
    primary_role: string | null;
  };
}

async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export function useConnections() {
  return useQuery({
    queryKey: ["connections"],
    queryFn: async () => {
      const userId = await getCurrentUserId();
      if (!userId) return [];
      const { data, error } = await supabase.rpc("get_connections", { p_user_id: userId });
      if (error) throw error;
      return (data ?? []) as Connection[];
    },
  });
}

export function usePendingRequests() {
  return useQuery({
    queryKey: ["connections", "pending"],
    queryFn: async () => {
      const userId = await getCurrentUserId();
      if (!userId) return { incoming: [] as PendingRequest[], outgoing: [] as PendingRequest[] };

      // Incoming requests (where current user is target)
      const { data: incoming, error: inErr } = await supabase
        .from("connections")
        .select("id, requester_id, target_id, status, created_at")
        .eq("target_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (inErr) throw inErr;

      // Fetch requester profiles for incoming
      const requesterIds = (incoming ?? []).map((r) => r.requester_id);
      let profiles: Record<string, PendingRequest["requester_profile"]> = {};
      if (requesterIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, display_name, handle, avatar_url, city, primary_role")
          .in("id", requesterIds);
        for (const p of profileData ?? []) {
          profiles[p.id] = p;
        }
      }

      const incomingWithProfiles = (incoming ?? []).map((r) => ({
        ...r,
        requester_profile: profiles[r.requester_id],
      }));

      // Outgoing requests
      const { data: outgoing, error: outErr } = await supabase
        .from("connections")
        .select("id, requester_id, target_id, status, created_at")
        .eq("requester_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (outErr) throw outErr;

      return {
        incoming: incomingWithProfiles as PendingRequest[],
        outgoing: (outgoing ?? []) as PendingRequest[],
      };
    },
  });
}

export function useSendConnectionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetUserId: string) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("connections")
        .insert({ requester_id: userId, target_id: targetUserId, status: "pending" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });
}

export function useRespondToConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ connectionId, response }: { connectionId: string; response: "accepted" | "declined" }) => {
      const { data, error } = await supabase
        .from("connections")
        .update({ status: response, responded_at: new Date().toISOString() })
        .eq("id", connectionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });
}

export function useRemoveConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from("connections")
        .delete()
        .eq("id", connectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });
}

export function useConnectionStatus(targetUserId: string | undefined) {
  return useQuery({
    queryKey: ["connection-status", targetUserId],
    enabled: !!targetUserId,
    queryFn: async () => {
      const userId = await getCurrentUserId();
      if (!userId || !targetUserId) return null;

      const { data, error } = await supabase
        .from("connections")
        .select("id, status, requester_id, target_id")
        .or(
          `and(requester_id.eq.${userId},target_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},target_id.eq.${userId})`
        )
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
