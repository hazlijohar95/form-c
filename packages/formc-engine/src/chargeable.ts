import type { Sen } from "./money.js";
import { taxOnBands } from "./money.js";
import { CAPS, flatBand, smeBands } from "./rates.js";
import { doubleTotal } from "./adjustedIncome.js";
import type { DoubleDeduction } from "./adjustedIncome.js";

export interface LossYear {
  yearOfAssessment: number;
  amountBfSen: Sen;
}

export interface SourceIncome {
  label: string;
  amountSen: Sen; // floored at NIL per source
}

export interface ComputationInput {
  adjustedIncomeSen: Sen; // business source
  nonBusiness: SourceIncome[];
  currentCaSen: Sen;
  unabsorbedCaBfSen: Sen; // same business source only, indefinite
  donationsSen: Sen;
  zakatSen: Sen;
  currentLossOffsetSen: Sen; // s.44(2) current-year business loss vs all sources
  bfLosses: LossYear[]; // s.44(5A): business income only, 10yr
  currentYa: number;
  isSme: boolean;
  cp204PaidSen: Sen;
  whtCreditSen: Sen;
  bilateralCreditSen: Sen;
  priorCreditSen: Sen; // verified prior-YA overpayments held by LHDN
  balancingChargeSen: Sen; // Sch 3 Para 38, added after CA
  balancingAllowanceSen: Sen;
}

export interface ComputationResult {
  statutoryBusinessSen: Sen;
  aggregateSen: Sen;
  totalIncomeSen: Sen;
  chargeableExactSen: Sen;
  chargeableSen: Sen; // Form C whole ringgit (floor)
  grossTaxSen: Sen;
  taxPayableSen: Sen;
  netCashSen: Sen; // payable less verified prior-YA credits (negative = recoverable)
  donationsAllowedSen: Sen;
  zakatAllowedSen: Sen;
  lossUsedSen: Sen;
  lossCf: LossYear[];
  unabsorbedCaCfSen: Sen;
  smeApplied: boolean;
}

export function computeChargeable(input: ComputationInput): ComputationResult {
  // Statutory business income, floor NIL per source (Sch 3 Para 75:
  // CA cannot create a loss — excess becomes unabsorbed CA, same source).
  let statutoryBusiness =
    input.adjustedIncomeSen - input.currentCaSen - input.unabsorbedCaBfSen;
  let unabsorbedCaCf = 0;
  if (statutoryBusiness < 0) {
    unabsorbedCaCf = -statutoryBusiness;
    statutoryBusiness = 0;
  }
  // Balancing adjustments sit outside CA: charge added, allowance relieved.
  statutoryBusiness = Math.max(
    0,
    statutoryBusiness + input.balancingChargeSen - input.balancingAllowanceSen
  );

  const totalStatutory =
    statutoryBusiness + input.nonBusiness.reduce((a, s) => a + Math.max(0, s.amountSen), 0);

  // Donations 10% of aggregate; zakat 2.5% of aggregate (company = deduction, not rebate).
  // Aggregate here approximated as totalStatutory (pre-donation) per s.44 practice.
  const donationsAllowed = Math.min(input.donationsSen, Math.round(totalStatutory * CAPS.donationPctOfAggregate));
  const zakatAllowed = Math.min(input.zakatSen, Math.round(totalStatutory * CAPS.companyZakatPctOfAggregate));
  const aggregate = totalStatutory - donationsAllowed - zakatAllowed;

  // Current-year loss set-off s.44(2) against all sources.
  const afterCurrentLoss = Math.max(0, aggregate - input.currentLossOffsetSen);

  // B/F losses: business income only, FIFO, 10-year expiry.
  let remaining = afterCurrentLoss;
  let lossUsed = 0;
  const lossCf: LossYear[] = [];
  const businessOnlyBase = statutoryBusiness; // B/F losses cannot shelter non-business
  let businessRemaining = Math.max(0, businessOnlyBase - input.currentLossOffsetSen);
  void businessRemaining;
  for (const ly of input.bfLosses) {
    const age = input.currentYa - ly.yearOfAssessment;
    if (age > CAPS.lossCarryYears || age < 0) continue; // expired or future — drop
    if (remaining <= 0) {
      lossCf.push(ly);
      continue;
    }
    // B/F business loss can only absorb up to business portion still in remaining.
    const businessCap = Math.min(remaining, Math.max(0, statutoryBusiness - lossUsed));
    const use = Math.min(ly.amountBfSen, remaining, businessCap);
    lossUsed += use;
    remaining -= use;
    const left = ly.amountBfSen - use;
    if (left > 0) lossCf.push({ yearOfAssessment: ly.yearOfAssessment, amountBfSen: left });
  }

  const totalIncome = remaining;
  const chargeableExact = Math.max(0, totalIncome);
  // Form C works in whole ringgit — truncate down, tax on the truncated figure.
  const chargeable = Math.floor(chargeableExact / 100) * 100;
  const bands = input.isSme ? smeBands() : flatBand();
  const grossTax = taxOnBands(chargeable, bands);
  const taxPayable = Math.max(
    0,
    grossTax - input.bilateralCreditSen - input.whtCreditSen - input.cp204PaidSen
  );
  const netCash = taxPayable - input.priorCreditSen;

  return {
    statutoryBusinessSen: statutoryBusiness,
    aggregateSen: aggregate,
    totalIncomeSen: totalIncome,
    chargeableExactSen: chargeableExact,
    chargeableSen: chargeable,
    grossTaxSen: grossTax,
    taxPayableSen: taxPayable,
    netCashSen: netCash,
    donationsAllowedSen: donationsAllowed,
    zakatAllowedSen: zakatAllowed,
    lossUsedSen: lossUsed,
    lossCf,
    unabsorbedCaCfSen: unabsorbedCaCf,
    smeApplied: input.isSme,
  };
}

// CP204 s.107C(9)/(10): penalty 10% on shortfall beyond 30% threshold.
export function cp204Penalty(actualTaxSen: Sen, estimateSen: Sen): Sen {
  if (actualTaxSen <= 0) return 0;
  const shortfall = actualTaxSen - estimateSen;
  if (shortfall <= 0) return 0;
  const threshold = Math.round(actualTaxSen * CAPS.cp204ThresholdPct);
  if (shortfall <= threshold) return 0;
  return Math.round((shortfall - threshold) * CAPS.cp204PenaltyPct);
}
