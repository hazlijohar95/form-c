import { useMemo } from "react";
import {
  assessRelatedAccount,
  checkSme,
  computeFormB,
  computeFormC,
  computePartnership,
  computeSchedule3,
  isWhtSection,
  WHT_SECTIONS,
} from "@formc/engine";
import type { FormBInput, FormCInput, PartnershipInput, Sen } from "@formc/engine";
import { rmStrToSen, numOr0, parseRm, signedRmToSen, isSignedRm } from "./rm.js";
import { toAssetInput } from "./types.js";
import type { AddBackLine, BusinessUnit, Engagement, PartnershipFirm } from "./types.js";

export { WHT_SECTIONS };

// Signed-amount fields (loss shares, firm P&L) accept a leading minus —
// only malformed text is reported, never a genuine negative.
function signedIssue(label: string, v: string): [string, string][] {
  return isSignedRm(v) ? [] : [[label, v]];
}
export function whtSectionList(): typeof WHT_SECTIONS {
  return WHT_SECTIONS;
}

// s.140B deemed interest from related-account month-ends:
// peak debit x months in debit x market rate.
export function deemed140B(eng: Engagement): {
  lines: { name: string; amountSen: number }[];
  totalSen: number;
} {
  const rate = numOr0(eng.deemedRatePct);
  if (!(rate > 0)) return { lines: [], totalSen: 0 };
  const lines = eng.relatedAccounts.flatMap((a) => {
    const nums = a.balances
      .map((b) => Number(String(b).replace(/,/g, "").trim()))
      .filter((n) => Number.isFinite(n));
    const assessed = assessRelatedAccount(nums, rate);
    return assessed.deemedSen > 0 ? [{ name: a.name || "related account", amountSen: assessed.deemedSen }] : [];
  });
  return { lines, totalSen: lines.reduce((a, l) => a + l.amountSen, 0) };
}

export function buildFormCInput(eng: Engagement): FormCInput {
  const sme = {
    paidUpCapitalRM: numOr0(eng.paidUpRM),
    grossBusinessIncomeRM: numOr0(eng.grossIncRM),
    controlsLargeCompany: eng.controlsLarge,
    controlledByLargeCompany: eng.controlledByLarge,
    foreignOwnershipPct: numOr0(eng.foreignPct),
    isResident: true,
  };
  const o = eng.schedule3;
  return {
    ya: eng.ya,
    companyName: eng.companyName,
    regNo: eng.regNo,
    fyeFrom: eng.fyeFrom,
    fyeTo: eng.fyeTo,
    sme,
    netProfitSen: rmStrToSen(eng.netProfitRM),
    addBacks: eng.addBacks.map((l) => ({
      description: l.description || "(unnamed)",
      amountSen: rmStrToSen(l.amountRM),
      section: l.section,
    })),
    credits: eng.credits.map((l) => ({
      description: l.description || "(unnamed)",
      amountSen: rmStrToSen(l.amountRM),
      basis: l.basis,
    })),
    doubleDeductions: eng.doubleDeductions.map((l) => ({
      description: l.description || "(unnamed)",
      amountSen: rmStrToSen(l.amountRM),
      authority: l.authority,
      code: l.code || undefined,
      capSen: l.capRM === "" ? undefined : rmStrToSen(l.capRM),
    })),
    assets: eng.assets.map(toAssetInput),
    nonBusiness: eng.nonBusiness.map((l) => ({
      label: l.label || "(unnamed)",
      amountSen: rmStrToSen(l.amountRM),
    })),
    whtLines: eng.whtLines.map((l) => ({
      description: l.description || "(unnamed)",
      amountSen: rmStrToSen(l.amountRM),
      section: isWhtSection(l.section) ? l.section : "s.109B",
      remitted: l.remitted,
    })),
    deemedInterestSen: deemed140B(eng).totalSen,
    relatedInterestSen: rmStrToSen(eng.relatedInterestRM),
    taxEbitdaSen: rmStrToSen(eng.taxEbitdaRM),
    raQeSen: rmStrToSen(eng.raQeRM),
    raBfSen: rmStrToSen(eng.raBfRM),
    itaAllowanceSen: rmStrToSen(eng.itaAllowanceRM),
    itaBfSen: rmStrToSen(eng.itaBfRM),
    itaPct: eng.itaPct === "100" ? 100 : 70,
    pioneerExemptSen: rmStrToSen(eng.pioneerExemptRM),
    groupSurrenderedSen: rmStrToSen(eng.groupSurrenderedRM),
    groupSurrendererLossSen: rmStrToSen(eng.groupSurrendererLossRM),
    groupConditionsMet: eng.groupConditionsMet,
    isIhc: eng.isIhc,
    schedule3Override: o.enabled
      ? {
          caSen: rmStrToSen(o.caRM),
          balancingChargeSen: rmStrToSen(o.bcRM),
          balancingAllowanceSen: rmStrToSen(o.baRM),
          residualBfSen: rmStrToSen(o.reBfRM),
          additionsSen: rmStrToSen(o.additionsRM),
          disposedReSen: rmStrToSen(o.disposedReRM),
          residualCfSen: rmStrToSen(o.reCfRM),
          note: o.note || "external schedule",
        }
      : undefined,
    donationsSen: rmStrToSen(eng.donationsRM),
    zakatSen: rmStrToSen(eng.zakatRM),
    currentLossOffsetSen: rmStrToSen(eng.currentLossOffsetRM),
    bfLosses: eng.bfLosses.map((l) => ({
      yearOfAssessment: numOr0(l.ya),
      amountBfSen: rmStrToSen(l.amountRM),
    })),
    unabsorbedCaBfSen: rmStrToSen(eng.unabsorbedCaBfRM),
    cp204EstimateSen: rmStrToSen(eng.cp204EstimateRM),
    cp204PaidSen: rmStrToSen(eng.cp204PaidRM),
    whtCreditSen: rmStrToSen(eng.whtCreditRM),
    bilateralCreditSen: rmStrToSen(eng.bilateralCreditRM),
    priorCreditSen: eng.priorCreditVerified ? rmStrToSen(eng.priorCreditRM) : 0,
  };
}

// Pure computation — safe to call from verification, rollover, tests.
// Builds FormCInput once; asset rows come from the Schedule 3 Module
// (same Seam as the pipeline, no duplicated small-value accumulator).
export function computeEngagement(eng: Engagement): {
  result: ReturnType<typeof computeFormC>;
  assetRows: ReturnType<typeof computeSchedule3>["rows"];
} {
  const input = buildFormCInput(eng);
  const result = computeFormC(input);
  if (input.schedule3Override) return { result, assetRows: [] };
  const smeRes = checkSme(input.sme);
  const { rows } = computeSchedule3(input.assets, smeRes.qualifies);
  return { result, assetRows: rows };
}

type Schedulable = Pick<
  BusinessUnit,
  "addBacks" | "credits" | "doubleDeductions" | "assets" | "schedule3"
>;

// P&L line mapping shared by businesses and firms — one RM→sen pass,
// identical section/basis/cap/override conventions on both adapters.
function schedulableInput(x: Schedulable): {
  addBacks: { description: string; amountSen: number; section: AddBackLine["section"] }[];
  credits: { description: string; amountSen: number; basis: string }[];
  doubleDeductions: {
    description: string;
    amountSen: number;
    authority: string;
    code: string | undefined;
    capSen: number | undefined;
  }[];
  assets: ReturnType<typeof toAssetInput>[];
  schedule3Override:
    | {
        caSen: number;
        balancingChargeSen: number;
        balancingAllowanceSen: number;
        residualBfSen: number;
        additionsSen: number;
        disposedReSen: number;
        residualCfSen: number;
        note: string;
      }
    | undefined;
} {
  const o = x.schedule3;
  return {
    addBacks: x.addBacks.map((l) => ({
      description: l.description || "(unnamed)",
      amountSen: rmStrToSen(l.amountRM),
      section: l.section,
    })),
    credits: x.credits.map((l) => ({
      description: l.description || "(unnamed)",
      amountSen: rmStrToSen(l.amountRM),
      basis: l.basis,
    })),
    doubleDeductions: x.doubleDeductions.map((l) => ({
      description: l.description || "(unnamed)",
      amountSen: rmStrToSen(l.amountRM),
      authority: l.authority,
      code: l.code || undefined,
      capSen: l.capRM === "" ? undefined : rmStrToSen(l.capRM),
    })),
    assets: x.assets.map(toAssetInput),
    schedule3Override: o.enabled
      ? {
          caSen: rmStrToSen(o.caRM),
          balancingChargeSen: rmStrToSen(o.bcRM),
          balancingAllowanceSen: rmStrToSen(o.baRM),
          residualBfSen: rmStrToSen(o.reBfRM),
          additionsSen: rmStrToSen(o.additionsRM),
          disposedReSen: rmStrToSen(o.disposedReRM),
          residualCfSen: rmStrToSen(o.reCfRM),
          note: o.note || "external schedule",
        }
      : undefined,
  };
}

export function toBusinessInput(b: BusinessUnit): FormBInput["businesses"][number] {
  return {
    label: b.label || "(unnamed business)",
    netProfitSen: rmStrToSen(b.netProfitRM),
    ...schedulableInput(b),
    unabsorbedCaBfSen: rmStrToSen(b.unabsorbedCaBfRM),
  };
}

// Form B bridge: per-business statutory + partnership shares + employment +
// reliefs + rebates + CP500. Partnership LOSS shares (negative allocatedRM)
// behave as current-year loss offsets; profit shares aggregate as income.
export function buildFormBInput(eng: Engagement): FormBInput {
  const { profitSen, lossSen } = splitShares(eng);
  return {
    ya: eng.ya,
    businesses: eng.businesses.map(toBusinessInput),
    partnershipShareSen: profitSen,
    employmentSen: rmStrToSen(eng.employmentRM),
    nonBusiness: eng.nonBusiness.map((l) => ({
      label: l.label || "(unnamed)",
      amountSen: rmStrToSen(l.amountRM),
    })),
    donationsSen: rmStrToSen(eng.donationsRM),
    currentLossOffsetSen: rmStrToSen(eng.currentLossOffsetRM) + lossSen,
    bfLosses: eng.bfLosses.map((l) => ({
      yearOfAssessment: numOr0(l.ya),
      amountBfSen: rmStrToSen(l.amountRM),
    })),
    reliefs: eng.reliefs.map((l) => ({
      key: l.key,
      label: l.label || l.key,
      amountSen: rmStrToSen(l.amountRM),
      capSen: l.capRM === "" ? undefined : rmStrToSen(l.capRM),
    })),
    rebatesSen: rmStrToSen(eng.rebatesRM),
    cp500PaidSen: rmStrToSen(eng.cp500PaidRM),
    whtCreditSen: rmStrToSen(eng.whtCreditRM),
    bilateralCreditSen: rmStrToSen(eng.bilateralCreditRM),
    priorCreditSen: eng.priorCreditVerified ? rmStrToSen(eng.priorCreditRM) : 0,
  };
}

export function computeEngagementB(eng: Engagement): {
  result: ReturnType<typeof computeFormB>;
} {
  return { result: computeFormB(buildFormBInput(eng)) };
}

// Signed partner-share split shared by the Form B bridge and the export:
// profit shares aggregate as income, loss shares as current-year offsets.
export function splitShares(eng: Engagement): { profitSen: Sen; lossSen: Sen } {
  let profitSen = 0;
  let lossSen = 0;
  for (const s of eng.partnerShares) {
    const sen = signedRmToSen(s.allocatedRM);
    if (sen >= 0) profitSen += sen;
    else lossSen += -sen;
  }
  return { profitSen, lossSen };
}

// Filing heads for any form: C/B chargeable→gross→payable; P reports
// divisional with no tax (information return).
export function headsOf(eng: Engagement): { ciSen: Sen; taxSen: Sen; payableSen: Sen } {
  if (eng.formType === "P") {
    const divisional = computeEngagementP(eng).results.reduce((a, r) => a + r.statutorySen, 0);
    return { ciSen: divisional, taxSen: 0, payableSen: 0 };
  }
  const { result } = eng.formType === "B" ? computeEngagementB(eng) : computeEngagement(eng);
  return { ciSen: result.chargeableSen, taxSen: result.grossTaxSen, payableSen: result.taxPayableSen };
}

export function toPartnershipInput(f: PartnershipFirm): PartnershipInput {
  return {
    label: f.name || "(unnamed firm)",
    netProfitSen: signedRmToSen(f.netProfitRM),
    ...schedulableInput(f),
    unabsorbedCaBfSen: rmStrToSen(f.unabsorbedCaBfRM),
    partners: f.partners.map((p) => ({
      name: p.name || "(unnamed partner)",
      salarySen: rmStrToSen(p.salaryRM),
      interestSen: rmStrToSen(p.interestRM),
      ratioPct: numOr0(p.ratioPct),
    })),
  };
}

export function computeEngagementP(eng: Engagement): {
  results: ReturnType<typeof computePartnership>[];
} {
  return { results: eng.partnerships.map((f) => computePartnership(toPartnershipInput(f))) };
}

// Computation bridge diagnostics (Error at Seam): malformed non-blank RM
// inputs are coerced to 0 by parseRm — this lists what was coerced so the
// UI can warn. Empty strings are untouched fields, not errors.
export function diagnoseRmInputs(eng: Engagement): string[] {
  const fields: [string, string][] = [
    ["P&L net profit", eng.netProfitRM],
    ["Paid-up capital", eng.paidUpRM],
    ["Gross business income", eng.grossIncRM],
    ["Donations", eng.donationsRM],
    ["Zakat", eng.zakatRM],
    ["CP204 estimate", eng.cp204EstimateRM],
    ["CP204 paid", eng.cp204PaidRM],
    ["WHT credit", eng.whtCreditRM],
    ["Bilateral credit", eng.bilateralCreditRM],
    ["Prior-YA credits", eng.priorCreditRM],
    ["RA QE", eng.raQeRM],
    ["RA b/f", eng.raBfRM],
    ["ITA allowance", eng.itaAllowanceRM],
    ["ITA b/f", eng.itaBfRM],
    ["Pioneer exempt", eng.pioneerExemptRM],
    ["Group surrendered", eng.groupSurrenderedRM],
    ["Surrenderer loss", eng.groupSurrendererLossRM],
    ["Related interest", eng.relatedInterestRM],
    ["Tax EBITDA", eng.taxEbitdaRM],
    ["Unabsorbed CA b/f", eng.unabsorbedCaBfRM],
    ["Current-year loss offset", eng.currentLossOffsetRM],
    ["FA register total", eng.registerTotalRM],
    ["Sch3 CA", eng.schedule3.caRM],
    ["Sch3 BC", eng.schedule3.bcRM],
    ["Sch3 BA", eng.schedule3.baRM],
    ["Sch3 RE b/f", eng.schedule3.reBfRM],
    ["Sch3 additions", eng.schedule3.additionsRM],
    ["Sch3 disposed RE", eng.schedule3.disposedReRM],
    ["Sch3 RE c/f", eng.schedule3.reCfRM],
    ["Prior CI", eng.priorYear.ciRM],
    ["Prior tax", eng.priorYear.taxRM],
    ["Prior CA", eng.priorYear.caRM],
    ["Prior losses b/f", eng.priorYear.lossesBfRM],
    ["Prior unabsorbed CA", eng.priorYear.unabsorbedCaBfRM],
    ["Prior RE b/f", eng.priorYear.reBfRM],
    ["CP500 estimate", eng.cp500EstimateRM],
    ["CP500 paid", eng.cp500PaidRM],
    ["Employment income", eng.employmentRM],
    ["Rebates (zakat fitrah)", eng.rebatesRM],
    ...eng.reliefs.map((l, i): [string, string] => [`Relief ${l.label || `#${i + 1}`}`, l.amountRM]),
    ...eng.partnerShares.flatMap((l, i): [string, string][] =>
      signedIssue(`Partnership share #${i + 1}`, l.allocatedRM)
    ),
    ...eng.partnerships.flatMap((f, i): [string, string][] => [
      ...signedIssue(`Firm ${f.name || `#${i + 1}`} net profit`, f.netProfitRM),
      [`Firm ${f.name || `#${i + 1}`} unabsorbed CA b/f`, f.unabsorbedCaBfRM],
      ...f.addBacks.map((l, j): [string, string] => [`Firm #${i + 1} add-back #${j + 1}`, l.amountRM]),
      ...f.credits.map((l, j): [string, string] => [`Firm #${i + 1} credit #${j + 1}`, l.amountRM]),
    ]),
    ...eng.businesses.flatMap((b, i): [string, string][] => [
      [`Business ${b.label || `#${i + 1}`} net profit`, b.netProfitRM],
      [`Business ${b.label || `#${i + 1}`} unabsorbed CA b/f`, b.unabsorbedCaBfRM],
      ...b.addBacks.map((l, j): [string, string] => [`Business #${i + 1} add-back #${j + 1}`, l.amountRM]),
      ...b.credits.map((l, j): [string, string] => [`Business #${i + 1} credit #${j + 1}`, l.amountRM]),
    ]),
    ...eng.addBacks.map((l, i): [string, string] => [`Add-back #${i + 1}`, l.amountRM]),
    ...eng.credits.map((l, i): [string, string] => [`Credit #${i + 1}`, l.amountRM]),
    ...eng.doubleDeductions.flatMap((l, i): [string, string][] => [
      [`Double deduction #${i + 1}`, l.amountRM],
      ...(l.capRM !== "" ? [[`Double deduction #${i + 1} cap`, l.capRM] as [string, string]] : []),
    ]),
    ...eng.nonBusiness.map((l, i): [string, string] => [`Source #${i + 1}`, l.amountRM]),
    ...eng.whtLines.map((l, i): [string, string] => [`WHT #${i + 1}`, l.amountRM]),
    ...eng.bfLosses.map((l, i): [string, string] => [`B/F loss #${i + 1}`, l.amountRM]),
    ...eng.nonQualifying.map((l, i): [string, string] => [`Non-qualifying #${i + 1}`, l.amountRM]),
    ...eng.directors.flatMap((d, i): [string, string][] => [
      [`Director #${i + 1} salary`, d.salaryRM],
      [`Director #${i + 1} loan`, d.loanRM],
    ]),
    ...eng.cp204Bills.map((b, i): [string, string] => [`CP204 bill #${i + 1}`, b.amountRM]),
    ...eng.assets.flatMap((a): [string, string][] => [
      [`Asset ${a.description || a.id} cost`, a.costRM],
      [`Asset ${a.description || a.id} allowances b/f`, a.allowancesBfRM],
      [`Asset ${a.description || a.id} disposal`, a.disposalPriceRM],
      [`Asset ${a.description || a.id} motor cost`, a.motorTotalCostRM],
      [`Asset ${a.description || a.id} HP period`, a.hpPaidPeriodRM],
      [`Asset ${a.description || a.id} HP total`, a.hpPaidTotalRM],
    ]),
  ];
  const issues: string[] = [];
  for (const [label, v] of fields) {
    const r = parseRm(v);
    if (r.error) issues.push(`${label}: ${r.error}`);
  }
  return issues;
}

export function useComputation(eng: Engagement): {
  result: ReturnType<typeof computeFormC>;
  assetRows: ReturnType<typeof computeSchedule3>["rows"];
} {
  return useMemo(() => computeEngagement(eng), [eng]);
}
