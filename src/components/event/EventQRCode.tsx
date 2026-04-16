import { useCallback, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QrCode, Download, Copy, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EventQRCodeProps {
  /** Full URL to encode, e.g. https://clublesscollective.com/e/helios-party */
  url: string;
  /** Event title — used as the download filename and share text */
  title: string;
  /** Render as icon button (compact) or full button with text */
  variant?: "icon" | "button";
}

export function EventQRCode({ url, title, variant = "button" }: EventQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Generate QR when dialog opens and canvas is mounted
  const generateQR = useCallback(
    (node: HTMLCanvasElement | null) => {
      if (!node) return;
      (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = node;
      QRCode.toCanvas(node, url, {
        width: 280,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      })
        .then(() => {
          setDataUrl(node.toDataURL("image/png"));
        })
        .catch(() => {
          // Fallback: generate as data URL directly
          QRCode.toDataURL(url, { width: 280, margin: 2 }).then(setDataUrl);
        });
    },
    [url],
  );

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}_qr.png`;
    a.click();
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url);
    toast({ title: "Link copied!" });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Check out ${title} on Clubless`,
          url,
        });
      } catch {
        // User cancelled — that's fine
      }
    } else {
      await handleCopyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "icon" ? (
          <Button variant="ghost" size="icon" className="h-8 w-8" title="QR Code">
            <QrCode className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <QrCode className="w-4 h-4 mr-2" />
            QR Code
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Share Event</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-xl shadow-sm">
            {open && <canvas ref={generateQR} />}
          </div>

          {/* URL display */}
          <p className="text-xs text-muted-foreground text-center max-w-[280px] truncate">
            {url}
          </p>

          {/* Action buttons — mobile-optimized grid */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-[280px]">
            <Button
              variant="outline"
              size="sm"
              className="flex flex-col items-center gap-1 h-auto py-3"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
              <span className="text-xs">Share</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex flex-col items-center gap-1 h-auto py-3"
              onClick={handleCopyLink}
            >
              <Copy className="w-4 h-4" />
              <span className="text-xs">Copy Link</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex flex-col items-center gap-1 h-auto py-3"
              onClick={handleDownload}
              disabled={!dataUrl}
            >
              <Download className="w-4 h-4" />
              <span className="text-xs">Save QR</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
