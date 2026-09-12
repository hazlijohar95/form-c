import type { Sen } from "./money.js";
import { taxOnBands } from "./money.js";
import { CAPS } from "./rates.js";
import { applyBfLosses } from "./losses.js";
import { smeBandsFor } from "./sme.js";
import { applyIncentives } from "./incentives.js";

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
  // Incentives & group (applied to business statutory before aggregation)
  raQeSen: Sen;
  raBfSen: Sen;
  itaAllowanceSen: Sen;
  itaBfSen: Sen;
  itaPct: number;
  pioneerExemptSen: Sen;
  groupSurrenderedSen: Sen; // validated s.44A amount
  isIhc: boolean; // s.60F: flat 24%, no offsets, no carry-forwards
}

export interface ComputationResult {
  statutoryBusinessSen: Sen;
  statutoryBeforeIncentivesSen: Sen;
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
  raAbsorbedSen: Sen;
  raCfSen: Sen;
  itaAbsorbedSen: Sen;
  itaCfSen: Sen;
  groupReliefSen: Sen;
  itaPctApplied: number;
  findings: string[];
}

export function computeChargeable(input: ComputationInput): ComputationResult {
  // s.60F IHC: per-source only — brought-forward CA, current losses and
  // brought-forward losses all unavailable; flat rate applied downstream.
  const unabsorbedBf = input.isIhc ? 0 : input.unabsorbedCaBfSen;
  const currentLoss = input.isIhc ? 0 : input.currentLossOffsetSen;
  const bfLossList = input.isIhc ? [] : input.bfLosses;
  const groupRelief = input.isIhc ? 0 : input.groupSurrenderedSen;

  // Statutory business income, floor NIL per source (Sch 3 Para 75:
  // CA cannot create a loss — excess becomes unabsorbed CA, same source).
  let statutoryBusiness =
    input.adjustedIncomeSen - input.currentCaSen - unabsorbedBf;
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

  // Incentives absorb against business statutory (after CA/BC).
  // itaPct sanitised at this Seam: only 70 or 100 recognised.
  const findings: string[] = [];
  const itaPctApplied = input.itaPct === 100 ? 100 : 70;
  if (input.itaPct !== 70 && input.itaPct !== 100)
    findings.push(`ITA rate ${input.itaPct}% not recognised — 70% applied`);
  const preIncentive = statutoryBusiness;
  const inc = applyIncentives(statutoryBusiness, {
    raQeSen: input.raQeSen,
    raBfSen: input.raBfSen,
    itaAllowanceSen: input.itaAllowanceSen,
    itaBfSen: input.itaBfSen,
    itaPct: itaPctApplied,
  });
  statutoryBusiness = inc.afterSen;

  const totalStatutory =
    statutoryBusiness + input.nonBusiness.reduce((a, s) => a + Math.max(0, s.amountSen), 0);

  // Donations 10% of aggregate; zakat 2.5% of aggregate (company = deduction, not rebate).
  // Aggregate here approximated as totalStatutory (pre-donation) per s.44 practice.
  const donationsAllowed = Math.min(input.donationsSen, Math.round(totalStatutory * CAPS.donationPctOfAggregate));
  const zakatAllowed = Math.min(input.zakatSen, Math.round(totalStatutory * CAPS.companyZakatPctOfAggregate));
  const aggregate = totalStatutory - donationsAllowed - zakatAllowed;

  // Current-year loss set-off s.44(2) against all sources, then s.44A
  // group relief surrendered loss.
  const afterCurrentLoss = Math.max(0, aggregate - currentLoss - groupRelief);

  // B/F losses: business income only, FIFO, 10-year expiry.
  const businessOnlyBase = statutoryBusiness; // B/F losses cannot shelter non-business
  const applied = applyBfLosses({
    remainingSen: afterCurrentLoss,
    businessCapSen: businessOnlyBase,
    bfLosses: bfLossList,
    currentYa: input.currentYa,
  });
  const remaining = applied.remainingSen;
  const lossUsed = applied.lossUsedSen;
  const lossCf = applied.lossCf;
  const expiredDropped = applied.expiredDropped;

  const totalIncome = Math.max(0, remaining - input.pioneerExemptSen);
  const chargeableExact = Math.max(0, totalIncome);
  // Form C works in whole ringgit — truncate down, tax on the truncated figure.
  const chargeable = Math.floor(chargeableExact / 100) * 100;
  const bands = smeBandsFor(input.isSme, input.isIhc, input.currentYa);
  const grossTax = taxOnBands(chargeable, bands);
  const taxPayable = Math.max(
    0,
    grossTax - input.bilateralCreditSen - input.whtCreditSen - input.cp204PaidSen
  );
  const netCash = taxPayable - input.priorCreditSen;

  if (donationsAllowed < input.donationsSen)
    findings.push("Donations capped at 10% of aggregate income");
  if (zakatAllowed < input.zakatSen)
    findings.push("Company zakat capped at 2.5% of aggregate income");
  if (expiredDropped)
    findings.push("Expired B/F loss year dropped (10-year limit, s.44(5A))");
  if (unabsorbedCaCf > 0)
    findings.push("Para 75 bit: part of CA unabsorbed, carried forward same source");

  return {
    statutoryBusinessSen: statutoryBusiness,
    statutoryBeforeIncentivesSen: preIncentive,
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
    raAbsorbedSen: inc.result.raAbsorbedSen,
    raCfSen: inc.result.raCfSen,
    itaAbsorbedSen: inc.result.itaAbsorbedSen,
    itaCfSen: inc.result.itaCfSen,
    groupReliefSen: groupRelief,
    itaPctApplied,
    findings,
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
