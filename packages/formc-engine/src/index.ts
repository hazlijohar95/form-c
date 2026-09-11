import type { AddBack, Deduction, DoubleDeduction } from "./adjustedIncome.js";
import { adjustedIncome } from "./adjustedIncome.js";
import type { AssetInput } from "./capitalAllowances.js";
import { computeAsset, scheduleRollForward } from "./capitalAllowances.js";
import type { AssetResult } from "./capitalAllowances.js";
import type { ComputationInput } from "./chargeable.js";
import { computeChargeable, cp204Penalty } from "./chargeable.js";
import { resolveSme } from "./sme.js";
import type { SmeProfile } from "./sme.js";
import { computeDisallowances } from "./disallowances.js";
import { computeSchedule3 } from "./schedule3.js";
import type { Schedule3Override } from "./schedule3.js";
import type { Sen } from "./money.js";
import type { WhtLine } from "./related.js";
import { validateGroupRelief } from "./incentives.js";
export type { WhtLine, WhtSection } from "./related.js";
export { assessWht, earningsStripping, deemedInterest140B, assessRelatedAccount, WHT_SECTIONS, isWhtSection } from "./related.js";
export { doubleTotal, entertainmentAddBack } from "./adjustedIncome.js";
export { applyIncentives, validateGroupRelief } from "./incentives.js";
export { computeSchedule3 } from "./schedule3.js";
export { resolveSme, checkSme, smeBandsFor, smeBands, flatBand, smePortalBand } from "./sme.js";
export { computeDisallowances } from "./disallowances.js";
export {
  MYTAX_STEPS,
  blankMyTaxProfile,
  coverProfil,
  coverMaksykt,
  coverRumusanGate,
  evaluateCoverage,
} from "./mytax.js";
export type { MyTaxProfile, MyTaxStep, MyTaxStepId, CoverageInput, StepCoverage } from "./mytax.js";

export { formatRM, toRM, toSen } from "./money.js";
export type { Sen } from "./money.js";
export { computeAsset, capMotorQe, isDataNote, scheduleRollForward, overrideRollForward } from "./capitalAllowances.js";
export type { AssetInput, AssetResult, AssetContext, CaCategory } from "./capitalAllowances.js";
export type { AddBack, Deduction, DoubleDeduction, AddBackSection } from "./adjustedIncome.js";
export type { Schedule3Override } from "./schedule3.js";

export interface FormCInput {
  ya: number;
  companyName: string;
  regNo: string;
  fyeFrom: string;
  fyeTo: string;
  sme: SmeProfile;
  netProfitSen: Sen;
  addBacks: AddBack[];
  credits: Deduction[];
  doubleDeductions: DoubleDeduction[];
  assets: AssetInput[];
  schedule3Override?: Schedule3Override;
  nonBusiness: { label: string; amountSen: Sen }[];
  whtLines: WhtLine[];
  deemedInterestSen: Sen; // s.140B, assessed as interest source
  relatedInterestSen: Sen; // controlled cross-border interest for s.140C
  taxEbitdaSen: Sen;
  donationsSen: Sen;
  zakatSen: Sen;
  currentLossOffsetSen: Sen;
  bfLosses: { yearOfAssessment: number; amountBfSen: Sen }[];
  unabsorbedCaBfSen: Sen;
  cp204EstimateSen: Sen;
  cp204PaidSen: Sen;
  whtCreditSen: Sen;
  bilateralCreditSen: Sen;
  priorCreditSen: Sen;
  // Incentives (Sch 7A RA / ITA / pioneer)
  raQeSen: Sen;
  raBfSen: Sen;
  itaAllowanceSen: Sen;
  itaBfSen: Sen;
  itaPct: number;
  pioneerExemptSen: Sen;
  // Group relief s.44A + IHC s.60F
  groupSurrenderedSen: Sen;
  groupSurrendererLossSen: Sen;
  groupConditionsMet: boolean;
  isIhc: boolean;
}

export interface FormCResult {
  adjustedSen: Sen;
  totalCaSen: Sen;
  balancingChargeSen: Sen;
  balancingAllowanceSen: Sen;
  statutorySen: Sen;
  statutoryBeforeIncentivesSen: Sen;
  aggregateSen: Sen;
  chargeableExactSen: Sen;
  chargeableSen: Sen;
  grossTaxSen: Sen;
  taxPayableSen: Sen;
  netCashSen: Sen;
  cp204PenaltySen: Sen;
  raAbsorbedSen: Sen;
  raCfSen: Sen;
  itaAbsorbedSen: Sen;
  itaCfSen: Sen;
  groupReliefSen: Sen;
  lossUsedSen: Sen;
  lossCfSen: { yearOfAssessment: number; amountBfSen: Sen }[];
  scheduleRollSen: Sen; // 0 = footed
  residualCfSen: Sen; // opening pool for next YA
  unabsorbedCaCfSen: Sen; // Para 75 excess, same source
  filingDeadline: string;
  smeQualifies: boolean;
  smeFailed: string[];
  findings: string[];
}

export function filingDeadline7Months(fyeTo: string): string {
  const d = new Date(fyeTo);
  d.setMonth(d.getMonth() + 7);
  return d.toISOString().slice(0, 10);
}

export function computeFormC(input: FormCInput): FormCResult {
  const sme = resolveSme(input.sme, { isIhc: input.isIhc, ya: input.ya });

  const dis = computeDisallowances({
    whtLines: input.whtLines,
    relatedInterestSen: input.relatedInterestSen,
    taxEbitdaSen: input.taxEbitdaSen,
    deemedInterestSen: input.deemedInterestSen,
  });

  const adjusted = adjustedIncome(
    input.netProfitSen,
    [...input.addBacks, ...dis.autoAddBacks],
    input.credits,
    input.doubleDeductions
  );

  const sched = computeSchedule3(input.assets, sme.qualifies, input.schedule3Override);
  const totalCa = sched.totalCaSen;
  const bc = sched.balancingChargeSen;
  const ba = sched.balancingAllowanceSen;
  const roll = sched.rollSen;
  const reCf = sched.residualCfSen;
  const schedNotes: string[] = [...sched.notes];

  const validatedGroupRelief = validateGroupRelief({
    surrenderedSen: input.groupSurrenderedSen,
    surrendererLossSen: input.groupSurrendererLossSen,
    conditionsMet: input.groupConditionsMet,
  });
  const comp: ComputationInput = {
    adjustedIncomeSen: adjusted,
    nonBusiness: [...input.nonBusiness, ...dis.nonBusinessExtra],
    currentCaSen: totalCa,
    unabsorbedCaBfSen: input.unabsorbedCaBfSen,
    donationsSen: input.donationsSen,
    zakatSen: input.zakatSen,
    currentLossOffsetSen: input.currentLossOffsetSen,
    bfLosses: input.bfLosses,
    currentYa: input.ya,
    isSme: sme.qualifies,
    cp204PaidSen: input.cp204PaidSen,
    whtCreditSen: input.whtCreditSen,
    bilateralCreditSen: input.bilateralCreditSen,
    priorCreditSen: input.priorCreditSen,
    balancingChargeSen: bc,
    balancingAllowanceSen: ba,
    raQeSen: input.raQeSen,
    raBfSen: input.raBfSen,
    itaAllowanceSen: input.itaAllowanceSen,
    itaBfSen: input.itaBfSen,
    itaPct: input.itaPct,
    pioneerExemptSen: input.pioneerExemptSen,
    groupSurrenderedSen: validatedGroupRelief.allowedSen,
    isIhc: input.isIhc,
  };
  const out = computeChargeable(comp);
  const penalty = cp204Penalty(out.grossTaxSen, input.cp204EstimateSen);

  const findings: string[] = [...schedNotes];
  if (sme.finding) findings.push(sme.finding);
  if (sme.yaNote) findings.push(sme.yaNote);
  findings.push(...out.findings);
  if (penalty > 0) findings.push("CP204 underestimation penalty applies (shortfall > 30% of tax payable)");
  findings.push(...dis.whtFindings);
  if (dis.stripFinding) findings.push(dis.stripFinding);
  if (validatedGroupRelief.note && input.groupSurrenderedSen > 0)
    findings.push(validatedGroupRelief.note);
  if (input.isIhc) findings.push("s.60F IHC: flat 24%, no offsets or carry-forwards");
  if (input.pioneerExemptSen > 0) findings.push("Pioneer exempt income excluded from chargeable");

  return {
    adjustedSen: adjusted,
    totalCaSen: totalCa,
    balancingChargeSen: bc,
    balancingAllowanceSen: ba,
    statutorySen: out.statutoryBusinessSen,
    statutoryBeforeIncentivesSen: out.statutoryBeforeIncentivesSen,
    aggregateSen: out.aggregateSen,
    chargeableExactSen: out.chargeableExactSen,
    chargeableSen: out.chargeableSen,
    grossTaxSen: out.grossTaxSen,
    taxPayableSen: out.taxPayableSen,
    netCashSen: out.netCashSen,
    cp204PenaltySen: penalty,
    raAbsorbedSen: out.raAbsorbedSen,
    raCfSen: out.raCfSen,
    itaAbsorbedSen: out.itaAbsorbedSen,
    itaCfSen: out.itaCfSen,
    groupReliefSen: out.groupReliefSen,
    lossUsedSen: out.lossUsedSen,
    lossCfSen: out.lossCf,
    scheduleRollSen: roll,
    residualCfSen: reCf,
    unabsorbedCaCfSen: out.unabsorbedCaCfSen,
    filingDeadline: filingDeadline7Months(input.fyeTo),
    smeQualifies: sme.smeQualifies,
    smeFailed: sme.failedConditions,
    findings,
  };
}
