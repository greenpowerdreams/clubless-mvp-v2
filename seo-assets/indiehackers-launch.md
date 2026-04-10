# IndieHackers Launch Post — Clubless Collective

## Title
I bootstrapped an "unbundled nightclub" platform in 4 months — launching today

## Body

Hey IH 👋

Today I'm launching Clubless Collective — a ticketing + licensed mobile bar + vendor marketplace for event creators who don't own venues. It's live at clublesscollective.com.

**The problem**
Traditional nightclubs are brutal for everyone except the owner. Venues take 20% of the bar and a room fee. Ticketing platforms take 10-20%. By the time the DJ, photographer, and security are paid, the host walks away with less than the bartender.

Meanwhile, the best events in Seattle right now aren't happening in traditional clubs — they're in warehouses, rooftops, lofts, galleries. Creators have moved. The tools haven't.

**The solution**
Clubless unbundles the nightclub:
- Ticketing at 8-10% (vs 10-20% on Posh, Eventbrite, Dice)
- Licensed mobile bar service we run ourselves (WSLCB-compliant)
- Vendor marketplace for DJs, photographers, rentals
- Free profit calculator
- Curated Seattle event calendar
- QR check-in + instant Stripe payouts

**The build**
- Solo founder, 4 months nights + weekends
- ~22,000 lines of code, 38 pages
- Stack: React + Vite + TypeScript + Supabase + Stripe Connect + Tailwind/shadcn
- Deployed on Vercel
- Monthly infra cost: <$50
- Every table has RLS, no service-role keys in client, QR tickets are signed JWTs

**The business model**
- 8-10% platform fee per ticket sold
- Mobile bar service margin (separate revenue stream)
- No monthly SaaS sub, no upfront cost
- Seattle first, then Puget Sound, then select cities

**What I cut to ship**
- Referral system
- SMS marketing
- Wallet passes
- Mobile app (PWA is fine)
- AI recommendations

**What I kept**
- Full ticketing with tiers + promos
- Licensed mobile bar
- Vendor marketplace
- Calculator
- Admin dashboard
- QR check-in

**Biggest lessons**
1. **Ship the marketing page first, not last.** I wish I'd had a landing page on day 1. I built one in week 10 and regretted the 10-week delay.
2. **Supabase RLS is a gift.** I never wrote auth middleware. The database enforces everything.
3. **A free calculator is better marketing than a blog.** The profit calculator converts 5x better than anything else on the site.
4. **Cut 60% of your scope.** I did, and still cut more at the end. You can always add later. You can't un-ship.

**What I'd love feedback on**
- The landing page
- The pricing page
- The pitch to DJs (not to investors — the actual users)
- Whether the mobile bar bundling is a moat or a distraction

Happy to answer anything. Will be in the comments all day.

— Drew

## Milestones to Post (one per week for first 8 weeks)

1. Week 1 — First paying customer
2. Week 2 — First 100 signups
3. Week 3 — First $1k in ticketing processed
4. Week 4 — First press mention
5. Week 5 — First month complete — revenue, signups, lessons
6. Week 6 — First mobile bar booking
7. Week 7 — First vendor onboarded
8. Week 8 — Reached [goal number] active creators
