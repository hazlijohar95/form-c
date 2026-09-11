// YA 2025/2026 corporate rules. Source: ITA 1967, Finance Acts, Budget 2026.
// SME qualification + rate bands live in sme.ts (deepened SME Module);
// this file keeps pure constants — never hardcode without YA.
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
