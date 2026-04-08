import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CalculatorSnapshot, CalculatorInputs, CalculatorOutputs, ViabilityFactor } from "../calculator.types";

export function useCalculatorSnapshots(userId: string | undefined) {
  return useQuery({
    queryKey: ["calculator-snapshots", userId],
    queryFn: async (): Promise<CalculatorSnapshot[]> => {
      const { data, error } = await supabase
        .from("calculator_snapshots")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data ?? []) as CalculatorSnapshot[];
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useSaveSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      eventId,
      inputs,
      outputs,
      viabilityScore,
      viabilityFactors,
    }: {
      userId: string;
      eventId?: string;
      inputs: CalculatorInputs;
      outputs: CalculatorOutputs;
      viabilityScore: number;
      viabilityFactors: ViabilityFactor[];
    }) => {
      const { data, error } = await supabase
        .from("calculator_snapshots")
        .insert({
          user_id: userId,
          event_id: eventId || null,
          inputs_json: inputs as any,
          outputs_json: outputs as any,
          viability_score: viabilityScore,
          viability_factors: viabilityFactors as any,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["calculator-snapshots", data.user_id] });
    },
  });
}

export function useDeleteSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase.from("calculator_snapshots").delete().eq("id", id);
      if (error) throw error;
      return { userId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["calculator-snapshots", data.userId] });
    },
  });
}
