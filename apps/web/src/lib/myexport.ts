import { doubleTotal } from "@formc/engine";
import { checklistFor } from "./types.js";
import { rmStrToSen } from "./rm.js";
import { computeEngagement, computeEngagementB, computeEngagementP, splitShares } from "./computation.js";
import type { Engagement } from "./types.js";

// Single source for the MyTax JSON export — Report's Copy button and the
// command palette action both use this, so the bytes are identical.
export function buildMytaxExport(eng: Engagement): string {
  if (eng.formType === "B") return buildMytaxExportB(eng);
  if (eng.formType === "P") return buildMytaxExportP(eng);
  const { result } = computeEngagement(eng);
  return JSON.stringify(
    {
      form: eng.formType,
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
      checklist: checklistFor(eng.formType).map((c, i) => ({ item: c, done: eng.checks[i] })),
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

// Form P export: firm divisional computations + partner allocation
// schedules. Same envelope so the skill gates uniformly.
export function buildMytaxExportP(eng: Engagement): string {
  const { results } = computeEngagementP(eng);
  return JSON.stringify(
    {
      form: "P",
      ya: eng.ya,
      company: eng.companyName,
      regNo: eng.regNo,
      fyeFrom: eng.fyeFrom,
      fyeTo: eng.fyeTo,
      firms: results.map((r) => ({
        label: r.label,
        adjustedSen: r.adjustedSen,
        totalCaSen: r.totalCaSen,
        statutorySen: r.statutorySen,
        unabsorbedCaCfSen: r.unabsorbedCaCfSen,
        ratioTotalPct: r.ratioTotalPct,
        allocations: r.allocations,
        allocatedTotalSen: r.allocatedTotalSen,
        allocationDeltaSen: r.allocationDeltaSen,
      })),
      divisionalTotalSen: results.reduce((a, r) => a + r.statutorySen, 0),
      checklist: checklistFor(eng.formType).map((c, i) => ({ item: c, done: eng.checks[i] })),
    },
    null,
    2
  );
}
// Form B export: per-business statutory + reliefs + rebates + CP500.
// Same envelope (form/ya/company/checklist) so the skill gates uniformly.
export function buildMytaxExportB(eng: Engagement): string {
  const { result } = computeEngagementB(eng);
  const { profitSen: partnershipShareSen, lossSen: partnershipLossShareSen } = splitShares(eng);
  return JSON.stringify(
    {
      form: "B",
      ya: eng.ya,
      company: eng.companyName,
      regNo: eng.regNo,
      fyeFrom: eng.fyeFrom,
      fyeTo: eng.fyeTo,
      businesses: result.businesses.map((b) => ({
        label: b.label,
        adjustedSen: b.adjustedSen,
        totalCaSen: b.totalCaSen,
        statutorySen: b.statutorySen,
        unabsorbedCaCfSen: b.unabsorbedCaCfSen,
      })),
      partnershipShareSen,
      partnershipLossShareSen,
      employmentSen: rmStrToSen(eng.employmentRM),
      nonBusiness: eng.nonBusiness.map((l) => ({
        label: l.label,
        amountSen: rmStrToSen(l.amountRM),
      })),
      aggregateSen: result.aggregateSen,
      reliefs: eng.reliefs.map((l) => ({
        key: l.key,
        label: l.label,
        amountSen: rmStrToSen(l.amountRM),
      })),
      reliefsAllowedSen: result.reliefsAllowedSen,
      reliefCapped: result.reliefCapped,
      chargeableIncomeSen: result.chargeableSen,
      grossTaxSen: result.grossTaxSen,
      rebatesAllowedSen: result.rebatesAllowedSen,
      cp500PaidSen: rmStrToSen(eng.cp500PaidRM),
      whtCreditSen: rmStrToSen(eng.whtCreditRM),
      bilateralCreditSen: rmStrToSen(eng.bilateralCreditRM),
      taxPayableSen: result.taxPayableSen,
      netCashSen: result.netCashSen,
      lossCf: result.lossCf,
      checklist: checklistFor(eng.formType).map((c, i) => ({ item: c, done: eng.checks[i] })),
    },
    null,
    2
  );
}
