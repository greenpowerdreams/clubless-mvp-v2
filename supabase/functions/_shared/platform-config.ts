// Shared helpers for reading platform_config from Edge Functions.
// Service role bypasses RLS, so any caller passing a service-role client can read.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const DEFAULT_PLATFORM_FEE_PERCENT = 5;

/**
 * Reads `platform_fee_percent` from platform_config.
 * Falls back to DEFAULT_PLATFORM_FEE_PERCENT (5) if missing or unreadable,
 * so checkout never breaks on a config gap.
 */
export async function getPlatformFeePercent(supabaseAdmin: SupabaseClient): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .from("platform_config")
      .select("value")
      .eq("key", "platform_fee_percent")
      .maybeSingle();

    if (error || !data) return DEFAULT_PLATFORM_FEE_PERCENT;

    // value is JSONB — could be a number, a stringified number, or wrapped.
    const raw = data.value;
    const num =
      typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? parseFloat(raw)
          : typeof raw === "object" && raw !== null && "value" in raw
            ? Number((raw as { value: unknown }).value)
            : NaN;

    if (!Number.isFinite(num) || num < 0 || num > 100) {
      return DEFAULT_PLATFORM_FEE_PERCENT;
    }
    return num;
  } catch {
    return DEFAULT_PLATFORM_FEE_PERCENT;
  }
}
