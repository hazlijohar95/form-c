import { useMemo } from "react";
import {
  assessRelatedAccount,
  checkSme,
  computeFormC,
  computeSchedule3,
  isWhtSection,
  WHT_SECTIONS,
} from "@formc/engine";
import type { FormCInput } from "@formc/engine";
import { rmStrToSen, numOr0, parseRm } from "./rm.js";
import { toAssetInput } from "./types.js";
import type { Engagement } from "./types.js";

export { WHT_SECTIONS };
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

// Computation bridge diagnostics (Error at Seam): malformed non-blank RM
// inputs are coerced to 0 by parseRm — this lists what was coerced so the
// UI can warn. Empty strings are untouched fields, not errors.
export function diagnoseRmInputs(eng: Engagement): string[] {
  const fields: [string, string][] = [
    ["P&L net profit", eng.netProfitRM],
    ["Donations", eng.donationsRM],
    ["Zakat", eng.zakatRM],
    ["CP204 estimate", eng.cp204EstimateRM],
    ["CP204 paid", eng.cp204PaidRM],
    ["RA QE", eng.raQeRM],
    ["RA b/f", eng.raBfRM],
    ["ITA allowance", eng.itaAllowanceRM],
    ["ITA b/f", eng.itaBfRM],
    ["Pioneer exempt", eng.pioneerExemptRM],
    ["Group surrendered", eng.groupSurrenderedRM],
    ["Related interest", eng.relatedInterestRM],
    ["Tax EBITDA", eng.taxEbitdaRM],
    ...eng.addBacks.map((l, i): [string, string] => [`Add-back #${i + 1}`, l.amountRM]),
    ...eng.assets.flatMap((a): [string, string][] => [
      [`Asset ${a.description || a.id} cost`, a.costRM],
      [`Asset ${a.description || a.id} allowances b/f`, a.allowancesBfRM],
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
