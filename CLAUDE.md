# Clubless Collective MVP v2
# The nightlife operating system
# Updated: 2026-03-17

---

## Vision

Clubless is the Expedia for nightlife — the infrastructure layer that knows everything happening in every city, powers the operations behind every event, and owns the relationship with every person in the scene.

**Three layers:** Information (landing page) → Operations (this app) → Platform (self-serve)
**Four audiences:** Guests, Hosts (DJs/promoters), Supply (venues/vendors), Brands
**Operational moat:** WA State liquor license, King County catering permit, Seattle business license

---

## Stack

- Vite 5 + React 18 + TypeScript 5.8 + Tailwind 3 + shadcn/ui
- Supabase (project: epzdbinxjqhjjgrhynpr) — Postgres + Auth + Edge Functions + RLS
- React Router 6, React Query 5, Zod, React Hook Form
- Stripe (payments via Edge Functions), Resend (email via Edge Functions)
- Recharts (analytics), Lucide (icons)

---

## Architecture

```
src/
├── app/                    → App shell, ErrorBoundary
├── features/               → Feature modules (Sprint 1+)
│   ├── events/             → discovery, detail, creation, management
│   ├── auth/               → login, signup, reset, guards
│   ├── dashboard/          → unified creator/DJ/vendor dashboard
│   ├── calculator/         → profit calculator engine
│   ├── scheduling/         → calendar, availability, conflicts
│   ├── collaboration/      → bookings, co-hosts, splits
│   ├── vendors/            → marketplace, profiles, quoting
│   ├── venues/             → profiles, availability, booking
│   ├── profiles/           → public creator/DJ profiles
│   ├── admin/              → dashboard, moderation, analytics
│   └── checkout/           → Stripe flow, confirmation
├── shared/                 → Cross-cutting (Sprint 1+ migrations)
│   ├── components/         → Layout, NavLink, shared UI
│   ├── hooks/              → useAuth, useMobile, useToast
│   ├── lib/                → utils, validations, constants
│   └── ui/                 → shadcn components
├── components/             → Current component location (migrating to shared/)
├── hooks/                  → Current hooks (migrating to shared/hooks/)
├── lib/                    → Current utils (migrating to shared/lib/)
├── integrations/           → Supabase client + generated types
├── pages/                  → Route entry points
└── assets/                 → Static images
```

New code goes in `src/features/`. Existing code migrates from `src/components/`, `src/hooks/`, `src/lib/` when touched.

---

## Conventions

- All imports use `@/` alias (maps to `src/`)
- shadcn/ui components live in `src/components/ui/` — do not modify directly
- Use React Query for all data fetching — no raw useEffect + setState for API calls
- Use Zod schemas for form validation
- Dark mode only — no theme toggle, CSS variables are dark-fixed
- Fonts: Inter (body/sans), Bebas Neue (display/headings)
- All Clubless content must be based on real verifiable data — never fabricate events/venues/dates

---

## Design Tokens

```
Background:  #0A0A0A (hsl 0 0% 4%)
Card:        #121212 (hsl 0 0% 7%)
Primary:     #9945FF (hsl 270 85% 60%) — signature violet
Accent:      #FF8C00 (hsl 35 100% 55%) — warm gold
Foreground:  #FAFAFA (hsl 0 0% 98%)
Success:     #3DBE67 (hsl 142 70% 45%)
Destructive: #E63946 (hsl 0 72% 55%)
Border:      #262626 (hsl 0 0% 15%)
```

---

## Brand

- **Domain:** clublesscollective.com
- **Tagline:** "Traditional clubs are taxis. We're Uber."
- **Social:** @clublesscollective (IG, TikTok, X)
- **Founder:** Drew Green (Andrew), Seattle WA
- **Contact:** hello@clublesscollective.com

---

## Commands

- `npm run dev` — Start dev server (port 8080)
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npm run preview` — Preview production build

---

## Environment

- Copy `.env.example` to `.env` and fill in Supabase credentials
- Never commit `.env` files
- Supabase project ID: epzdbinxjqhjjgrhynpr
- Landing page uses DIFFERENT Supabase: sdnjbzmyayapmseipcvw — do not mix

---

## Supabase

- Types generated in `src/integrations/supabase/types.ts`
- Edge Functions in `supabase/functions/` (Deno runtime)
- Migrations in `supabase/migrations/`
- RLS enabled on all tables
- Atomic ticket operations via RPC (reserve_tickets, confirm_ticket_sale)

---

## Revenue Model

- 5% ticket platform fee
- 12% venue booking commission
- 10% vendor booking commission
- Bar service margins
- Featured placement + pro subscriptions (future)

---

## Feature Filter

Before building any feature, answer:
1. Which audience does this serve? (Guests / Hosts / Supply / Brands)
2. Which layer does this strengthen? (Information / Operations / Platform)
3. Does it feed the flywheel?
4. Is it Seattle-first?
5. Does it connect to revenue?
