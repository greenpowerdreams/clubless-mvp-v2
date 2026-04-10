# Press Pitch — GeekWire

**Target:** Taylor Soper, Kurt Schlosser, or the startup desk
**Email:** tips@geekwire.com
**Angle:** Tech/startup — solo founder, bootstrapped, unbundling a consumer category, potentially interesting exit to Dempsey Startup Competition or similar.
**Best days:** Monday or Tuesday morning.

---

## Subject Line

Solo Seattle founder launches "unbundled nightclub" platform — bootstrapped, 22K LOC, 4 months

## Email Body

Hi GeekWire team,

I'm Drew Green, a Seattle-based solo founder. I just launched Clubless Collective — a bootstrapped, Seattle-built platform that turns the traditional nightclub into a stack of services creators can buy individually: ticketing, licensed mobile bar, vendor marketplace, and profit tools.

Quick numbers for context:

- **Built solo** in 4 months (nights + weekends)
- **~22,000 lines of code**, 38 pages, React + TypeScript + Supabase + Stripe Connect
- **Bootstrapped** (no outside capital to date)
- **Monthly infra cost:** <$50 (Supabase + Vercel + Plausible)
- **Pricing:** 8-10% platform fee, no subscription, no upfront cost
- **Differentiator:** Only platform in the market that bundles a licensed mobile bar service (WSLCB-compliant) with ticketing + vendor tools
- **Market:** Seattle first, then Puget Sound, then select Western US cities once the software side is proven

Why I think this is a GeekWire story:

1. **Solo bootstrapped founder, real product.** No 8-person team, no pre-seed round — just 4 months of shipping and a live product with real users.
2. **Unbundling a category.** The same pattern that hit banking, ground transportation, and lodging is now hitting nightlife — and no one's built the software stack for it yet.
3. **Physical + digital.** Most "marketplace for X" startups avoid owning operations. Clubless owns the mobile bar directly because it's the moat. That's a less common go-to-market in SaaS right now.
4. **Seattle story.** Built here, for here, by someone who's been in the scene.

Tech notes your readers might care about:

- Stack: Vite + React 18 + TypeScript + Tailwind/shadcn + Supabase (Postgres + RLS + Edge Functions) + Stripe Connect, deployed on Vercel
- Every table has row-level security; no service-role keys in client code
- QR tickets are signed JWTs verified atomically at check-in
- Ticketing + mobile bar revenue are cross-sold but operationally independent

I'd welcome a 15-minute call or a quick email Q&A. Happy to share source architecture, go-to-market detail, or put you in touch with the first creators using it.

Thanks for considering,

Drew Green
Founder, Clubless Collective
andrew@clublesscollective.com
clublesscollective.com
@clublesscollective

---

## One-Pager Attachment Content (optional)

**Clubless Collective at a glance**
- Launched: [date]
- Stage: Bootstrapped, live
- Location: Seattle, WA
- Team: Drew Green (solo founder, engineering + ops)
- Stack: React + TypeScript + Supabase + Stripe Connect + Vercel
- Revenue model: 8-10% ticketing fee + mobile bar service margin
- Traction: [update with real numbers when available]
- Coverage: [update as it comes in]
