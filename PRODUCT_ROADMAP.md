# Clubless Collective -- Product Roadmap for Investor Readiness

**Date:** April 7, 2026
**Prepared by:** CPO Analysis (Claude)
**Codebase location:** `/Users/drewgreen/clawbot/clublesscollective/`

---

## 1. CURRENT STATE AUDIT

### 1.1 What Is Actually Built (35 pages, 11 feature modules, 12 Edge Functions)

| Area | Status | Depth | Notes |
|------|--------|-------|-------|
| **Landing Page (Index)** | FUNCTIONAL | Deep | Hero, event type cards, value props, bar service CTA, vendor marketplace preview. Polished and mobile-responsive. |
| **Revenue Calculator** | FUNCTIONAL | Deep | 1,700-line component. Multi-event-type (nightlife, wedding, corporate, birthday). Cost line items, fee model toggle (service-fee vs profit-share), staffing estimates. Links directly to Submit flow. |
| **Event Submission (Submit)** | FUNCTIONAL | Deep | Zod validation, auth-gated, Supabase Edge Function (`submit-proposal`), pre-fills from calculator, event type picker. Full proposal flow. |
| **Events Browse** | FUNCTIONAL | Deep | Dual-source: curated Seattle events (separate Supabase project) + platform events. Time-range filter, date grouping, external ticket links. |
| **Event Detail + Ticketing** | FUNCTIONAL | Deep | Ticket tier selector with quantity controls, Stripe Checkout integration via `create-ticket-checkout` Edge Function, rate limiting (Deno KV), auth-gated purchase. Save/share buttons. Attendee count. |
| **Checkout Flow** | FUNCTIONAL | Moderate | `create-ticket-checkout` Edge Function creates Stripe Checkout sessions. `verify-payment` webhook handles completion. Success/Cancel pages exist. |
| **My Tickets (QR)** | FUNCTIONAL | Moderate | Fetches `ticket_instances` with QR codes. Upcoming/past tabs. QR code component renders scannable codes. |
| **Event Check-in** | FUNCTIONAL | Deep | QR scan, manual check-in, real-time stats (via Supabase realtime), search attendees, progress bar. Creator-only authorization. |
| **Event Analytics** | FUNCTIONAL | Moderate | Revenue, earnings, tickets sold, check-in rate. Orders table with per-order creator share. Creator-only access. |
| **Creator Dashboard** | FUNCTIONAL | Deep | 7 tabs: Overview, Events, Schedule, Proposals, Team, Revenue, Analytics. User level system, stats, help banner. |
| **Vendor Marketplace** | FUNCTIONAL | Moderate | Search, category filter (18 categories), event-type scoping, city filter, verified badges, service listings with pricing. Links to vendor detail. |
| **Vendor Dashboard** | FUNCTIONAL | Moderate | Registration flow, service CRUD, quote management (receive/respond), profile view. Stats cards. |
| **Vendor Apply** | FUNCTIONAL | Basic | Public application page for vendors. |
| **Bar Service** | FUNCTIONAL | Moderate | Dedicated landing page for licensed bar service (WA State liquor + catering license). Booking inquiry form. |
| **Auth System** | FUNCTIONAL | Deep | Supabase Auth with signup/login/forgot/reset. AuthProvider context, ProtectedRoute wrapper. Session persistence. |
| **Profiles** | FUNCTIONAL | Moderate | Creator profiles with public URLs (`/u/:handle`), creator directory, profile settings page. |
| **Community / Connections** | FUNCTIONAL | Moderate | User search, send/accept/decline connection requests, connections list. Social networking layer. |
| **Scheduling / Bookings** | FUNCTIONAL | Moderate | DJ/performer scheduling (gig, residency, open slots). Booking requests with rate negotiation. Dashboard tab. |
| **Collaboration / Team** | FUNCTIONAL | Basic | Team management tab in dashboard. Types defined but UI is lightweight. |
| **Payment Settings** | PARTIALLY BUILT | Shallow | UI for Stripe Connect onboarding exists. Calls `stripe-connect-onboard` Edge Function. **BUT: that Edge Function does NOT exist in the codebase.** The `process-payout` function exists but references Stripe Transfer API without Connect account routing. |
| **Pricing Page** | FUNCTIONAL | Basic | Static pricing information page. |
| **FAQ Page** | FUNCTIONAL | Basic | Static FAQ page. |
| **How It Works** | FUNCTIONAL | Basic | Static explainer page. |
| **Admin Dashboard** | FUNCTIONAL | Moderate | Admin auth, proposal management, event overview. |
| **PWA Install Prompt** | FUNCTIONAL | Basic | `InstallPrompt` component detects `beforeinstallprompt` event. No manifest file found in the public directory. |

### 1.2 Database Schema (36+ tables via 40 migrations)

Key tables confirmed: `events`, `tickets` (tier definitions), `ticket_instances` (individual tickets with QR), `orders`, `payouts`, `profiles`, `vendors`, `vendor_services`, `event_vendor_quotes`, `proposals`, `bookings`, `schedules`, `connections`, `notifications`, `event_saves`.

Schema alignment migration exists to bridge two naming conventions (production vs. Lovable-generated code), with sync triggers maintaining column aliases.

### 1.3 Edge Functions (12 total)

- `create-ticket-checkout` -- Stripe Checkout session creation with rate limiting
- `verify-payment` -- Stripe webhook handler
- `process-payout` -- Stripe Transfer for payouts
- `submit-proposal` -- Event proposal submission
- `send-email`, `send-status-email`, `send-ticket-email`, `send-welcome-email`, `send-waitlist-email`, `send-payout-notification` -- Email notifications
- `track-email-open` -- Email open tracking
- `cleanup-expired-reservations` -- Ticket reservation cleanup

---

## 2. GAP ANALYSIS: Business Plan vs. Reality

### 2.1 "Venue booking integration"
**STATUS: NOT BUILT.** The `features/venues/` directory exists but is empty. There is no venue database table, no venue search, no venue availability calendar, no venue booking flow. The business plan positions this as core to the "Expedia for events" value prop. This is the single largest feature gap.

### 2.2 "Vendor coordination"
**STATUS: PARTIALLY BUILT.** The vendor marketplace exists with search/filter, the vendor dashboard has service CRUD and quote management. However:
- No in-app messaging between host and vendor
- No contract/agreement flow
- No vendor payment integration (vendors cannot get paid through the platform)
- No vendor reviews/ratings (schema exists but no review submission UI)
- No vendor availability calendar
- No automated vendor matching/recommendations

### 2.3 "48-hour direct deposit"
**STATUS: NOT FUNCTIONAL.** The PaymentSettings page references `stripe-connect-onboard` Edge Function, but that function does not exist in the codebase. The `process-payout` function exists and uses Stripe Transfers, but there is no Connect onboarding to create connected accounts. The copy on the Payment Settings page says "3 days after event completion" (not 48 hours). This is a critical gap -- hosts cannot receive payouts today.

### 2.4 "Revenue calculator"
**STATUS: FULLY FUNCTIONAL.** 1,700 lines of calculator logic covering all 5 event types with different fee structures. This is one of the strongest features in the app. It feeds directly into the event submission flow.

### 2.5 "Guestlists"
**STATUS: NOT BUILT.** Zero references to guestlist anywhere in the codebase. No guestlist management, no RSVP flow, no comp ticket distribution. The check-in system exists but only works with purchased tickets.

### 2.6 "Event creation flow"
**STATUS: PROPOSAL ONLY.** The current flow is: Calculator -> Submit Proposal -> Admin Review -> (manual event creation). There is no self-service event creation with date picker, venue selection, ticket tier configuration, cover image upload, and event description editor. Hosts cannot publish events themselves. This is a major friction point.

### 2.7 "Mobile optimization"
**STATUS: MOSTLY GOOD.** Responsive CSS throughout with Tailwind breakpoints. Mobile-first layout patterns. PWA install prompt exists but no manifest.json was found in public/. Horizontal scroll for event type cards on mobile. The main gap is that the app uses touch-unfriendly quantity selectors (small +/- buttons) and lacks mobile-native gestures.

---

## 3. PHASED ROADMAP

---

### PHASE A: Investor Demo Ready (1-2 weeks)

Goal: Make the app look polished, complete, and functional during a live demo. Fix obvious holes and add demo-able features.

| # | Feature | Effort | Impact | Details |
|---|---------|--------|--------|---------|
| A1 | **Seed demo events + vendors** | S | 5 | Populate the database with 5-8 realistic Seattle events (with cover images, ticket tiers, descriptions) and 10-15 verified vendors. The Events page currently shows an empty state for platform events. An investor demo with "First Clubless event drops soon" is a dealbreaker. |
| A2 | **Fix Stripe Connect onboarding** | M | 5 | Create the missing `stripe-connect-onboard` Edge Function. Without this, the "keep your revenue" promise has no backend. This is a 1-day task for someone familiar with Stripe Connect Express. |
| A3 | **Add manifest.json for PWA** | S | 3 | Create proper `manifest.json` in `public/` with app name, icons, theme colors. Enables "Add to Home Screen" on mobile. Takes 30 minutes but signals technical polish. |
| A4 | **Landing page social proof section** | S | 4 | Add a section showing key metrics (even if modest): "X events hosted", "X vendors verified", "X tickets sold". Investors look for traction signals. Currently the landing page has zero social proof. |
| A5 | **Event detail page polish** | S | 3 | Add organizer info card, lineup/schedule section (even if static), and a map placeholder for the venue. Currently the event detail page is functional but sparse. |
| A6 | **Fix "48-hour" copy consistency** | S | 2 | Landing page says "48 hours", Payment Settings says "3 days". Align all copy to match the actual payout schedule. |
| A7 | **Loading states and error boundaries** | S | 3 | Several pages show "Loading..." as plain text. Add skeleton screens consistently. Add an error boundary so crashes show a retry screen instead of a white page. |
| A8 | **Mobile ticket purchase UX** | S | 3 | The ticket quantity selector uses tiny +/- buttons. On mobile, make the tap targets larger and add haptic-style visual feedback. |

**Phase A Total: ~12-16 dev-days**

---

### PHASE B: MVP Complete (1 month)

Goal: Fill the critical feature gaps so the platform works end-to-end: a host can create an event, sell tickets, coordinate vendors, and get paid. An attendee can discover, buy, and attend.

| # | Feature | Effort | Impact | Details |
|---|---------|--------|--------|---------|
| B1 | **Self-service event creation** | L | 5 | Replace the proposal-only flow with a full event creation wizard: title, description, date/time, location, cover image upload, ticket tier configuration, and publish. Keep proposal flow as an option for hosts who want hand-holding. This is the #1 feature gap. |
| B2 | **Venue directory + search** | L | 5 | Build the empty `features/venues/` module. Venue profiles with photos, capacity, amenities, pricing, availability calendar. Search by location/capacity/type. This is core to the "Expedia for events" positioning. Start with 20-30 curated Seattle venues. |
| B3 | **Guestlist management** | M | 4 | Event creators can create comp/RSVP lists, send invites, track RSVPs. Guestlist check-in at the door (extends existing check-in system). Promoters need this for nightlife. |
| B4 | **Vendor reviews + ratings** | M | 3 | Review submission UI after event completion. Display on vendor profiles. Schema already exists (`rating_avg`, `review_count` columns). Two-way reviews (host reviews vendor, vendor reviews host). |
| B5 | **Host-vendor in-app messaging** | M | 4 | Real-time chat between event host and booked vendors. Essential for coordination. Use Supabase Realtime channels. |
| B6 | **Payout dashboard for creators** | M | 4 | Show payout history, pending amounts, estimated next payout date. Connect to the Stripe Connect account. Currently the Revenue tab shows earnings but no actual payout status. |
| B7 | **Email notification system** | M | 3 | The Edge Functions exist but need to be wired to actual triggers: ticket purchase confirmation, event reminder (24hr before), payout notification, vendor quote received. Currently these functions exist but may not be triggered automatically. |
| B8 | **Attendee data export** | S | 3 | CSV download of attendee list (name, email, ticket type, check-in status). The landing page promises "You Own Your Fan Data" -- deliver on this. |
| B9 | **Event edit + management** | M | 4 | After creation, hosts need to edit event details, update ticket availability, change cover image, cancel/postpone. Currently no event edit capability exists. |
| B10 | **Promo codes / discounts** | M | 3 | Percentage or flat discount codes for ticket purchases. The `ticket_instances` migration hints at promo support but no UI exists. |

**Phase B Total: ~35-45 dev-days**

---

### PHASE C: Growth Features (2-3 months)

Goal: Features that drive network effects, retention, and organic growth. These differentiate Clubless from competitors and build the marketplace flywheel.

| # | Feature | Effort | Impact | Details |
|---|---------|--------|--------|---------|
| C1 | **Event discovery algorithm** | M | 5 | Personalized event recommendations based on past attendance, saved events, genre preferences, location. Currently the Events page is a chronological list with no personalization. |
| C2 | **Social sharing + referral system** | M | 4 | Shareable event cards with OG meta tags for social previews. Referral tracking ("Invited by X, get $5 off"). Viral loop for attendee acquisition. |
| C3 | **Recurring events** | M | 4 | Weekly/monthly recurring event templates. Critical for nightlife residencies and regular venue programming. |
| C4 | **Venue booking integration** | L | 5 | End-to-end venue booking: availability check, hold/confirm, contract generation, payment split. This completes the "Expedia for events" vision. |
| C5 | **Analytics dashboard (advanced)** | M | 3 | Sales velocity charts, ticket type breakdown, geographic heatmap of attendees, demographic insights, conversion funnel (page view -> ticket purchase). |
| C6 | **Waitlist / sold-out flow** | S | 3 | When tickets sell out, collect email waitlist. Notify if tickets become available (cancellations/returns). |
| C7 | **Multi-city expansion prep** | M | 3 | City selector in nav, city-specific landing pages, location-aware event filtering. Infrastructure for expanding beyond Seattle. |
| C8 | **Vendor marketplace payments** | L | 4 | Vendors get paid through the platform (Stripe Connect for vendors). Commission model. Invoice generation. |
| C9 | **Mobile app (React Native)** | L | 4 | Share the component library and API layer. Focus on ticket wallet, event discovery, and check-in scanning. |
| C10 | **API for venue/event integrations** | M | 3 | Public API for venues to sync availability, for promoters to embed ticket widgets, for event aggregators to pull listings. |
| C11 | **Creator loyalty tiers** | S | 2 | The `useUserLevel` hook already exists. Build out the tier benefits: lower fees at higher tiers, priority support, featured placement. |
| C12 | **Attendee profiles + social** | M | 3 | Attendee event history, followers/following, event activity feed. Build the "going" social signal. |

**Phase C Total: ~60-80 dev-days**

---

## 4. TOP 5 FEATURES BY STAKEHOLDER

### 4a. Investor Perception (what moves the needle in a pitch)

1. **Self-service event creation (B1)** -- "Can I create an event right now?" is the first investor question. The answer today is "submit a proposal and wait 48 hours." That kills momentum.
2. **Seed data with real events (A1)** -- An empty marketplace is the kiss of death for a demo. 5 live events with real cover images and ticket tiers shows traction.
3. **Stripe Connect payout flow (A2)** -- "Show me the money flow" is investor question #2. The backend payout infrastructure must work end-to-end.
4. **Venue directory (B2)** -- This is the "Expedia" differentiator. Without venues, the platform is "another Eventbrite." With venues, it is a marketplace.
5. **Social proof on landing page (A4)** -- Metrics, testimonials, or logos. Even early-stage numbers (50 events, 12 vendors, 500 tickets) signal real usage.

### 4b. Host Acquisition (what makes hosts choose Clubless over Eventbrite/Posh)

1. **Self-service event creation (B1)** -- Hosts will not submit a proposal and wait. They need to publish tonight's event in 10 minutes.
2. **Revenue calculator (already built)** -- This is the strongest host acquisition tool. "See what you keep" is a compelling pitch against Eventbrite's opaque fees.
3. **Guestlist management (B3)** -- Nightlife promoters live and die by guestlists. This is table stakes for the nightlife vertical.
4. **Venue search + booking (B2/C4)** -- "Find a venue, book vendors, sell tickets -- all in one place" is the complete value prop.
5. **Attendee data export (B8)** -- "You own your data" is a powerful differentiator. Hosts who feel locked into Eventbrite will switch for this alone.

### 4c. Attendee Experience (what makes attendees prefer buying on Clubless)

1. **Event discovery with personalization (C1)** -- "What should I do this weekend?" answered in 3 seconds.
2. **Mobile ticket wallet with QR (already built)** -- My Tickets page with scannable QR codes. Already functional.
3. **Social features (C12)** -- "See who's going", follow friends, activity feed. Makes Clubless sticky beyond ticket transactions.
4. **Event detail richness (A5)** -- Lineup, venue photos, map, organizer info. The current detail page is functional but sparse compared to competitors.
5. **Waitlist for sold-out events (C6)** -- Creates urgency and keeps attendees engaged even when they cannot buy immediately.

### 4d. Revenue Generation (what drives Clubless's own revenue)

1. **Stripe Connect payouts (A2)** -- Cannot charge platform fees if hosts cannot get paid. Fix this first.
2. **Self-service event creation (B1)** -- More events = more ticket transactions = more platform fees. The proposal bottleneck caps throughput.
3. **Venue booking integration (C4)** -- Venue commission is a high-margin revenue stream. Each booking can generate $200-2,000 in platform fees.
4. **Vendor marketplace payments (C8)** -- Take a cut of vendor transactions. High volume, recurring revenue from repeat bookings.
5. **Promo codes / discounts (B10)** -- Drives ticket volume. Platform fee applies to the discounted price, but increased volume more than compensates.

---

## 5. CRITICAL RISKS

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Stripe Connect not functional** | CRITICAL | Hosts cannot get paid. Fix in Phase A (A2). Without this, no host will use the platform for real events. |
| **No self-service event creation** | HIGH | Proposal-only flow cannot scale. Phase B (B1) is the priority. |
| **Empty marketplace problem** | HIGH | Both event and vendor sides are empty. Seed data (A1) + direct outreach needed. |
| **Single-city dependence** | MEDIUM | Seattle-only limits TAM. Phase C (C7) prepares for expansion. |
| **Two Supabase projects** | MEDIUM | Events page queries two different Supabase instances (curated events vs platform events). This adds complexity and latency. Plan to consolidate. |
| **Schema dual-naming** | LOW | Sync triggers bridge column name mismatches. Works but adds maintenance burden. Plan to consolidate to one naming convention. |

---

## 6. EFFORT SUMMARY

| Phase | Timeline | Dev-Days | Key Deliverables |
|-------|----------|----------|------------------|
| **A: Demo Ready** | Weeks 1-2 | 12-16 | Seed data, Stripe Connect, PWA manifest, social proof, polish |
| **B: MVP Complete** | Weeks 3-6 | 35-45 | Self-service creation, venue directory, guestlists, messaging, payouts |
| **C: Growth** | Weeks 7-14 | 60-80 | Discovery algo, social features, recurring events, venue booking, multi-city |
| **Total** | 14 weeks | 107-141 | Full investor-ready platform with growth engine |

---

## 7. WHAT IS STRONG TODAY

The codebase has genuine depth in several areas that should be highlighted to investors:

- **Revenue Calculator**: 1,700 lines covering 5 event types. This is best-in-class for a seed-stage startup.
- **Ticketing Pipeline**: End-to-end from ticket tier definition to Stripe Checkout to QR code generation to day-of check-in with real-time stats. Rate-limited.
- **Vendor Marketplace Structure**: 18 categories, verification system, service listings, quote management. The bones are right even if the marketplace is empty.
- **Community / Social Layer**: Connections, user search, public profiles, booking requests. This is infrastructure most competitors skip entirely.
- **Bar Service Moat**: Dedicated page for the licensed bar service. This is a real competitive advantage that no competitor can easily replicate.
- **Security**: Rate limiting on checkout, auth-gated routes, RLS policies, admin authorization checks.
- **Code Quality**: Lazy loading, React Query for data, Zod validation, consistent component library (shadcn/ui), responsive design throughout.
