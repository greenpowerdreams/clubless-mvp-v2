import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TicketInstance {
  id: string;
  order_id: string;
  tier_id: string;
  event_id: string;
  holder_id: string | null;
  holder_name: string | null;
  holder_email: string | null;
  qr_code: string;
  status: string;
  scanned_at: string | null;
  scanned_by: string | null;
  created_at: string;
  tier_name?: string;
}

export interface CheckinStats {
  total_tickets: number;
  checked_in: number;
  remaining: number;
  checkin_rate: number;
}

export function useEventTicketInstances(eventId: string | undefined) {
  return useQuery({
    queryKey: ["ticket-instances", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_instances")
        .select("*, tickets(name)")
        .eq("event_id", eventId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((d: any) => ({
        ...d,
        tier_name: d.tickets?.name ?? "Unknown",
      })) as TicketInstance[];
    },
  });
}

export function useCheckinStats(eventId: string | undefined) {
  return useQuery({
    queryKey: ["checkin-stats", eventId],
    enabled: !!eventId,
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_checkin_stats", { p_event_id: eventId! });
      if (error) throw error;
      return (data?.[0] ?? { total_tickets: 0, checked_in: 0, remaining: 0, checkin_rate: 0 }) as CheckinStats;
    },
  });
}

export function useScanTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ qrToken }: { qrToken: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const { data, error } = await supabase.rpc("scan_ticket", {
        p_qr_token: qrToken,
        p_scanned_by: session.user.id,
      });
      if (error) throw error;
      return data?.[0] ?? null;
    },
    onSuccess: (data) => {
      if (data?.ticket_instance_id) {
        queryClient.invalidateQueries({ queryKey: ["ticket-instances"] });
        queryClient.invalidateQueries({ queryKey: ["checkin-stats"] });
      }
    },
  });
}

export function useCheckinRealtime(eventId: string | undefined) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel(`checkin-${eventId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "ticket_instances",
        filter: `event_id=eq.${eventId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["ticket-instances", eventId] });
        queryClient.invalidateQueries({ queryKey: ["checkin-stats", eventId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId, queryClient]);
}

export function useManualCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (instanceId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("ticket_instances")
        .update({ status: "scanned", scanned_at: new Date().toISOString(), scanned_by: session.user.id })
        .eq("id", instanceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-instances"] });
      queryClient.invalidateQueries({ queryKey: ["checkin-stats"] });
    },
  });
}
