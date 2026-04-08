import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Download, Check } from "lucide-react";
import { toast } from "sonner";
import type { CalculatorResult, CalculatorInputs } from "./calculator.types";

interface ShareableScoreCardProps {
  result: CalculatorResult;
  inputs: CalculatorInputs;
  viabilityScore: number;
  viabilityTier: { label: string; emoji: string; color: string };
  eventType: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  nightlife: "Nightlife Event",
  wedding: "Wedding",
  corporate: "Corporate Event",
  birthday: "Birthday Party",
  other: "Private Event",
};

function fmt(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtPct(n: number): string {
  return `${Math.round(n)}%`;
}

export function ShareableScoreCard({
  result,
  inputs,
  viabilityScore,
  viabilityTier,
  eventType,
}: ShareableScoreCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const eventLabel = EVENT_TYPE_LABELS[eventType] ?? "Event";
  const takeHome = result.yourTakeHome;
  const breakEven = result.breakEvenAttendance;
  const roi = result.roi;

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Event Calculation — Clubless",
          text: `I ran the numbers on my ${eventLabel.toLowerCase()} — take-home ${fmt(takeHome)}, ${fmtPct(roi)} ROI. Check it out:`,
          url,
        });
        return;
      } catch {
        // User cancelled or API unavailable — fall through to clipboard
      }
    }
    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy link. Try sharing manually.");
    }
  }

  async function handleDownload() {
    // Try html2canvas if available (not bundled — note in build report)
    const html2canvas =
      typeof window !== "undefined" && (window as unknown as Record<string, unknown>)["html2canvas"];

    if (typeof html2canvas === "function" && cardRef.current) {
      try {
        const canvas = await (html2canvas as (el: HTMLElement, opts?: object) => Promise<HTMLCanvasElement>)(
          cardRef.current,
          { useCORS: true, backgroundColor: null }
        );
        const link = document.createElement("a");
        link.download = "clubless-score-card.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        return;
      } catch {
        // fall through
      }
    }
    // Fallback: print
    window.print();
  }

  return (
    <div className="space-y-4">
      {/* The shareable card — fixed 400×300px */}
      <div
        ref={cardRef}
        style={{ width: 400, height: 300 }}
        className="overflow-hidden rounded-2xl relative flex flex-col justify-between p-6 text-white select-none"
        aria-label="Shareable score card"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d1a] via-[#13102b] to-[#1a0d2e]" />
        {/* Purple glow blob */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-purple-600/25 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-purple-800/20 blur-2xl" />

        {/* Content sits above the background */}
        <div className="relative z-10 flex items-start justify-between">
          {/* Wordmark */}
          <div>
            <p
              className="text-xl font-bold tracking-tight"
              style={{ color: "#c084fc", fontFamily: "inherit", letterSpacing: "-0.01em" }}
            >
              clubless
            </p>
            <p className="text-xs text-white/50 mt-0.5">{eventLabel}</p>
          </div>

          {/* Viability tier badge */}
          <div
            className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: "rgba(192, 132, 252, 0.18)", border: "1px solid rgba(192,132,252,0.35)", color: "#e9d5ff" }}
          >
            <span>{viabilityTier.emoji}</span>
            <span>{viabilityTier.label}</span>
          </div>
        </div>

        {/* Three key metrics */}
        <div className="relative z-10 grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-white/45 uppercase tracking-widest mb-1 leading-none">
              Take-Home
            </p>
            <p className="text-2xl font-bold text-white leading-none">{fmt(takeHome)}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/45 uppercase tracking-widest mb-1 leading-none">
              Break-Even
            </p>
            <p className="text-2xl font-bold text-white leading-none">
              {breakEven.toLocaleString()}{" "}
              <span className="text-sm font-normal text-white/60">guests</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-white/45 uppercase tracking-widest mb-1 leading-none">
              ROI
            </p>
            <p className="text-2xl font-bold text-white leading-none">{fmtPct(roi)}</p>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10 flex items-center justify-between">
          <p className="text-[10px] text-white/35 tracking-wide">
            Calculated on clublesscollective.com
          </p>
          <p className="text-[10px] text-white/25">
            Viability {viabilityScore}/100
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="default"
          size="sm"
          className="flex-1 gap-2"
          onClick={handleShare}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Link copied!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              Share
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-2"
          onClick={handleDownload}
        >
          <Download className="w-4 h-4" />
          Download Card
        </Button>
      </div>
    </div>
  );
}
