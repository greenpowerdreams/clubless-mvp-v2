# UGC + Hashtag Strategy — Clubless Collective

**Goal:** Build a trackable hashtag ladder for branded discovery, generate user-generated content from the first 100 events, and feed that content back into the SEO engine as social proof.

---

## Branded Hashtags (use every post, own them outright)

**Primary:** `#clublesscollective`
**Secondary:** `#clubless`
**Campaign:** `#hostedwithclubless`

**How to own them:** Use every single post from @clublesscollective. Ask every creator to tag `#hostedwithclubless` when posting event recaps. Within 90 days, the branded tag pages should show only Clubless content.

---

## Hashtag Ladder (per post, mix 3 tiers)

**Tier 1 — Small (under 50k posts, easy to rank):**
- #seattledjs
- #seattlewarehouse
- #pnwnightlife
- #seattleevents
- #seattlecollective
- #seattleunderground
- #capitolhillseattle
- #sodoseattle
- #seattlepopup

**Tier 2 — Medium (50k-500k):**
- #seattle
- #seattlemusic
- #pnwmusic
- #seattlenightlife
- #pacificnorthwest
- #seattlelife
- #seattlefood (for bar service angle)
- #eventplanner
- #mobilebar

**Tier 3 — Large (500k+, discoverability play):**
- #nightlife
- #dj
- #events
- #electronicmusic
- #housemusic
- #partyplanner

**Per-post mix:** 4 Tier 1 + 4 Tier 2 + 2 Tier 3 + 2 branded = 12 total. Never exceed 15.

---

## UGC Campaign — "Hosted with Clubless"

**The ask:** Every creator who throws an event on Clubless gets a post-event DM with:
1. A thank-you
2. 3 candid event photos we took / they submitted
3. A pre-written caption they can copy
4. Request to post the Reel or carousel within 7 days using `#hostedwithclubless`

**Incentive:** Top 3 `#hostedwithclubless` posts each month get featured on @clublesscollective (story + grid) AND on the creator directory at clublesscollective.com/creators. Exposure to our whole audience is the reward.

**Caption template for creators:**

> [their opening line]
>
> thanks to @clublesscollective for making [event name] happen. licensed bar, ticketing, and the whole setup handled so we could just throw the night.
>
> if you're thinking about throwing your own event in seattle — they have a free profit calculator and will set you up: clublesscollective.com
>
> #hostedwithclubless #clublesscollective

---

## Story Sticker Campaign — "Throwing your first event?"

Create IG story stickers (custom GIFs via Giphy brand channel):
- "HOSTED WITH CLUBLESS" badge
- "LICENSED BAR" badge
- "8-10% FEE" badge

Every creator using the sticker = free reach + branded impression. Giphy brand channels require 5-10 GIFs minimum to approve.

---

## User-Submitted Event Photos → Landing Page Rotation

Build a small `submittedPhotos` table in Supabase that collects photos from `/submit-photo` form (no auth — just event name + uploader handle + photo + optional quote). Rotate the best 12 on the homepage `<TestimonialSection />` component.

**Benefits:**
- Authentic social proof
- Organic content engine that grows with usage
- New content on the homepage = Google treats site as fresh = ranking boost

---

## IG Reel Content Calendar (first 30 days, 3/week = 12 Reels)

| # | Format | Hook | Purpose |
|---|--------|------|---------|
| 1 | Launch Reel | "Seattle — it's live" | Launch day |
| 2 | Founder story | "Why I built Clubless" | Build trust |
| 3 | Mobile bar demo | "Your bar setup in 60 seconds" | Service awareness |
| 4 | Creator testimonial | First creator interview | Social proof |
| 5 | Profit calculator walkthrough | "Will your next event make money?" | Tool traffic |
| 6 | Behind-the-scenes event setup | Day-in-the-life | Authenticity |
| 7 | "Hosted with Clubless" #1 | First UGC repost | Campaign kickoff |
| 8 | Venue tour | Inside a Clubless partner space | Venue marketing |
| 9 | "How we vet vendors" | Process reveal | Trust build |
| 10 | Creator testimonial #2 | Second interview | Social proof |
| 11 | Data drop | "30 days of Clubless in numbers" | Transparency/buzz |
| 12 | Month 1 recap | Thank-you + next | Community |

---

## TikTok Strategy

Cross-post all Reels to TikTok. Native TikTok content: POV videos from events ("when you throw your first warehouse event and it actually works"), founder diary clips, and trend-jacks tied to nightlife / small business.

**Tags for TikTok:** `#seattle #pnw #dj #nightlife #smallbusiness #bootstrapped #founder #fyp`

---

## Measurement

Track weekly:
- Branded hashtag reach (`#clublesscollective`, `#hostedwithclubless`)
- IG follower count
- IG → website click-throughs (Plausible "Source: Instagram")
- UGC submissions per week
- Top-performing Reel format

Adjust content mix based on what drives clicks to `clublesscollective.com`, not what gets likes.
