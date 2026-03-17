import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TrackEventParams {
  eventType: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  properties?: Record<string, unknown>;
  city?: string;
}

export function useTrackEvent() {
  return useMutation({
    mutationFn: async (params: TrackEventParams) => {
      const { error } = await supabase.from("analytics_events").insert({
        event_type: params.eventType,
        entity_type: params.entityType || null,
        entity_id: params.entityId || null,
        user_id: params.userId || null,
        session_id: getSessionId(),
        properties: params.properties || null,
        city: params.city || null,
      });

      if (error) throw error;
    },
  });
}

// Simple session ID for analytics grouping
function getSessionId(): string {
  const key = "clubless_session_id";
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}
