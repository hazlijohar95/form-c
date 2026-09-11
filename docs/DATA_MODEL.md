# Data model — Form C Studio

Distilled from a real SME bakery engagement file (full-set accounting through
to a filed Form C, with working papers, reviewer checklist and script-built
computation). No client data lives in this repo — the demo seed and fixtures
are synthetic.

## Storage now / later

- Now: versioned JSON in localStorage (`formc.engagements.v2`), migrated
  forward (`migrateV1`). No silent field drops — migration maps old fields.
- Later: the model is plain records with string IDs, ISO timestamps, and
  integer-sen money — portable to SQLite (Tauri/opencode-desktop pattern) or
  Supabase Postgres without reshaping. Money stays integer in every backend.
- `runs[]` (capped 20) is the supersession ledger: every basis that ever
  existed, so a stale figure can always be dated.

## Entities

| Entity | Why it exists (CJT lesson) |
|---|---|
| Engagement | one client × YA; carries SME profile, PBT, all schedules |
| AddBackLine {section} | §3: every add-back individually sectioned (depreciation s.39(1)(b), audit fee, tax fee net of prior accrual) |
| CreditLine {basis} | §3 exclusions: hibah s.4(c), disposal proceeds (capital receipt), capitalised repairs s.33(1) |
| DoubleDeductionLine {code, cap} | D1 codes 132/157; 157 capped RM15,000. Cap enforced in engine |
| AssetLine {cost, allowancesBf} | Sch 3 straight-line on ORIGINAL QE; opening = cost − hist. New assets: hist 0 |
| NonQualifyingLine {reason} | renovation RM320,874 excluded with plant-vs-setting reason; feeds register tie |
| Schedule3Override | prior-agent basis unknown (A1): external schedule with roll-forward that must foot |
| Director {share, salary, loan} | Form C director schedule; loan column must match accounts |
| RelatedAccount {12 balances} | s.140B: any month-end debit = advance; CJT verified 12/12 credit |
| Cp204Bill {billNo, paidOn, inFY} | 12 bills, 11 in FY + 12th next Jan; ties to instalments paid |
| Judgement {position, alternative, signedOff} | B1–B12 partner sign-off register |
| OpenItem {whyBlocks, effect} | A1–A5 [TO OBTAIN]; unresolved items gate export |
| PriorYear {reBf agreed?} | RE b/f modelled vs agreed; D-section agreement table |
| RunRecord | snapshot history for the file |

## Rules the schema enforces

1. CI truncated to whole RM down; tax on truncated figure (CJT: 76,031.77 → 76,031 → 11,404.65).
2. Disposal year: no IA/AA (Para 15); BC capped at allowances given (Para 37); BA otherwise.
3. SVA: new assets only, QE ≤ RM2,000, non-SME cap RM20k (SME uncapped).
4. Para 75: CA cannot create a loss; excess → unabsorbed CA, same source.
5. s.107C(10): shortfall vs **30% of tax payable** (not 130% of estimate — the file's own draft got this wrong once).
6. Unverified prior-YA credits are EXCLUDED from net cash (CJT's RM1,399.85 stale credit).
7. Roll-forward must foot: RE b/f + additions − CA − disposed RE − RE c/f = 0.
8. Register tie: qualifying QE + non-qualifying (+ expensed repairs) = register grand total.
