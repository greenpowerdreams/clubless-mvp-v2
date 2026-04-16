import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SITE_URL = "https://clublesscollective.com";

// Static marketing pages
const staticPages = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/events", changefreq: "daily", priority: "0.9" },
  { path: "/how-it-works", changefreq: "weekly", priority: "0.8" },
  { path: "/pricing", changefreq: "weekly", priority: "0.8" },
  { path: "/calculator", changefreq: "weekly", priority: "0.8" },
  { path: "/bar-service", changefreq: "weekly", priority: "0.8" },
  { path: "/what-is-clubless", changefreq: "monthly", priority: "0.8" },
  { path: "/vendors", changefreq: "weekly", priority: "0.7" },
  { path: "/vendor/apply", changefreq: "monthly", priority: "0.7" },
  { path: "/faq", changefreq: "monthly", priority: "0.7" },
  { path: "/creators", changefreq: "weekly", priority: "0.6" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
];

interface EventRow {
  id: string;
  slug: string | null;
  updated_at: string | null;
  start_at: string | null;
}

async function fetchPublishedEvents(): Promise<EventRow[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/events?select=id,slug,updated_at,start_at&status=in.(published,live,approved)&order=start_at.desc&limit=500`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!res.ok) return [];
    return (await res.json()) as EventRow[];
  } catch {
    return [];
  }
}

async function fetchVendors(): Promise<{ id: string; updated_at: string | null }[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/vendors?select=id,updated_at&verification_status=eq.verified&limit=200`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function toW3CDate(dateStr: string | null): string {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const [events, vendors] = await Promise.all([
    fetchPublishedEvents(),
    fetchVendors(),
  ]);

  const urls: string[] = [];

  // Static pages
  for (const page of staticPages) {
    urls.push(`  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }

  // Event pages (vanity slug or UUID)
  for (const event of events) {
    const path = event.slug ? `/e/${escapeXml(event.slug)}` : `/events/${event.id}`;
    const lastmod = toW3CDate(event.updated_at || event.start_at);
    urls.push(`  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  // Vendor pages
  for (const vendor of vendors) {
    const lastmod = toW3CDate(vendor.updated_at);
    urls.push(`  <url>
    <loc>${SITE_URL}/vendors/${vendor.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(xml);
}
