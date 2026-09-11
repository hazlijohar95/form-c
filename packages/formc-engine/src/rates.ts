import { toSen } from "./money.js";
import type { RateBand } from "./money.js";

// YA 2025/2026 corporate rules. Source: ITA 1967, Finance Acts, Budget 2026.
// Keep rates versioned per YA — never hardcode without YA.
export const YA_2025 = 2025;
export const YA_2026 = 2026;

export const STANDARD_RATE = 0.24;

export function smeBands(): RateBand[] {
  return [
    { fromSen: 0, toSen: toSen(150_000), rate: 0.15 },
    { fromSen: toSen(150_000), toSen: toSen(600_000), rate: 0.17 },
    { fromSen: toSen(600_000), toSen: null, rate: 0.24 },
  ];
}

export function flatBand(): RateBand[] {
  return [{ fromSen: 0, toSen: null, rate: STANDARD_RATE }];
}

export interface SmeProfile {
  paidUpCapitalRM: number;
  grossBusinessIncomeRM: number;
  controlsLargeCompany: boolean;
  controlledByLargeCompany: boolean;
  foreignOwnershipPct: number;
  isResident: boolean;
}

export interface SmeResult {
  qualifies: boolean;
  failedConditions: string[];
}

// All 5 conditions must pass. One failure = flat 24%.
export function checkSme(profile: SmeProfile): SmeResult {
  const failed: string[] = [];
  if (profile.paidUpCapitalRM > 2_500_000)
    failed.push("paid-up capital exceeds RM2.5m");
  if (profile.grossBusinessIncomeRM > 50_000_000)
    failed.push("gross business income exceeds RM50m");
  if (profile.controlsLargeCompany)
    failed.push("controls a company with paid-up capital > RM2.5m");
  if (profile.controlledByLargeCompany)
    failed.push("controlled by a company with paid-up capital > RM2.5m");
  if (profile.foreignOwnershipPct > 20)
    failed.push("foreign ownership exceeds 20%");
  if (!profile.isResident) failed.push("non-resident company");
  return { qualifies: failed.length === 0, failedConditions: failed };
}

export const CAPS = {
  donationPctOfAggregate: 0.1,
  companyZakatPctOfAggregate: 0.025,
  smallValuePerAssetRM: 2000,
  smallValueAnnualCapNonSmeRM: 20000,
  motorGeneralQeRM: 50000,
  motorNewQeRM: 100000,
  motorNewTotalCostRM: 150000,
  lossCarryYears: 10,
  groupReliefMaxPct: 0.7,
  cp204ThresholdPct: 0.3,
  cp204PenaltyPct: 0.1,
  earningsStrippingDeMinimisRM: 500000,
  earningsStrippingPctOfEbitda: 0.2,
} as const;
