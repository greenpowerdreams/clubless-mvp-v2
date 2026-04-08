import QRCode from "react-qr-code";

interface TicketQRCodeProps {
  qrToken: string;
  size?: number;
}

export function TicketQRCode({ qrToken, size = 180 }: TicketQRCodeProps) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://clublesscollective.com";
  const url = `${origin}/ticket/verify/${qrToken}`;
  return (
    <div className="bg-white p-3 rounded-lg inline-block">
      <QRCode value={url} size={size} level="M" />
    </div>
  );
}
