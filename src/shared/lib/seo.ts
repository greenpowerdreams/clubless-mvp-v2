// SEO utilities — update document head dynamically per page

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const DEFAULT_TITLE = "Clubless | The Nightlife Operating System";
const DEFAULT_DESCRIPTION =
  "Event discovery, hosting tools, DJ scheduling, and collaboration for creators, DJs, venues, and fans.";

export function updateSEO({ title, description, image, url, type }: SEOProps) {
  const fullTitle = title ? `${title} | Clubless` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESCRIPTION;

  document.title = fullTitle;

  // Update or create meta tags
  setMeta("description", desc);
  setMeta("og:title", fullTitle, "property");
  setMeta("og:description", desc, "property");
  setMeta("twitter:title", fullTitle);
  setMeta("twitter:description", desc);

  if (image) {
    setMeta("og:image", image, "property");
    setMeta("twitter:image", image);
  }

  if (url) {
    setMeta("og:url", url, "property");
  }

  if (type) {
    setMeta("og:type", type, "property");
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
