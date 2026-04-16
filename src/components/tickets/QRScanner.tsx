import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, SwitchCamera } from "lucide-react";

interface QRScannerProps {
  /** Called with the raw decoded text when a QR is scanned */
  onScan: (decodedText: string) => void;
  /** Pause scanning (e.g. while processing the last scan) */
  paused?: boolean;
}

/**
 * Camera-based QR scanner for door staff check-in.
 * Uses the phone's rear camera by default, with a switch button.
 * Extracts the QR token from the encoded URL automatically.
 */
export function QRScanner({ onScan, paused = false }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const lastScanRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  const SCAN_COOLDOWN_MS = 2000; // Prevent rapid re-fires on same QR

  const extractToken = useCallback((text: string): string => {
    // QR encodes a URL like: https://clublesscollective.com/ticket/verify/c4e618c0-...
    // Extract the UUID token from the end
    const match = text.match(/\/ticket\/verify\/([a-f0-9-]{36})/i);
    if (match) return match[1];
    // If it's already a bare UUID, return as-is
    const uuidMatch = text.match(/^[a-f0-9-]{36}$/i);
    if (uuidMatch) return text;
    // Return raw text as fallback
    return text;
  }, []);

  const startScanner = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      setError(null);
      const scanner = new Html5Qrcode("qr-scanner-container");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (paused) return;

          const now = Date.now();
          const token = extractToken(decodedText);

          // Debounce: skip if same QR scanned within cooldown
          if (token === lastScanRef.current && now - lastScanTimeRef.current < SCAN_COOLDOWN_MS) {
            return;
          }

          lastScanRef.current = token;
          lastScanTimeRef.current = now;
          onScan(token);
        },
        () => {
          // QR scan error (no QR found in frame) — ignore, this fires constantly
        }
      );

      setIsScanning(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
        setError("Camera permission denied. Please allow camera access and try again.");
      } else if (msg.includes("NotFoundError")) {
        setError("No camera found on this device.");
      } else {
        setError(`Camera error: ${msg}`);
      }
      setIsScanning(false);
    }
  }, [facingMode, onScan, paused, extractToken]);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        const state = scanner.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await scanner.stop();
        }
      } catch {
        // Ignore stop errors
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const toggleCamera = useCallback(async () => {
    await stopScanner();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, [stopScanner]);

  // Restart scanner when facingMode changes
  useEffect(() => {
    if (isScanning || !containerRef.current) return;
    // Small delay to let DOM settle after stop
    const timer = setTimeout(() => {
      startScanner();
    }, 300);
    return () => clearTimeout(timer);
  }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Camera viewfinder */}
      <div
        className="relative w-full max-w-[320px] aspect-square rounded-xl overflow-hidden bg-black/90 border-2 border-border"
      >
        <div id="qr-scanner-container" ref={containerRef} className="w-full h-full" />

        {!isScanning && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Camera className="w-12 h-12 text-muted-foreground" />
            <Button onClick={startScanner} variant="secondary" size="sm">
              Start Camera
            </Button>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <CameraOff className="w-12 h-12 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
            <Button onClick={startScanner} variant="secondary" size="sm">
              Retry
            </Button>
          </div>
        )}

        {paused && isScanning && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <p className="text-white font-medium animate-pulse">Processing...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      {isScanning && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleCamera}>
            <SwitchCamera className="w-4 h-4 mr-1" />
            Flip Camera
          </Button>
          <Button variant="outline" size="sm" onClick={stopScanner}>
            <CameraOff className="w-4 h-4 mr-1" />
            Stop
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center max-w-[280px]">
        Point camera at the attendee's QR code. Each ticket can only be scanned once.
      </p>
    </div>
  );
}
