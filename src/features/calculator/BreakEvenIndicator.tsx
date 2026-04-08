interface BreakEvenIndicatorProps {
  currentAttendance: number;
  breakEvenAttendance: number;
  maxAttendance: number; // slider max (e.g. 500)
  eventType: string;
}

/**
 * A compact visual indicator that shows the break-even point relative to the
 * attendance slider range.  Renders null for degenerate cases (zero break-even
 * or break-even unreachable) so callers don't need to guard.
 */
export function BreakEvenIndicator({
  currentAttendance,
  breakEvenAttendance,
  maxAttendance,
}: BreakEvenIndicatorProps) {
  // Don't render when break-even is zero (free/no-revenue events) or impossible
  if (breakEvenAttendance <= 0 || breakEvenAttendance > maxAttendance * 2) {
    return null;
  }

  const isSafe = currentAttendance >= breakEvenAttendance;
  const gap = Math.abs(currentAttendance - breakEvenAttendance);

  // Clamp the marker pin position to [0%, 100%] of the bar
  const markerPct = Math.min(100, Math.max(0, (breakEvenAttendance / maxAttendance) * 100));
  // Fill width = current attendance as % of max, capped at 100%
  const fillPct = Math.min(100, (currentAttendance / maxAttendance) * 100);

  return (
    <div className="mt-2 space-y-1.5">
      {/* ── Horizontal bar with marker pin ── */}
      <div className="relative h-2.5 rounded-full bg-secondary overflow-visible">
        {/* Fill: green if safe, red if at risk */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
            isSafe ? "bg-green-500/70" : "bg-red-500/70"
          }`}
          style={{ width: `${fillPct}%` }}
        />

        {/* Break-even marker pin */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
          style={{ left: `${markerPct}%` }}
          title={`Break-even: ${breakEvenAttendance} guests`}
        >
          {/* Vertical pin line */}
          <div className="w-0.5 h-5 bg-white/80 rounded-full mx-auto -mt-1.5" />
          {/* Diamond cap */}
          <div className="w-2 h-2 bg-white/90 rotate-45 mx-auto -mt-0.5" />
        </div>
      </div>

      {/* ── Status text ── */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Break-even:{" "}
          <span className="font-semibold text-foreground">
            {breakEvenAttendance.toLocaleString()} guests
          </span>
        </span>

        {isSafe ? (
          <span className="text-green-400 font-medium">
            ✓ Safe by {gap.toLocaleString()} guests
          </span>
        ) : (
          <span className="text-red-400 font-medium">
            ⚠ Need {gap.toLocaleString()} more guests
          </span>
        )}
      </div>

      {/* ── One-liner summary ── */}
      <p className="text-xs text-muted-foreground">
        {isSafe
          ? `You're planning for ${currentAttendance.toLocaleString()} guests — ${gap.toLocaleString()} above break-even.`
          : `You need ${breakEvenAttendance.toLocaleString()} guests to break even. You're planning for ${currentAttendance.toLocaleString()}.`}
      </p>
    </div>
  );
}
