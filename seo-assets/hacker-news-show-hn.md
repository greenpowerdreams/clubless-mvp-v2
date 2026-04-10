# Hacker News "Show HN" Launch — Clubless Collective

## Title (80 chars max — HN is strict)

**Primary:**
Show HN: Clubless – An event operating system for people who don't own a venue

**Alternates (A/B if first doesn't land):**
- Show HN: Clubless – Ticketing + mobile bar + vendor marketplace for Seattle events
- Show HN: I built an "unbundled nightclub" platform for DJs and promoters

## URL
https://clublesscollective.com

## Post Body

Hi HN,

I'm Drew. I built Clubless Collective because after watching Seattle friends throw events for a few years, I realized the traditional nightclub model is terrible for creators. Venues take 20% of the bar and a room fee. Ticketing platforms take another 10-20%. DJs split what's left. Everyone works hard; nobody makes much.

So I unbundled the nightclub into software:

- **Ticketing** at 8-10% via Stripe Connect (instant payouts)
- **Licensed mobile bar service** (WSLCB-compliant, we run it)
- **Vendor marketplace** (DJs, photographers, rentals)
- **Profit calculator** to model an event before you commit
- **Event pages** with QR tickets + check-in
- **/what-is-clubless** explainer for the broader pitch

Tech stack: React 18 + Vite + TypeScript + Supabase (Postgres + RLS + Edge Functions) + Stripe Connect + Tailwind/shadcn. Deployed on Vercel. About 22k lines across 38 pages, single maintainer, ~4 months build time.

A few technical things I'd be happy to talk about:

1. **Why no SSR (yet):** I used Vite SPA over Next.js because the app is auth-gated past the marketing pages, and the marketing pages I pre-built as static HTML with a `useSEO` hook that mutates head tags on route change. Lighthouse SEO scores 95+. I'll add SSG for event pages in phase 2.

2. **Row-Level Security:** Every Supabase table has RLS on. No service-role keys in the client. Admin routes gated via a `profiles.is_admin` column checked in a SECURITY DEFINER function.

3. **Stripe Connect onboarding:** Edge Function creates the account link, webhook updates the creator's `stripe_onboarding_complete` flag. Tickets only go live after onboarding succeeds.

4. **QR check-in:** Tickets are signed JWTs encoding event_id + ticket_id + a short nonce. Scan endpoint verifies signature + marks redeemed atomically with `SELECT FOR UPDATE`.

5. **The hardest part** was not the code — it was modeling events, ticket tiers, promo codes, Stripe payouts, and vendor roles in a way that lets a first-time DJ publish an event in under 5 minutes. That took 3 full rewrites.

Happy to answer anything about the tech, the business model, or why anyone would build this in 2026. Feedback welcome — the honest kind especially.

— Drew (andrew@clublesscollective.com)

## Response Templates (for common HN comments)

**"Why not just use Eventbrite?"**
Eventbrite is priced for established organizers with venues. Their fee is 3.7% + $1.79/ticket (plus payment processing on top — real all-in is 7-9%), and they don't include the mobile bar or the vendor marketplace. Clubless is priced for venue-free creators and bundles services, not just ticketing.

**"Seattle only?"**
For now, yes. Going deep on one city before going wide. The mobile bar is a physical business that's hard to scale nationally on day one. Once the software side is proven, we'll open a creator-only version (no bar) to other cities.

**"How does the mobile bar economics work?"**
We own the equipment, subcontract licensed bartenders per event, and charge a flat setup fee + per-head rate. Margins are tighter than ticketing but it's our differentiator — nobody else bundles a licensed bar with the platform.

**"Why not just build the bar business?"**
Because the bar business alone is a lifestyle business. The platform is the leverage — it's what makes the bar business defensible.

**"SPA + SEO is a bad idea."**
I went back and forth on this. For the marketing pages, `useSEO` + static HTML gets you 95+ Lighthouse and clean crawling because React Router doesn't need to hydrate for the initial HTML to render the meta tags (they're set before the app mounts on route change). Google renders JS now. That said — yes, I'll migrate event pages to SSG in phase 2 for richer schema + instant TTFB.

**"Legal risk?"**
The mobile bar is fully WSLCB-licensed + insured. Ticketing is Stripe Connect standard. We're not custodying funds. Biggest risk is probably ASCAP/BMI if organizers don't pay their music licensing — we warn in onboarding and link to the right forms.
