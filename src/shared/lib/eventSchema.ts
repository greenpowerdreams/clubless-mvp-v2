// Schema.org Event JSON-LD generator
// Used by EventDetail page to inject structured data for Google rich results

const SITE_URL = "https://clublesscollective.com";

interface EventTicket {
  id: string;
  name: string;
  price_cents: number;
  qty_total: number;
  qty_sold: number;
  active: boolean;
}

interface EventLike {
  id: string;
  title: string;
  description: string | null;
  city: string;
  address?: string | null;
  start_at: string;
  end_at: string;
  cover_image_url: string | null;
  status: string;
  tickets?: EventTicket[];
}

export function buildEventSchema(event: EventLike) {
  const url = `${SITE_URL}/events/${event.id}`;
  const image = event.cover_image_url
    ? event.cover_image_url.startsWith("http")
      ? event.cover_image_url
      : `${SITE_URL}${event.cover_image_url}`
    : `${SITE_URL}/og-image.png`;

  const offers = (event.tickets || [])
    .filter((t) => t.active)
    .map((t) => ({
      "@type": "Offer",
      name: t.name,
      price: (t.price_cents / 100).toFixed(2),
      priceCurrency: "USD",
      availability:
        t.qty_sold >= t.qty_total
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
      url,
      validFrom: event.start_at,
    }));

  const eventStatus =
    event.status === "cancelled"
      ? "https://schema.org/EventCancelled"
      : event.status === "completed"
      ? "https://schema.org/EventCompleted"
      : "https://schema.org/EventScheduled";

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description || `${event.title} — a Clubless Collective event in ${event.city}.`,
    startDate: event.start_at,
    endDate: event.end_at,
    eventStatus,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: [image],
    url,
    location: {
      "@type": "Place",
      name: event.address || event.city,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.address || undefined,
        addressLocality: event.city,
        addressRegion: "WA",
        addressCountry: "US",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Clubless Collective",
      url: SITE_URL,
    },
    offers: offers.length > 0 ? offers : undefined,
  };
}
