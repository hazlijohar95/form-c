// YA 2025/2026 corporate rules. Source: ITA 1967, Finance Acts, Budget 2026.
// SME qualification + rate bands live in sme.ts (deepened SME Module);
// this file keeps pure constants — never hardcode without YA.
import { toSen } from "./money.js";
import type { RateBand } from "./money.js";

export const YA_2025 = 2025;
export const YA_2026 = 2026;

export const STANDARD_RATE = 0.24;

export const CAPS = {
  donationPctOfAggregate: 0.1,
  companyZakatPctOfAggregate: 0.025,
  smallValuePerAssetRM: 2000,
  smallValueAnnualCapNonSmeRM: 20000,
  motorGeneralQeRM: 50000,
  motorNewQeRM: 100000,
  motorNewTotalCostRM: 150000,
  lossCarryYears: 10,
  raRate: 0.6,
  raCapPctOfStatutory: 0.7,
  groupReliefMaxPct: 0.7,
  cp204ThresholdPct: 0.3,
  cp204PenaltyPct: 0.1,
  earningsStrippingDeMinimisRM: 500000,
  earningsStrippingPctOfEbitda: 0.2,
} as const;

// ---------------------------------------------------------------------------
// Resident-individual (Form B) tables, YA2025.
//
// VERIFY-YA DUTY: these mirror the published LHDN resident-individual
// schedule as amended by Budget 2023 (headline anchors: RM1,500 on the first
// RM50k; RM9,400 on the first RM100k; RM34,400 on the first RM200k — pinned
// in tests/formB.test.ts). Re-confirm every band AND every relief cap
// against the LHDN filing programme before filing a new YA; adjacent
// equal-rate bands preserve LHDN's historical splits, they are not typos.
// ---------------------------------------------------------------------------

/** Graduated resident-individual bands, YA2025. */
export function individualBandsYA2025(): RateBand[] {
  const m = (rm: number): number => toSen(rm);
  return [
    { fromSen: 0, toSen: m(5_000), rate: 0 },
    { fromSen: m(5_000), toSen: m(20_000), rate: 0.01 },
    { fromSen: m(20_000), toSen: m(35_000), rate: 0.03 },
    { fromSen: m(35_000), toSen: m(50_000), rate: 0.06 },
    { fromSen: m(50_000), toSen: m(70_000), rate: 0.11 },
    { fromSen: m(70_000), toSen: m(100_000), rate: 0.19 },
    { fromSen: m(100_000), toSen: m(250_000), rate: 0.25 },
    { fromSen: m(250_000), toSen: m(400_000), rate: 0.25 },
    { fromSen: m(400_000), toSen: m(600_000), rate: 0.26 },
    { fromSen: m(600_000), toSen: m(1_000_000), rate: 0.28 },
    { fromSen: m(1_000_000), toSen: m(2_000_000), rate: 0.28 },
    { fromSen: m(2_000_000), toSen: null, rate: 0.3 },
  ];
}

export function individualBandsFor(_ya: number): RateBand[] {
  // One versioned table for every YA until re-confirmed — see VERIFY-YA DUTY.
  return individualBandsYA2025();
}

/** Core personal-relief catalog (s.46–49), YA2025: key → annual cap RM.
 *  Stable headline reliefs only — lifestyle/medical/education-type receipts
 *  are keyed as `other:<label>` with a user-set cap. VERIFY-YA DUTY applies. */
export const PERSONAL_RELIEF_CAPS_RM: Record<string, number> = {
  self: 9000,
  spouse: 4000,
  child: 2000,
  disabledChild: 6000,
  epf: 4000,
  lifeInsurance: 3000,
  socso: 350,
  educationSelf: 7000,
  medicalSelf: 8000,
  lifestyle: 2500,
  childcare: 3000,
  sspn: 8000,
  prs: 3000,
};

/** Individual approved-donation cap mirrors the company rule: 10% of aggregate. */
export const INDIVIDUAL_DONATION_PCT_OF_AGGREGATE = 0.1;
