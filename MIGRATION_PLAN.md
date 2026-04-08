# Clubless Collective: Safe Migration Plan to clawbot-prod

## The Core Strategy

**Align the database to match the existing code, not the other way around.**

Last time we tried to rewrite 19+ frontend files to match clawbot-prod's schema. That broke everything. Instead, we'll make clawbot-prod present the same interface as the Lovable project. This means:
- The existing committed code works unchanged against clawbot-prod
- Only 3 new files need small table name fixes
- Risk is concentrated in SQL migrations (easy to test independently)

---

## Phase 0: Safe Setup (No Code Changes to Existing Pages)

### 0.1 — Feature Branch
```bash
git checkout -b feat/clawbot-prod-migration
```
All work happens here. `main` stays untouched = production stays safe.

### 0.2 — Vercel Environment Variables (Not .env in Repo)
In the Vercel dashboard for `clubless-mvp-v2`:
- **Production** env vars: keep pointing to Lovable project (current working site)
- **Preview** env vars: point to clawbot-prod (`sdnjbzmyayapmseipcvw`)

This way every preview deployment auto-tests against clawbot-prod while production stays on Lovable.

### 0.3 — Remove .env from Version Control
```bash
git rm --cached .env
# Update .gitignore to include .env, .env.*, .vercel/
# Create .env.example with placeholder values
```

### 0.4 — Test Gate
Push branch. Verify Vercel creates a preview deployment. Preview should load (even if DB queries fail — that's Phase 1).

---

## Phase 1: Make clawbot-prod Match the Existing Code's Schema

### The Schema Gap

| What the code expects | What clawbot-prod has | Fix |
|----------------------|----------------------|-----|
| `tickets` table (tier definitions) | `ticket_tiers` table | Rename `ticket_tiers` -> `tickets` |
| `price_cents` (integer, cents) | `price` (numeric, dollars) | Add generated column `price_cents` |
| `qty_total`, `qty_sold` | `quantity_total`, `quantity_sold` | Add alias columns |
| `ticket_instances` table | `tickets` table (instances) | Rename `tickets` -> `ticket_instances` first |
| `events.title`, `events.start_at`, `events.creator_id` | `events.name`, `events.event_date` | Add columns + backfill |
| `orders.amount_cents`, `orders.platform_fee_cents` | `orders.total`, `orders.platform_fee` | Add generated cents columns |
| `payouts.amount_cents` | `payouts.amount` | Add generated cents column |
| `profiles.user_id` | `profiles.id` (PK = auth user id) | Add `user_id` alias column |

### Migration 1: `20260408000000_schema_alignment.sql`

**Rename tables** (order matters — rename instances first, then tiers):
```sql
-- Step 1: ticket instances table (currently called "tickets" on clawbot-prod)
ALTER TABLE public.tickets RENAME TO ticket_instances;

-- Step 2: ticket tiers table (currently "ticket_tiers") becomes "tickets"
ALTER TABLE public.ticket_tiers RENAME TO tickets;
```

**Events table — add Lovable-compatible columns:**
```sql
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS capacity INTEGER;

-- Backfill from existing columns
UPDATE public.events SET title = name WHERE title IS NULL;
UPDATE public.events SET start_at = event_date WHERE start_at IS NULL;
UPDATE public.events SET capacity = max_attendees WHERE capacity IS NULL;
```

**Tickets table (renamed from ticket_tiers) — add cent-based columns:**
```sql
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS price_cents INTEGER;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS qty_total INTEGER;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS qty_sold INTEGER;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS qty_reserved INTEGER;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS max_per_order INTEGER DEFAULT 10;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Backfill from existing columns
UPDATE public.tickets SET
  price_cents = (price * 100)::integer,
  qty_total = quantity_total,
  qty_sold = quantity_sold,
  qty_reserved = COALESCE(quantity_reserved, 0),
  active = COALESCE(is_visible, true);
```

**Orders table — add cent columns:**
```sql
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_cents INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_fee_cents INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS creator_amount_cents INTEGER;

UPDATE public.orders SET
  amount_cents = (total * 100)::integer,
  platform_fee_cents = (platform_fee * 100)::integer,
  creator_amount_cents = ((total - platform_fee - COALESCE(stripe_fee, 0)) * 100)::integer;
```

**Payouts table — add cents column:**
```sql
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS amount_cents INTEGER;
UPDATE public.payouts SET amount_cents = (amount * 100)::integer;
```

**Profiles table — add user_id alias:**
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id UUID;
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;
```

**Update all foreign key references** that pointed to the old table names.

### Migration 2: Connections, Notifications, Missing Objects
Apply the already-written migrations (adapted for clawbot-prod):
- `20260407100000_connections_notifications_adapted.sql`
- `20260407200000_missing_tables_and_rpcs.sql` (already applied — verify)

### Migration 3: Ticket Instances Infrastructure
Rewrite `20260407100001_ticket_instances_promo.sql` to reference the renamed tables:
- `ticket_instances.tier_id` -> `tickets.id` (FK)
- `scan_ticket()` and `get_checkin_stats()` operate on `ticket_instances`
- `promo_codes` references `events.id`

### Test Gate
Run SQL queries to verify:
```sql
SELECT title, start_at, creator_id FROM events LIMIT 1;           -- works
SELECT price_cents, qty_total, qty_sold FROM tickets LIMIT 1;     -- works
SELECT amount_cents FROM orders LIMIT 1;                          -- works
SELECT * FROM ticket_instances LIMIT 0;                           -- exists
SELECT * FROM get_user_level('some-uuid');                        -- returns level 1
```

---

## Phase 2: Fix the 3 New Files That Have Wrong Table Names

The new untracked pages/hooks were written with mixed schema assumptions. Only 3 files need fixes:

### `src/hooks/useEventCheckin.ts`
```diff
- .from("tickets").select("*, ticket_tiers(name)")
+ .from("ticket_instances").select("*, tickets(name)")
```
(3 occurrences of `"tickets"` -> `"ticket_instances"`, and `ticket_tiers(name)` -> `tickets(name)`)

### `src/pages/MyTickets.tsx`
```diff
- .from("tickets").select("..., ticket_tiers(name), events(title, start_at)")
+ .from("ticket_instances").select("..., tickets(name), events(title, start_at)")
```

### `src/pages/TicketVerify.tsx`
```diff
- .from("tickets").select("..., ticket_tiers(name), events(title)")
+ .from("ticket_instances").select("..., tickets(name), events(title)")
```

### Regenerate `types.ts`
```bash
supabase gen types typescript --project-id sdnjbzmyayapmseipcvw > src/integrations/supabase/types.ts
```
Verify the output starts with valid TypeScript (not CLI log text).

### Test Gate
`npm run build` succeeds with zero TypeScript errors.

---

## Phase 3: Integrate Features — One Commit Per Feature

Each commit gets pushed, creates a Vercel preview, and gets tested before moving on.

### Commit 1: Infrastructure
- `.gitignore` updates
- `.env.example` (new file)
- `supabase/config.toml` update
- `vercel.json` (SPA rewrites + security headers)
- `README.md` update
- `index.html` (remove Lovable OG image URLs)
- `package.json` (add `react-qr-code`, remove `lovable-tagger`)
- `vite.config.ts` (remove lovable-tagger plugin)
- Regenerated `types.ts`
- Updated `client.ts`

**Verify**: Preview loads, existing pages work against clawbot-prod.

### Commit 2: Auth Guard + Navbar
- `src/components/auth/RequireAuth.tsx` (new)
- `src/components/layout/Navbar.tsx` (notification bell, new nav links)

**Verify**: Navbar renders, auth redirects work.

### Commit 3: QR Ticketing System
- `src/components/tickets/TicketQRCode.tsx` (new)
- `src/hooks/useEventCheckin.ts` (new, corrected)
- `src/pages/MyTickets.tsx` (new, corrected)
- `src/pages/TicketVerify.tsx` (new, corrected)
- `src/pages/EventCheckin.tsx` (new)
- `src/App.tsx` — add routes

**Verify**: Routes load, QR renders, check-in page shows.

### Commit 4: Community & Connections
- `src/hooks/useConnections.ts` (new)
- `src/hooks/useUserSearch.ts` (new)
- `src/pages/Community.tsx` (new)
- `src/pages/PublicProfile.tsx` (new)
- `src/App.tsx` — add routes

**Verify**: Community page loads, user search works.

### Commit 5: Notifications
- `src/hooks/useNotifications.ts` (new)

**Verify**: Notification bell shows count.

### Commit 6: Analytics & Payment Settings
- `src/pages/EventAnalytics.tsx` (new)
- `src/pages/PaymentSettings.tsx` (new)
- `src/App.tsx` — add routes

**Verify**: Pages load, data displays correctly.

---

## Phase 4: End-to-End Testing on Preview

Run through on the Vercel preview URL (hitting clawbot-prod):

- [ ] Landing page loads with correct Clubless branding
- [ ] Calculator works with event type tabs, profit split, break-even
- [ ] Events page loads (shows clawbot-prod events)
- [ ] Event detail page shows correct prices (not off by 100x)
- [ ] Sign up / login works
- [ ] Profile settings page loads
- [ ] Community page loads
- [ ] My Tickets page loads (empty state OK)
- [ ] Creator Dashboard loads
- [ ] Admin dashboard loads (for admin users)
- [ ] No console errors on any page
- [ ] No Lovable branding visible anywhere
- [ ] Prices display correctly (dollars, not cents)

---

## Phase 5: Production Cutover

### 5.1 — Merge
```bash
git checkout main
git merge feat/clawbot-prod-migration
git push origin main
```

### 5.2 — Switch Vercel Production Env Vars
Change production environment variables to clawbot-prod credentials.

### 5.3 — Verify
Run through the Phase 4 checklist on clublesscollective.com.

### 5.4 — Rollback Plan
If anything goes wrong:
1. Revert Vercel production env vars back to Lovable credentials
2. Trigger redeploy (or promote old deployment)
3. Production is back on Lovable within 2 minutes

---

## Key Principles

1. **Never deploy uncommitted code** — always commit to a branch first
2. **Never deploy directly to production** — use Vercel preview first
3. **One feature per commit** — each testable independently
4. **Database changes before code changes** — make the DB match the code
5. **Rollback plan at every step** — Vercel promote or env var revert
6. **Build must pass before deploy** — `npm run build` with zero errors

---

## Cleanup After Successful Migration

- Delete superseded migration files
- Drop the git stash: `git stash drop stash@{0}`
- Remove `MIGRATION_POSTMORTEM.md` (or keep as documentation)
- Remove `.vercel/` from working tree
