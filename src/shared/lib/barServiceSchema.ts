// Schema.org JSON-LD generators for /bar-service
// Used to enable FAQ rich snippets and LocalBusiness Map Pack signals

const SITE_URL = "https://clublesscollective.com";

const SERVICE_AREA_CITIES = [
  "Seattle",
  "Bellevue",
  "Kirkland",
  "Redmond",
  "Tacoma",
  "Issaquah",
  "Renton",
  "Everett",
  "Lynnwood",
  "Bothell",
  "Mercer Island",
  "Sammamish",
  "Shoreline",
  "Kenmore",
];

interface FAQ {
  q: string;
  a: string;
}

export function buildBarServiceFAQSchema(faqs: FAQ[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };
}

export function buildBarServiceLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    "@id": `${SITE_URL}/bar-service#business`,
    name: "Clubless Collective Mobile Bar Service",
    alternateName: "Clubless Bar Service",
    description:
      "Washington State licensed mobile bar service for private events in the greater Seattle area. MAST-certified bartenders, full setup, and license coverage for weddings, corporate parties, birthdays, and pop-ups.",
    url: `${SITE_URL}/bar-service`,
    image: `${SITE_URL}/og-image.png`,
    telephone: undefined,
    priceRange: "$499–$2500+",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Seattle",
      addressRegion: "WA",
      addressCountry: "US",
    },
    areaServed: SERVICE_AREA_CITIES.map((city) => ({
      "@type": "City",
      name: city,
    })),
    serviceType: [
      "Mobile Bar Service",
      "Bartender for Hire",
      "Wedding Bartender",
      "Corporate Event Bartending",
      "Private Party Bartending",
      "Licensed Bartender Service",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Bar Service Packages",
      itemListElement: [
        {
          "@type": "Offer",
          name: "The Essentials",
          description:
            "Up to 50 guests, 4-hour minimum. 1 MAST-certified bartender, bar setup and teardown, license coverage.",
          price: "499",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: "The Standard",
          description:
            "50 to 150 guests, up to 6 hours. 1 to 2 MAST-certified bartenders, full bar setup and teardown, license coverage, cocktail menu consult.",
          price: "950",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: "The Full Night",
          description:
            "150+ guests, custom duration. Full bartender staffing, custom cocktail menu design, full bar setup and teardown, license coverage.",
        },
      ],
    },
    sameAs: [
      "https://instagram.com/clublesscollective",
      "https://twitter.com/clublesscollective",
    ],
  };
}

export const BAR_SERVICE_AREA_CITIES = SERVICE_AREA_CITIES;
