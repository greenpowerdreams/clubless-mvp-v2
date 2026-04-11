# Clubless Collective — Project Conventions for Claude

This file is loaded automatically into every Claude Code session in this repo. Follow these rules.

## What this project is

Clubless Collective is the "better-than-Posh / Expedia for events" — a Seattle-first event hosting platform. Vite + React 18 + TypeScript SPA, Supabase backend, Stripe + Stripe Connect for payments, deployed on Vercel.

- **Live site**: https://clublesscollective.com
- **Production Supabase project**: `epzdbinxjqhjjgrhynpr` (the live frontend is bundled against this — verify before any function deploy)
- **NOT-PROD project**: `sdnjbzmyayapmseipcvw` is the ClawBot article-generation engine, **unrelated** to Clubless. Never deploy Clubless code there.
- **Vercel project**: `clubless-mvp-v2` — production branch is `master` on the `vercel-deploy` git remote
- **Production deploy command**: `vercel deploy --prod --yes` (Vercel is NOT auto-deploying from GitHub right now — must be triggered manually)

---

## Workflow rules — pre-deploy checklist

**Every change that touches user-facing code MUST follow this pipeline before deploy.** No shortcuts. No "it's just a small change."

1. **Plan** — write a brief in plan mode if the change touches more than one file or has any user-facing surface. Get approval.
2. **Read** — read the existing code before editing. Never propose a change to code you haven't read.
3. **Edit** — minimum viable patch. Don't refactor on the side. Don't add features that weren't asked for.
4. **Build** — `npm run build` MUST be clean. No TypeScript errors. No warnings about missing dependencies.
5. **Smoke test (dev)** — start the dev server with `preview_start` and verify the changed surface loads with `preview_snapshot` + `preview_console_logs`. Zero console errors.
6. **UI/UX review** — if the change is visual (new page, new component, layout/copy/color edit), invoke the `ui-ux-reviewer` subagent on the changed page. Address any BLOCKER findings before commit.
7. **End-to-end QA** — if the change is a user-facing flow (form, wizard, checkout, auth, dashboard action), invoke the `qa-tester` subagent. It must return PASS before commit.
8. **Commit** — only after steps 1–7 pass. Conventional commit message (`feat:`, `fix:`, `chore:`, etc.).
9. **Deploy** — `vercel deploy --prod --yes` for frontend; for Supabase functions see the rule below.
10. **Post-deploy verify** — `curl` the relevant URL and/or `preview_screenshot` against the prod URL. Confirm the change is actually live before marking the task done.

**NO commit without `npm run build` clean.**
**NO deploy without `qa-tester` PASS on the affected flow.**
**NO visual change without `ui-ux-reviewer` PASS.**

---

## Supabase function deploy rule (the rule that would have prevented the 2026-04-10 misdeploy)

**Before every `supabase functions deploy` command, verify the project ref is correct.**

```bash
# 1. What project is the live frontend bundled against?
LIVE_REF=$(curl -s https://clublesscollective.com/ \
  | grep -oE 'assets/index-[a-zA-Z0-9_-]+\.js' \
  | head -1 \
  | xargs -I{} curl -s https://clublesscollective.com/{} \
  | grep -oE 'https://[a-z0-9]+\.supabase\.co' \
  | head -1)
echo "Live frontend talks to: $LIVE_REF"

# 2. What does supabase/config.toml say?
grep '^project_id' supabase/config.toml

# 3. They MUST match. If they don't, STOP and reconcile before deploying.
```

If the live frontend Supabase URL is `https://epzdbinxjqhjjgrhynpr.supabase.co`, then:
- `supabase/config.toml` `project_id` must be `epzdbinxjqhjjgrhynpr`
- Every `supabase functions deploy` command must include `--project-ref epzdbinxjqhjjgrhynpr` (be explicit, do not rely on the default)

**Never trust the default. Always pass `--project-ref` explicitly.**

---

## Code conventions

- **Use existing utilities.** Before writing new code, grep for existing helpers. Examples: `useSEO` for page metadata, `buildEventSchema` / `buildBarServiceFAQSchema` / `buildBarServiceLocalBusinessSchema` for JSON-LD, the existing `event-images` Supabase Storage bucket for image uploads.
- **Schema.org JSON-LD** is injected via `useEffect` in page components — see `src/pages/BarService.tsx` for the canonical pattern.
- **Routing**: lazy-load page components in `src/App.tsx`. Protected routes wrap with `<ProtectedRoute>`.
- **Auth**: Supabase Auth, accessed via the existing auth context. Do not roll your own.
- **Forms**: Zod validation, react-hook-form. See `src/pages/Signup.tsx` for the canonical pattern.
- **Styling**: Tailwind, dark theme by default, primary accent `#9945FF`.

---

## Lessons learned (do not repeat)

- **2026-04-10 — Supabase misdeploy.** Deployed `verify-payment` + `stripe-webhook` to the wrong project ref because `supabase/config.toml` was stale from a different Supabase project. Always run the verification snippet above before any function deploy.
- **2026-04-10 — Lovable favicon SERP cache.** Misdiagnosed Google's server-side cached favicon as a live-site issue. When a visual problem persists after a confirmed-correct deploy, **always verify what the third party is actually serving** (curl their cached version) before assuming our code is wrong.
- **2026-04-10 — GSC tool confusion.** Sitemaps tool only accepts XML files; individual page indexing goes through the URL Inspector. Don't paste page URLs into the Sitemaps tool.

---

## Manual checklist Drew owns (Claude does not do these)

These require Drew's authenticated session in third-party UIs and cannot be automated:

- Google Search Console (verify domain, submit sitemap, request indexing per URL)
- Google Business Profile (creation, verification, photos, services, posts)
- Plausible signup
- Bing Webmaster Tools (import from GSC)
- Yelp / Apple Maps / Thumbtack / The Knot / WeddingWire directory listings
- Stripe Dashboard (webhook secrets, payout bank account)
- Mercury → Stripe payout link
- `supabase login` (browser-based OAuth)

---

## What Claude should NEVER do without explicit per-task approval

- `git push --force` to any remote
- `git reset --hard`
- `supabase db push` to a production project (always preview first with `--dry-run`)
- Delete files in `supabase/migrations/`
- Modify `.env` files
- Run `vercel --prod` against an unverified branch
- Skip the workflow rules above
