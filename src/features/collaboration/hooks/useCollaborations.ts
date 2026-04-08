import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Collaboration, CollaboratorInfo } from "../types";

export function useEventCollaborators(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event-collaborators", eventId],
    queryFn: async (): Promise<CollaboratorInfo[]> => {
      const { data, error } = await supabase.rpc("get_event_collaborators", {
        p_event_id: eventId!,
      });
      if (error) throw error;
      return (data ?? []) as CollaboratorInfo[];
    },
    enabled: !!eventId,
    staleTime: 30_000,
  });
}

export function useMyCollaborations(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-collaborations", userId],
    queryFn: async (): Promise<(Collaboration & { events: { title: string; start_at: string; city: string } })[]> => {
      const { data, error } = await supabase
        .from("collaborations")
        .select("*, events(title, start_at, city)")
        .eq("collaborator_id", userId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as any;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useInviteCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collab: {
      event_id: string;
      initiator_id: string;
      collaborator_id: string;
      role: string;
      revenue_split_percent: number | null;
    }) => {
      const { data, error } = await supabase
        .from("collaborations")
        .insert(collab)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["event-collaborators", data.event_id] });
      queryClient.invalidateQueries({ queryKey: ["my-collaborations"] });
    },
  });
}

export function useRespondToCollaboration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "accepted" | "declined";
    }) => {
      const { data, error } = await supabase
        .from("collaborations")
        .update({
          status,
          accepted_at: status === "accepted" ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-collaborators"] });
      queryClient.invalidateQueries({ queryKey: ["my-collaborations"] });
    },
  });
}

export function useRemoveCollaborator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase.from("collaborations").delete().eq("id", id);
      if (error) throw error;
      return { eventId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["event-collaborators", data.eventId] });
    },
  });
}
