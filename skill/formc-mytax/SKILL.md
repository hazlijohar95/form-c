---
name: formc-mytax
description: "Fill LHDN MyTax Form C from Form C Studio export JSON using a browser agent. Human approves every field and submits manually. Never submit without explicit approval."
argument-hint: "[export.json path]"
allowed-tools:
  - Read(*)
  - Bash(*)
---

## Rules

1. Read the export JSON from Form C Studio (step 6). It contains chargeableIncomeSen,
   grossTaxSen, taxPayableSen, smeQualifies, filingDeadline, checklist.
2. Refuse to proceed unless every checklist item is `done: true`.
   If any is false, list them and stop.
3. Open https://mytax.hasil.gov.my in the browser agent (agent-browser / Playwright).
   Log in is manual by the user — never handle credentials.
4. Map fields per `mytax-field-map.json`. Fill each field, then screenshot + read-back
   every value against the JSON before moving on.
5. NEVER click Submit / Hantar. Stop at the preview screen and ask the human to
   submit. State amounts in RM with sen precision.

## Field map

Load `mytax-field-map.json` in this directory. Units: export uses integer sen;
divide by 100 for MyTax RM fields. Rate bands: SME 15/17/24 vs flat 24% must match
`smeQualifies` — if MyTax shows a different band, stop and flag.

For Form B exports (`"form": "B"`), use the `formB` section of the field map:
per-business statutory blocks, partnership share vs Form P, s.46–49 reliefs
(receipts required), graduated-band tax, zakat-fitrah rebate, CP500 credits.
Same gates: checklist complete, verification green, preview only, never Hantar.

For Form P exports (`"form": "P"`), use the `formP` section: firm divisional
blocks plus the partner allocation schedule — each partner keys their
`totalSen` into their own Form B. Refuse when `allocationDeltaSen` is not
rounding-trivial or ratios do not total 100%.
