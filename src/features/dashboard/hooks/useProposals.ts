import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EventProposal } from "./types";

export function useProposals(userId: string | undefined) {
  return useQuery({
    queryKey: ["proposals", userId],
    queryFn: async (): Promise<EventProposal[]> => {
      const { data, error } = await supabase
        .from("event_proposals")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as EventProposal[];
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useProposalDetail(proposalId: string | undefined) {
  return useQuery({
    queryKey: ["proposal-detail", proposalId],
    queryFn: async (): Promise<EventProposal | null> => {
      const { data, error } = await supabase
        .from("event_proposals")
        .select("*")
        .eq("id", proposalId!)
        .maybeSingle();

      if (error) throw error;
      return data as EventProposal | null;
    },
    enabled: !!proposalId,
    staleTime: 30_000,
  });
}
