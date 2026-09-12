import type { Sen } from "./money.js";
import { formatRM, taxOnBands } from "./money.js";
import {
  INDIVIDUAL_DONATION_PCT_OF_AGGREGATE,
  PERSONAL_RELIEF_CAPS_RM,
} from "./rates.js";
import { adjustedIncome } from "./adjustedIncome.js";
import type { AddBack, Deduction, DoubleDeduction } from "./adjustedIncome.js";
import { computeSchedule3 } from "./schedule3.js";
import type { Schedule3Override } from "./schedule3.js";
import type { AssetInput } from "./capitalAllowances.js";
import { applyBfLosses } from "./losses.js";
import type { LossYearInput } from "./losses.js";
import { individualBandsFor } from "./rates.js";

// ---------------------------------------------------------------------------
// Form B (resident individual with business income) + Form P allocation.
//
// Shared core is reused, never reimplemented: adjustedIncome(), Sch 3 per
// business (individuals are non-SME, so the RM20k small-value cap applies),
// and the FIFO 10-year B/F loss applicator. What differs from Form C lives
// here: per-business statutory, partnership-share apportionment, personal
// reliefs (s.46–49, capped), individual graduated bands, rebates
// (zakat fitrah reduces TAX, not income), and CP500 (s.107B) credits.
// ---------------------------------------------------------------------------

export interface BusinessComputationInput {
  label: string;
  netProfitSen: Sen;
  addBacks: AddBack[];
  credits: Deduction[];
  doubleDeductions: DoubleDeduction[];
  assets: AssetInput[];
  schedule3Override?: Schedule3Override;
  unabsorbedCaBfSen: Sen; // same business source only, indefinite
}

export interface BusinessComputationResult {
  label: string;
  adjustedSen: Sen;
  totalCaSen: Sen;
  balancingChargeSen: Sen;
  balancingAllowanceSen: Sen;
  statutorySen: Sen; // floored NIL per business source
  unabsorbedCaCfSen: Sen;
  residualCfSen: Sen;
  scheduleRollSen: Sen;
}

export function computeBusiness(input: BusinessComputationInput): BusinessComputationResult {
  const adjusted = adjustedIncome(input.netProfitSen, input.addBacks, input.credits, input.doubleDeductions);
  const sched = computeSchedule3(input.assets, false, input.schedule3Override);
  let statutory = adjusted - sched.totalCaSen - input.unabsorbedCaBfSen;
  let unabsorbedCaCf = 0;
  if (statutory < 0) {
    unabsorbedCaCf = -statutory;
    statutory = 0;
  }
  statutory = Math.max(0, statutory + sched.balancingChargeSen - sched.balancingAllowanceSen);
  return {
    label: input.label,
    adjustedSen: adjusted,
    totalCaSen: sched.totalCaSen,
    balancingChargeSen: sched.balancingChargeSen,
    balancingAllowanceSen: sched.balancingAllowanceSen,
    statutorySen: statutory,
    unabsorbedCaCfSen: unabsorbedCaCf,
    residualCfSen: sched.residualCfSen,
    scheduleRollSen: sched.rollSen,
  };
}

// Partner's share of partnership adjusted income: salary + interest taken
// off the top, the balance split by profit-sharing ratio. Loss shares flow
// through the same formula (negative balance share).
export function allocatePartnershipShare(input: {
  partnershipAdjustedSen: Sen; // divisional adjusted income of the firm
  totalSalariesSen: Sen; // all partners' salaries provided by the firm
  totalInterestSen: Sen; // all partners' interest on capital
  partnerSalarySen: Sen; // this partner's salary
  partnerInterestSen: Sen; // this partner's interest on capital
  ratioPct: number; // this partner's profit-sharing ratio, 0–100
}): Sen {
  const ratio = Math.min(100, Math.max(0, input.ratioPct)) / 100;
  const balance = input.partnershipAdjustedSen - input.totalSalariesSen - input.totalInterestSen;
  return input.partnerSalarySen + input.partnerInterestSen + Math.round(balance * ratio);
}

export interface ReliefClaim {
  key: string; // catalog key (self, spouse, …) or `other:<label>`
  label: string;
  amountSen: Sen;
  capSen?: Sen; // user-set cap for `other:` lines; catalog caps otherwise
}

export function reliefCapFor(key: string, fallbackCapSen?: Sen): Sen | null {
  if (key.startsWith("other:")) return fallbackCapSen ?? null;
  const capRm = PERSONAL_RELIEF_CAPS_RM[key];
  return capRm === undefined ? null : capRm * 100;
}

export interface FormBInput {
  ya: number;
  businesses: BusinessComputationInput[];
  partnershipShareSen: Sen; // apportioned share(s), already allocated via allocatePartnershipShare
  employmentSen: Sen;
  nonBusiness: { label: string; amountSen: Sen }[]; // s.4(c)–(f), floored NIL each
  donationsSen: Sen; // s.44(6), capped at 10% of aggregate
  currentLossOffsetSen: Sen; // s.44(2) current-year business loss vs all sources
  bfLosses: LossYearInput[]; // business source, FIFO, 10-year
  reliefs: ReliefClaim[];
  rebatesSen: Sen; // zakat fitrah + other rebates: reduce TAX, capped at gross tax
  cp500PaidSen: Sen; // s.107B instalments
  whtCreditSen: Sen;
  bilateralCreditSen: Sen;
  priorCreditSen: Sen; // verified prior-YA overpayments only
}

export interface FormBResult {
  businesses: BusinessComputationResult[];
  businessStatutorySen: Sen;
  employmentSen: Sen;
  aggregateSen: Sen;
  reliefsAllowedSen: Sen;
  reliefCapped: { label: string; allowedSen: Sen; claimedSen: Sen }[];
  reliefRows: { key: string; label: string; claimedSen: Sen; allowedSen: Sen }[];
  chargeableExactSen: Sen;
  chargeableSen: Sen; // whole ringgit, floor
  grossTaxSen: Sen;
  rebatesAllowedSen: Sen;
  taxPayableSen: Sen;
  netCashSen: Sen;
  lossUsedSen: Sen;
  lossCf: LossYearInput[];
  donationsAllowedSen: Sen;
  findings: string[];
}

export function computeFormB(input: FormBInput): FormBResult {
  const businesses = input.businesses.map(computeBusiness);
  const businessStatutory = businesses.reduce((a, b) => a + b.statutorySen, 0);
  const businessUnabsorbedCf = businesses.reduce((a, b) => a + b.unabsorbedCaCfSen, 0);
  const totalStatutory =
    businessStatutory + input.partnershipShareSen + input.employmentSen +
    input.nonBusiness.reduce((a, s) => a + Math.max(0, s.amountSen), 0);

  const donationsAllowed = Math.min(
    input.donationsSen,
    Math.round(totalStatutory * INDIVIDUAL_DONATION_PCT_OF_AGGREGATE)
  );
  const aggregate = Math.max(0, totalStatutory - donationsAllowed);
  const afterCurrentLoss = Math.max(0, aggregate - input.currentLossOffsetSen);

  const applied = applyBfLosses({
    remainingSen: afterCurrentLoss,
    businessCapSen: businessStatutory,
    bfLosses: input.bfLosses,
    currentYa: input.ya,
  });

  // Personal reliefs absorb total income after losses.
  let reliefBase = applied.remainingSen;
  let reliefsAllowed = 0;
  const reliefCapped: FormBResult["reliefCapped"] = [];
  const reliefRows: FormBResult["reliefRows"] = [];
  for (const r of input.reliefs) {
    const cap = reliefCapFor(r.key, r.capSen);
    const allowed = Math.min(r.amountSen, cap ?? r.amountSen, reliefBase);
    reliefsAllowed += allowed;
    reliefBase -= allowed;
    reliefRows.push({ key: r.key, label: r.label, claimedSen: r.amountSen, allowedSen: allowed });
    if (allowed < r.amountSen)
      reliefCapped.push({ label: r.label, allowedSen: allowed, claimedSen: r.amountSen });
  }

  const chargeableExact = Math.max(0, applied.remainingSen - reliefsAllowed);
  const chargeable = Math.floor(chargeableExact / 100) * 100;
  const grossTax = taxOnBands(chargeable, individualBandsFor(input.ya));
  const rebatesAllowed = Math.min(input.rebatesSen, grossTax);
  const taxPayable = Math.max(
    0,
    grossTax - rebatesAllowed - input.bilateralCreditSen - input.whtCreditSen - input.cp500PaidSen
  );
  const netCash = taxPayable - input.priorCreditSen;

  const findings: string[] = [];
  if (donationsAllowed < input.donationsSen)
    findings.push("Donations capped at 10% of aggregate income");
  if (applied.expiredDropped)
    findings.push("Expired B/F loss year dropped (10-year limit)");
  for (const r of reliefCapped)
    findings.push(`Relief capped: ${r.label} ${formatRM(r.claimedSen)} → ${formatRM(r.allowedSen)}`);
  if (businessUnabsorbedCf > 0)
    findings.push(`Unabsorbed CA ${formatRM(businessUnabsorbedCf)} c/f same business source`);
  for (const b of businesses)
    if (b.scheduleRollSen !== 0)
      findings.push(`${b.label}: schedule roll-forward off by ${formatRM(b.scheduleRollSen)}`);

  return {
    businesses,
    businessStatutorySen: businessStatutory,
    employmentSen: input.employmentSen,
    aggregateSen: aggregate,
    reliefsAllowedSen: reliefsAllowed,
    reliefCapped,
    reliefRows,
    chargeableExactSen: chargeableExact,
    chargeableSen: chargeable,
    grossTaxSen: grossTax,
    rebatesAllowedSen: rebatesAllowed,
    taxPayableSen: taxPayable,
    netCashSen: netCash,
    lossUsedSen: applied.lossUsedSen,
    lossCf: applied.lossCf,
    donationsAllowedSen: donationsAllowed,
    findings,
  };
}
