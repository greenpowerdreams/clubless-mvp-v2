# Migration Post-Mortem: clawbot-prod Cutover Attempt (April 7, 2026)

## Executive Summary

An attempt was made to migrate clublesscollective.com from the original Lovable-managed Supabase project (`epzdbinxjqhjjgrhynpr`) to the user-owned clawbot-prod project (`sdnjbzmyayapmseipcvw`). The migration broke the production site. The site has been **rolled back** to the last known good deployment from March 22, 2026.

**Root cause:** The migration was attempted as a single large change across 19+ files without a staging environment, feature flags, or proper testing — and was deployed directly to production using uncommitted code.

---

## Timeline

| Time | Event |
|------|-------|
| Mar 22 | Last good deployment (commit `50c5a32` - "Upgrade prelaunch UI and waitlist") |
| Apr 7, ~session start | AI session begins attempting Supabase migration |
| Apr 7, +1h | First deployment with modified .env, schema changes, new routes |
| Apr 7, +1h5m | Second deployment after additional fixes |
| Apr 7, +1h20m | Third deployment after migration SQL applied |
| Apr 7, +1h25m | Fourth deployment |
| Apr 7, +1h30m | User reports: site shows old Lovable branding, calculator lost enhancements |
| Apr 7, +2h | Rolled back to Mar 22 deployment via `vercel promote` |

---

## What Went Wrong: 5 Root Causes

### 1. Deploying Uncommitted Code Directly to Production
`npx vercel --prod` deploys the **working directory**, not the committed git state. This means:
- Untested, in-progress changes went straight to production
- There was no way to cleanly roll back via git
- The deployment included partial work (modified files but not all new files were properly integrated)

### 2. No Staging or Preview Environment
All deployments went directly to the production domain (`clublesscollective.com`). There was no:
- Vercel preview deployment tested first
- Local end-to-end test of the full app
- Comparison of old vs new behavior before cutover

### 3. Two Incompatible Database Schemas
The two Supabase projects have fundamentally different schemas:

| Concept | Lovable Project (`epz...`) | clawbot-prod (`sdn...`) |
|---------|---------------------------|------------------------|
| Ticket tiers | `tickets` table | `ticket_tiers` table |
| Ticket instances | `ticket_instances` table | `tickets` table |
| Prices | `price_cents` (integer, cents) | `price` (numeric, dollars) |
| Quantities | `qty_total`, `qty_sold` | `quantity_total`, `quantity_sold` |
| Order amounts | `amount_cents`, `platform_fee_cents` | `total`, `platform_fee` |
| Profile user ref | `user_id` | `id` |
| Payouts | `amount_cents` | `amount` |
| Events | `title`, `start_at`, `creator_id` | `name`, `event_date` (no creator_id) |

Changing all references across 19+ files in one session without testing is extremely risky.

### 4. Missing Database Objects
clawbot-prod was missing several tables and functions the frontend depends on:
- `user_levels` table (pricing calculator tiers)
- `user_stats` table (user progression tracking)
- `user_roles` table (admin role management)
- `event_proposals` table (proposal submission)
- `get_user_level()` RPC (calculator personalization)
- `get_proposal_status()` RPC (proposal lookup)
- `has_role()` function (authorization)
- `app_role` enum type

These were only discovered and created AFTER the broken deployments.

### 5. Corrupted Generated Types File
The `supabase gen types typescript --linked` command captured CLI log output ("Initialising login role...") into the TypeScript file, making `src/integrations/supabase/types.ts` contain invalid TypeScript at line 1.

---

## What Was Actually Changed (Stashed)

### Modified Files (19):
- **Environment/Config (3):** `.env`, `supabase/config.toml`, `vite.config.ts`
- **Infrastructure (3):** `.gitignore`, `package.json`, `package-lock.json`
- **Supabase Integration (2):** `client.ts`, `types.ts` (3,261 lines changed)
- **Layout (2):** `Navbar.tsx`, `index.html`
- **Documentation (1):** `README.md`
- **Routing (1):** `App.tsx` (7 new routes)
- **Admin Components (2):** `AdminEventsTab.tsx`, `AdminPayoutsTab.tsx`
- **Page Components (5):** `CheckoutSuccess.tsx`, `CreatorDashboard.tsx`, `EventDetail.tsx`, `Events.tsx`, `ProfileSettings.tsx`

### New Files (untracked, still on disk):
- **Auth components:** `src/components/auth/` directory
- **Ticket components:** `src/components/tickets/` directory
- **New hooks:** `useConnections.ts`, `useEventCheckin.ts`, `useNotifications.ts`, `useUserSearch.ts`
- **New pages:** `Community.tsx`, `EventAnalytics.tsx`, `EventCheckin.tsx`, `MyTickets.tsx`, `PaymentSettings.tsx`, `PublicProfile.tsx`, `TicketVerify.tsx`
- **Migrations:** 5 new SQL migration files
- **Config:** `vercel.json`

### Key Problem: The stash captured the 19 modified files, but the new untracked files were NOT included in the stash (they remain in the working directory). This means the stash is incomplete — it has imports and routes pointing to files that aren't in the stash.

---

## Current State

| Item | Status |
|------|--------|
| Production site | Restored to Mar 22 deployment, working correctly |
| .env (committed) | Points to Lovable project `epzdbinxjqhjjgrhynpr` |
| Git branch | `main`, clean (matches last commit `50c5a32`) |
| Stash | `stash@{0}` contains the 19 modified files |
| Untracked files | New pages, hooks, components, migrations still on disk |
| clawbot-prod DB | Has new tables/RPCs created during this session (harmless) |

---

## Recommendations for Future Migration

### 1. Use a Feature Branch
```
git checkout -b feat/clawbot-prod-migration
```
All changes go on a branch. Nothing touches `main` until fully tested.

### 2. Use Vercel Preview Deployments
```
npx vercel  # (without --prod) creates a preview URL
```
Test the preview URL thoroughly before promoting to production.

### 3. Use Environment Variables in Vercel (Not .env)
Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as Vercel environment variables. This way:
- The same code can run against different databases
- No need to modify `.env` in the repo
- Preview deployments can point to a test database

### 4. Migrate Data First, Then Code
1. Export data from Lovable project to clawbot-prod
2. Ensure schema parity (create all missing tables/RPCs)
3. Verify data is correct on clawbot-prod
4. THEN switch the frontend code

### 5. Incremental Changes with Tests
Instead of changing 19 files at once:
- Make the code work with BOTH schemas (adapter pattern)
- Switch the database connection as a single config change
- Or use database views/aliases so the frontend code doesn't need changes

### 6. Never Deploy Uncommitted Code
Always commit to a branch first, then deploy from that committed state. This ensures:
- Reproducible deployments
- Clean rollback via git
- Auditable change history

---

## Recovery Steps (for future reference)

The site was rolled back with:
```bash
npx vercel promote https://clubless-mvp-v2-es2uepake-greenpowerdreams-projects.vercel.app --yes
```

Changes were preserved with:
```bash
git stash push -m "clawbot-prod-migration-attempt-20260407 - DO NOT DEPLOY"
```

New files remain as untracked in the working directory.
