import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Booking } from "../types";

export function useBookings(userId: string | undefined) {
  return useQuery({
    queryKey: ["bookings", userId],
    queryFn: async (): Promise<{ incoming: Booking[]; outgoing: Booking[] }> => {
      const [incomingResult, outgoingResult] = await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .eq("target_id", userId!)
          .order("created_at", { ascending: false }),
        supabase
          .from("bookings")
          .select("*")
          .eq("requester_id", userId!)
          .order("created_at", { ascending: false }),
      ]);

      if (incomingResult.error) throw incomingResult.error;
      if (outgoingResult.error) throw outgoingResult.error;

      return {
        incoming: (incomingResult.data ?? []) as Booking[],
        outgoing: (outgoingResult.data ?? []) as Booking[],
      };
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: Pick<Booking, "event_id" | "requester_id" | "target_id" | "booking_type" | "proposed_rate_cents" | "set_start_at" | "set_end_at" | "notes">) => {
      const { data, error } = await supabase
        .from("bookings")
        .insert(booking)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useRespondToBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      agreed_rate_cents,
    }: {
      id: string;
      status: "accepted" | "declined";
      agreed_rate_cents?: number;
    }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({
          status,
          agreed_rate_cents,
          responded_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
}
