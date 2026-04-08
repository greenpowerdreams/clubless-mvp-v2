import QRCode from "react-qr-code";

interface TicketQRCodeProps {
  qrToken: string;
  size?: number;
}

const BASE_URL = "https://clublesscollective.com/ticket/verify";

export function TicketQRCode({ qrToken, size = 180 }: TicketQRCodeProps) {
  const url = `${BASE_URL}/${qrToken}`;
  return (
    <div className="bg-white p-3 rounded-lg inline-block">
      <QRCode value={url} size={size} level="M" />
    </div>
  );
}
