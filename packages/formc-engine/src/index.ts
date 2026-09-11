import type { AddBack, Deduction, DoubleDeduction } from "./adjustedIncome.js";
import { adjustedIncome } from "./adjustedIncome.js";
import type { AssetInput } from "./capitalAllowances.js";
import { computeAsset, scheduleRollForward } from "./capitalAllowances.js";
import type { AssetResult } from "./capitalAllowances.js";
import type { ComputationInput } from "./chargeable.js";
import { computeChargeable, cp204Penalty } from "./chargeable.js";
import { checkSme } from "./rates.js";
import type { SmeProfile } from "./rates.js";
import type { Sen } from "./money.js";
import type { WhtLine } from "./related.js";
import { assessWht, earningsStripping } from "./related.js";
export type { WhtLine, WhtSection } from "./related.js";
export { assessWht, earningsStripping, deemedInterest140B } from "./related.js";

export { formatRM, toRM, toSen } from "./money.js";
export type { Sen } from "./money.js";
export { computeAsset, capMotorQe, scheduleRollForward } from "./capitalAllowances.js";
export type { AssetInput, AssetResult, CaCategory } from "./capitalAllowances.js";
export type { AddBack, Deduction, DoubleDeduction, AddBackSection } from "./adjustedIncome.js";
export { checkSme } from "./rates.js";

/** Externally-maintained Schedule 3 (e.g. FA-register workbook, prior agent basis).
 *  Used INSTEAD of the per-asset loop. Roll-forward must still foot. */
export interface Schedule3Override {
  caSen: Sen;
  balancingChargeSen: Sen;
  balancingAllowanceSen: Sen;
  residualBfSen: Sen;
  additionsSen: Sen;
  disposedReSen: Sen;
  residualCfSen: Sen;
  note: string; // basis: whose schedule, status (agreed/modelled)
}

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
}

export interface FormCResult {
  adjustedSen: Sen;
  totalCaSen: Sen;
  balancingChargeSen: Sen;
  balancingAllowanceSen: Sen;
  statutorySen: Sen;
  aggregateSen: Sen;
  chargeableExactSen: Sen;
  chargeableSen: Sen;
  grossTaxSen: Sen;
  taxPayableSen: Sen;
  netCashSen: Sen;
  cp204PenaltySen: Sen;
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
  const sme = checkSme(input.sme);

  // s.39(2): unremitted WHT kills the deduction — auto add-back.
  const whtAuto: AddBack[] = [];
  for (const w of input.whtLines) {
    const r = assessWht(w);
    if (!r.deductible)
      whtAuto.push({
        description: `${w.description} (WHT ${Math.round(r.rate * 100)}% not remitted)`,
        amountSen: w.amountSen,
        section: "s.39(2)",
      });
  }
  // s.140C: excess related-party interest permanently disallowed.
  const strip = earningsStripping(input.relatedInterestSen, input.taxEbitdaSen);
  if (strip > 0)
    whtAuto.push({
      description: "Related-party interest above 20% tax-EBITDA",
      amountSen: strip,
      section: "s.140C",
    });

  const adjusted = adjustedIncome(
    input.netProfitSen,
    [...input.addBacks, ...whtAuto],
    input.credits,
    input.doubleDeductions
  );

  let totalCa = 0;
  let bc = 0;
  let ba = 0;
  let roll = 0;
  let reCf = 0;
  const schedNotes: string[] = [];

  if (input.schedule3Override) {
    const o = input.schedule3Override;
    totalCa = o.caSen;
    bc = o.balancingChargeSen;
    ba = o.balancingAllowanceSen;
    reCf = o.residualCfSen;
    roll = o.residualBfSen + o.additionsSen - o.caSen - o.disposedReSen - o.residualCfSen;
    if (roll !== 0) schedNotes.push(`Schedule 3 roll-forward off by ${roll} sen`);
    schedNotes.push(`Schedule 3 per override: ${o.note}`);
  } else {
    let smallUsed = 0;
    const rows: AssetResult[] = [];
    for (const a of input.assets) {
      const r = computeAsset(a, sme.qualifies, smallUsed);
      rows.push(r);
      totalCa += r.totalCaSen;
      bc += r.balancingChargeSen;
      ba += r.balancingAllowanceSen;
      reCf += r.residualCfSen;
      if (a.category === "small-value") smallUsed += a.costSen;
      for (const n of r.notes) if (n.startsWith("DATA:")) schedNotes.push(`${a.description}: ${n}`);
    }
    roll = scheduleRollForward(rows);
  }

  const comp: ComputationInput = {
    adjustedIncomeSen: adjusted,
    nonBusiness:
      input.deemedInterestSen > 0
        ? [...input.nonBusiness, { label: "Deemed interest (s.140B)", amountSen: input.deemedInterestSen }]
        : input.nonBusiness,
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
  };
  const out = computeChargeable(comp);
  const penalty = cp204Penalty(out.grossTaxSen, input.cp204EstimateSen);

  const findings: string[] = [...schedNotes];
  if (!sme.qualifies) findings.push(`SME rate denied: ${sme.failedConditions.join("; ")} — flat 24% applied`);
  if (out.donationsAllowedSen < input.donationsSen) findings.push("Donations capped at 10% of aggregate income");
  if (out.zakatAllowedSen < input.zakatSen) findings.push("Company zakat capped at 2.5% of aggregate income");
  if (penalty > 0) findings.push("CP204 underestimation penalty applies (shortfall > 30% of tax payable)");
  if (input.bfLosses.some((l) => input.ya - l.yearOfAssessment > 10))
    findings.push("Expired B/F loss year dropped (10-year limit, s.44(5A))");
  if (out.unabsorbedCaCfSen > 0) findings.push("Para 75 bit: part of CA unabsorbed, carried forward same source");
  for (const w of input.whtLines) {
    const r = assessWht(w);
    if (!r.deductible) findings.push(`WHT not remitted on "${w.description}" — added back s.39(2)`);
  }
  if (strip > 0) findings.push("s.140C earnings stripping disallowance applied");

  return {
    adjustedSen: adjusted,
    totalCaSen: totalCa,
    balancingChargeSen: bc,
    balancingAllowanceSen: ba,
    statutorySen: out.statutoryBusinessSen,
    aggregateSen: out.aggregateSen,
    chargeableExactSen: out.chargeableExactSen,
    chargeableSen: out.chargeableSen,
    grossTaxSen: out.grossTaxSen,
    taxPayableSen: out.taxPayableSen,
    netCashSen: out.netCashSen,
    cp204PenaltySen: penalty,
    scheduleRollSen: roll,
    residualCfSen: reCf,
    unabsorbedCaCfSen: out.unabsorbedCaCfSen,
    filingDeadline: filingDeadline7Months(input.fyeTo),
    smeQualifies: sme.qualifies,
    smeFailed: sme.failedConditions,
    findings,
  };
}
