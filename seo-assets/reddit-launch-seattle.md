# Reddit Launch Posts — r/Seattle & adjacent

**Reddit golden rule:** Reddit hates marketing. Lead with value, be a real person, answer comments fast, and accept that you might get downvoted anyway. Never post the same copy to two subs on the same day.

---

## r/Seattle — "I built a thing" angle

**Title:** I built a free tool to help Seattle DJs and event creators host shows without losing half to the venue — would love feedback from people who actually throw events

**Body:**

Hey r/Seattle — longtime lurker, first time posting something I made.

Short version: I spent two years watching friends here throw events and get absolutely squeezed. Venues take a huge cut of the bar and a room fee, ticketing platforms take another chunk, and by the time you pay the DJ, the photographer, and the security, the host often walks away with less than the bartender.

So I built Clubless Collective — it's a free platform for people who want to throw events in Seattle without owning or renting a traditional club. Stuff like:

- A free event calculator so you can see if your night will actually make money before you commit
- Lower ticketing fees (8-10% vs the 15-20% most platforms charge)
- A licensed mobile bar service we run ourselves (so you can host in a warehouse, rooftop, loft, gallery, etc. without having to figure out the liquor side)
- A directory of local DJs, photographers, and vendors in one place
- A curated Seattle events feed (submit yours free — trying to be a better alternative to the scattered IG accounts and dying event sites)

It's live today at clublesscollective.com.

I'm not trying to be slick about this — I genuinely want feedback from people who have thrown events here or want to. What's missing? What's broken? What would make this useful to you vs. just another platform?

Also, if you've been to a good small-room event in Seattle recently, drop it below — I'd love to get more of them on the calendar.

---

## r/SeattleWA — "where are the good events" angle

**Title:** Seattle's nightlife feels scattered across 20 Instagram accounts — I built a calendar to fix it

**Body:**

Anyone else feel like finding a good event in Seattle means scrolling through 20 IG accounts, a dying newsletter, and word of mouth?

I got tired of it and built a curated Seattle nightlife calendar at clublesscollective.com/events. It pulls from DJs, promoters, venues, and small-room collectives — updated daily, no algorithm burying things, no paywall.

It's part of a bigger thing I'm building (an event platform for creators who don't own venues), but honestly the calendar alone might be the most useful piece for most of this sub. Free to use, free to submit events.

If you run or know about events that aren't on there, please tell me — I want the calendar to be genuinely complete, not just my friends' stuff.

And if it sucks, tell me that too.

---

## r/sideproject — founder story angle

**Title:** I spent 4 months building an "unbundled nightclub" platform as a solo founder — launching today

**Body:**

Hi r/sideproject,

I've been quietly building Clubless Collective for the past 4 months and it's live today: clublesscollective.com

The idea: traditional nightclubs are a bad deal for everyone who isn't the owner. Venues take 20% of the bar, ticketing platforms take 10-20%, and the DJ or promoter gets scraps. So I built a platform that unbundles the nightclub — ticketing, licensed mobile bar, vendor marketplace, profit calculator — and sells it to creators directly.

Built solo. Stack: React + Vite + TypeScript + Supabase + Stripe Connect + Tailwind. ~22k lines, 38 pages, Vercel deploy.

Hardest parts:
1. Modeling events/tickets/tiers/promos without making the UX a mess
2. Stripe Connect onboarding — the happy path is fine, the edge cases took 2 weeks
3. Resisting the urge to add features. I cut 60% of my original scope to actually ship.

Biggest lessons:
- Ship the marketing page first, not last. You need something to send people to while you build.
- RLS in Supabase is a gift. I never had to write an auth middleware.
- A profit calculator as a free tool is better marketing than any blog post.

Would love feedback on anything — the landing page, the pricing, the pitch, the code decisions. Roast me.

---

## r/Entrepreneur — how I bootstrapped angle

**Title:** Bootstrapped a venue-free event platform to launch in 4 months — here's the exact stack and what I cut

**Body:**

Just launched Clubless Collective (clublesscollective.com) — a ticketing + mobile bar + vendor marketplace for event creators who don't own venues. Bootstrapped, solo, 4 months of nights/weekends.

Quick breakdown for anyone building something similar:

**Stack:** React + Vite + TypeScript + Supabase + Stripe Connect + Tailwind/shadcn + Vercel. Monthly infra cost: <$50.

**What I cut to ship:**
- Referral system (phase 2)
- SMS marketing (phase 2)
- Apple/Google Wallet passes (phase 2)
- Mobile app (probably never — PWA is fine)
- AI event recommendations (nice-to-have, not a launch blocker)

**What I kept:**
- Full ticketing with promo codes, tiers, instant payouts
- Licensed mobile bar service (our differentiator)
- Curated event calendar
- Creator profit calculator
- Admin dashboard
- QR check-in

**Pricing:** 8-10% platform fee per ticket sold. No monthly sub. No upfront cost. You pay when you earn.

**Go-to-market:** Deliberate single-city launch (Seattle). Going deep before wide. Mobile bar is a local physical business so scaling nationally on day 1 isn't viable — the software can scale later without the bar.

Happy to answer anything about bootstrapping solo, the Supabase + Stripe Connect combo, or the decision to bundle a physical service (bar) with software.

---

## Comment Reply Templates

**"How is this different from Posh?"**
Posh is great for college-town ticketing at a similar fee. Clubless bundles the mobile bar + vendor marketplace + calculator, so it's more like "the whole stack for a venue-free event" vs. just ticketing. Also we're Seattle-first — deep local relationships matter more than national scale for the early creators we serve.

**"What's your fee?"**
8-10% platform fee, no monthly cost, no upfront cost. You keep the rest. Stripe processing fees are on top, same as any other platform.

**"Is the mobile bar legit?"**
100%. Fully WSLCB-licensed and insured. We run it ourselves, not a marketplace of random bartenders.

**"Are you the only person behind this?"**
Yes, solo so far. Planning to hire a community/ops lead after launch once traction is real. Also working with a few contractors for design + bar ops.
