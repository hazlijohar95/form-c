# Form C Studio — Sdn Bhd tax computation, YA2025 (ITA 1967)

## Stack (no Next.js / Vercel)

- `packages/formc-engine` — pure TypeScript, zero deps. Money in integer sen.
  Rates versioned per YA from `tax-agent/skill/data/rates.json` lineage.
- `apps/web` — Vite 6 + React 18 + TS strict, TanStack Router (URL tabs),
  Query (server state), Table + Form (editors with RM validation). Dark-first
  UI ported from OpenCode `packages/ui` design tokens (`theme.css`, `colors.css`):
  14px dense type, mono tabular numerals, bordered surfaces, cobalt/ember/apple
  signal colors. Visual parity only — runtime stays React for maintainability
  (OpenCode ships Solid/Kobalte; porting that runtime would niche the hiring pool
  for zero user-visible gain).
- `skill/formc-mytax` — agent skill mapping export JSON → MyTax Form C fields.
  Human-in-loop: agent fills, human submits.
- `workers/api` — Cloudflare Worker, D1-backed engagement CRUD
  (`GET/PUT/DELETE /api/engagements[/:id]`, open `/api/health`). CORS
  allowlist + bearer-token auth (`API_TOKEN` secret); timing-safe compare,
  1MB body cap, `no-store`. See `workers/api/README.md`.
- Deploy: Cloudflare Pages (`formc-studio`) + Worker (`formc-api`) + D1
  (`formc-engagements`). No Vercel. No Docker.

## AI framework decision

No agent framework in the calculation path. Engine is deterministic; LLM use is
limited to an optional propose-step for audit-PDF extraction, always human-verified.
Rationale: per-computation LLM calls add cost and non-determinism to a task where
wrong numbers carry penalties (s.112/113). First principles now; add retrieval or
agents later only around ingest, never around arithmetic.

## Engine coverage (edge cases)

- SME: all 5 conditions, one failure = flat 24%
- s.39 add-backs individually sectioned; entertainment 50% with proviso split
- Sch 3: Cat 1/2/3, ICT, Budget 2026 ACA 20/40, HP QE = capital paid, HP excluded
  from small-value, motor caps RM50k/RM100k, short-period AA pro-rating,
  Para 18 AA cap, Para 62 disposal proportioning, BC capped at allowances claimed
- Losses: s.44(2) current-year vs all sources; s.44(5A) B/F business-only, FIFO,
  10-year expiry; unabsorbed CA indefinite, same-source only
- Caps: donations 10%, company zakat 2.5% (deduction, not rebate)
- CP204 s.107C penalty: 10% beyond 30% threshold; new-company + short-period rules noted
- Filing: Form C 7 months from FYE close

## Multi-form foundation (Client + Form B/P)

- `Client` master (`apps/web/src/lib/clients.ts`, `formc.clients.v1`): company /
  individual / partnership with members (directors/shareholders or
  spouse/children/partners) rolling across YAs. `Engagement` carries
  `formType: C | B | P` + `clientId`; stored v4 records default to `C`.
- Onboarding first: tab `0 · Onboard` → `1 · Ingest` → …; per-form document
  checklists (`lib/onboarding.ts`) sync missing required docs into [TO OBTAIN];
  Ingest carries a receipt log for the same slots.
- Engine split: shared core (`adjustedIncome`, `schedule3`, `losses.ts` FIFO
  applicator) + form adapters — `computeFormC` untouched, `individual.ts`
  (`computeFormB`, `allocatePartnershipShare`, `reliefCapFor`) owns graduated
  bands (`rates.ts` YA-versioned, VERIFY-YA duty), s.46–49 relief caps,
  rebates-against-tax, CP500. Individuals are non-SME for Sch 3 small-value.
- Form P deepened (`partnership.ts`): firm-level divisional computation with
  Para 75 CA discipline (excess CA rides forward; genuine trading losses
  apportion to partners, never convert to CA), per-partner allocation with a
  divisional footing delta, loss-share flow-through into Form B as
  current-year offsets. `filingDeadline7Months` never throws on blank FYE.
- Filing maps: `skill/formc-mytax/mytax-field-map.json` has `form` (e-C),
  `formB` (e-B) and `formP` (e-P allocation) sections; the skill gates all three
  uniformly (P refuses on non-trivial footing delta or off-100 ratios).

## Run

```bash
cd /Users/hazlijohar/Projects/formc-studio
npm install
npm test --workspace @formc/engine
cd apps/web && npx vite dev  # :5174
```
