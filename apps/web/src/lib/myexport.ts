import { doubleTotal } from "@formc/engine";
import { CHECKLIST } from "./types.js";
import { rmStrToSen } from "./rm.js";
import { computeEngagement } from "./computation.js";
import type { Engagement } from "./types.js";

// Single source for the MyTax JSON export — Report's Copy button and the
// command palette action both use this, so the bytes are identical.
export function buildMytaxExport(eng: Engagement): string {
  const { result } = computeEngagement(eng);
  return JSON.stringify(
    {
      form: "C",
      ya: eng.ya,
      company: eng.companyName,
      regNo: eng.regNo,
      fyeFrom: eng.fyeFrom,
      fyeTo: eng.fyeTo,
      smeQualifies: result.smeQualifies,
      filingDeadline: result.filingDeadline,
      statutoryBeforeIncentivesSen: result.statutoryBeforeIncentivesSen,
      nonBusiness: eng.nonBusiness.map((l) => ({
        label: l.label,
        amountSen: rmStrToSen(l.amountRM),
      })),
      chargeableIncomeSen: result.chargeableSen,
      grossTaxSen: result.grossTaxSen,
      cp204PaidSen: rmStrToSen(eng.cp204PaidRM),
      taxPayableSen: result.taxPayableSen,
      netProfitSen: rmStrToSen(eng.netProfitRM),
      addBacks: eng.addBacks.map((l) => ({
        description: l.description,
        amountSen: rmStrToSen(l.amountRM),
        section: l.section,
      })),
      credits: eng.credits.map((l) => ({
        description: l.description,
        amountSen: rmStrToSen(l.amountRM),
        basis: l.basis,
      })),
      totalCaSen: result.totalCaSen,
      balancingChargeSen: result.balancingChargeSen,
      residualCfSen: result.residualCfSen,
      doubleDeductions: eng.doubleDeductions.map((l) => ({
        description: l.description,
        amountSen: rmStrToSen(l.amountRM),
        code: l.code,
        authority: l.authority,
      })),
      directors: eng.directors,
      shareholders: eng.shareholders,
      declarations: eng.declarations,
      checklist: CHECKLIST.map((c, i) => ({ item: c, done: eng.checks[i] })),
    },
    null,
    2
  );
}

/** Double-deduction total for one line (shared with Report rendering). */
export function doubleLineTotal(l: { description: string; amountRM: string; authority: string; capRM: string }): number {
  return doubleTotal([
    {
      description: l.description,
      amountSen: rmStrToSen(l.amountRM),
      authority: l.authority,
      capSen: l.capRM === "" ? undefined : rmStrToSen(l.capRM),
    },
  ]);
}
