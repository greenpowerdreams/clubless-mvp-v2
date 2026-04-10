// SEO utilities — update document head dynamically per page

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  canonical?: string;
  robots?: string;
  keywords?: string;
}

const DEFAULT_TITLE =
  "Clubless Collective | Seattle Nightlife & Event Operating System";
const DEFAULT_DESCRIPTION =
  "Clubless Collective empowers event creators to host profitable nightlife events in Seattle. Licensed mobile bar service, ticketing, vendors, and creator tools — no venue required.";
const SITE_URL = "https://clublesscollective.com";

export function updateSEO({
  title,
  description,
  image,
  url,
  type,
  canonical,
  robots,
  keywords,
}: SEOProps) {
  const fullTitle = title || DEFAULT_TITLE;
  const desc = description || DEFAULT_DESCRIPTION;

  document.title = fullTitle;

  setMeta("description", desc);
  setMeta("og:title", fullTitle, "property");
  setMeta("og:description", desc, "property");
  setMeta("twitter:title", fullTitle);
  setMeta("twitter:description", desc);

  if (image) {
    const absImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;
    setMeta("og:image", absImage, "property");
    setMeta("twitter:image", absImage);
  }

  // Compute the absolute URL for og:url and canonical
  const path = url || (typeof window !== "undefined" ? window.location.pathname : "/");
  const absUrl = path.startsWith("http") ? path : `${SITE_URL}${path}`;
  setMeta("og:url", absUrl, "property");

  // Canonical link
  setCanonical(canonical ? (canonical.startsWith("http") ? canonical : `${SITE_URL}${canonical}`) : absUrl);

  if (type) {
    setMeta("og:type", type, "property");
  }

  if (robots) {
    setMeta("robots", robots);
  } else {
    // Default for public pages: index, follow
    setMeta("robots", "index,follow");
  }

  if (keywords) {
    setMeta("keywords", keywords);
  }
}

export function resetSEO() {
  document.title = DEFAULT_TITLE;
  setMeta("description", DEFAULT_DESCRIPTION);
  setMeta("og:title", DEFAULT_TITLE, "property");
  setMeta("og:description", DEFAULT_DESCRIPTION, "property");
}

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (el) {
    el.content = content;
  } else {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    el.content = content;
    document.head.appendChild(el);
  }
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (el) {
    el.href = href;
  } else {
    el = document.createElement("link");
    el.rel = "canonical";
    el.href = href;
    document.head.appendChild(el);
  }
}
