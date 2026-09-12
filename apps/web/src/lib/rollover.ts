import { uid } from "./lists.js";
import { senToRMString } from "./rm.js";
import { blankBusinessUnit, blankEngagement, blankPartnershipFirm, standardReliefLines } from "./types.js";
import type { Engagement, FormType } from "./types.js";
import type { FormBResult, FormCResult, PartnershipResult } from "@formc/engine";

export function plusOneYear(iso: string): string {
  const parts = iso.split("-");
  if (parts.length !== 3 || parts[0] === undefined || parts[1] === undefined || parts[2] === undefined)
    return iso;
  return `${Number(parts[0]) + 1}-${parts[1]}-${parts[2]}`;
}

export function rolloverEngagement(e: Engagement, result: FormCResult): Engagement {
  const lossCfTotal = result.lossCfSen.reduce((a, l) => a + l.amountBfSen, 0);
  return {
    ...blankEngagement(),
    id: uid(),
    companyName: e.companyName,
    regNo: e.regNo,
    ya: e.ya + 1,
    fyeFrom: plusOneYear(e.fyeFrom),
    fyeTo: plusOneYear(e.fyeTo),
    paidUpRM: e.paidUpRM,
    grossIncRM: e.grossIncRM,
    foreignPct: e.foreignPct,
    directors: e.directors.map((d) => ({ ...d, id: uid(), salaryRM: "", loanRM: "" })),
    shareholders: e.shareholders.map((s) => ({ ...s, id: uid() })),
    bfLosses: result.lossCfSen.map((l) => ({
      id: uid(),
      ya: String(l.yearOfAssessment),
      amountRM: senToRMString(l.amountBfSen),
    })),
    unabsorbedCaBfRM: senToRMString(result.unabsorbedCaCfSen),
    raBfRM: senToRMString(result.raCfSen),
    itaBfRM: senToRMString(result.itaCfSen),
    priorYear: {
      ciRM: senToRMString(result.chargeableSen),
      taxRM: senToRMString(result.grossTaxSen),
      caRM: senToRMString(result.totalCaSen),
      lossesBfRM: senToRMString(lossCfTotal),
      unabsorbedCaBfRM: senToRMString(result.unabsorbedCaCfSen),
      reBfRM: senToRMString(result.residualCfSen),
      agreed: false,
    },
  };
}

// Shared next-YA shell for B/P rollovers: same client, blank documents,
// prior-year agreement reset. C keeps its own header (it carries incentive
// b/f fields and predates the client link), so it stays separate.
function baseRollover(e: Engagement, formType: FormType): Engagement {
  const next = blankEngagement();
  return {
    ...next,
    id: uid(),
    formType,
    clientId: e.clientId,
    companyName: e.companyName,
    regNo: e.regNo,
    ya: e.ya + 1,
    fyeFrom: plusOneYear(e.fyeFrom),
    fyeTo: plusOneYear(e.fyeTo),
    documents: [],
  };
}

// Form P rollover: same client, next YA. Firms and partner names/ratios
// ride; P&L numbers reset; per-firm unabsorbed CA rides same source.
export function rolloverEngagementP(e: Engagement, results: PartnershipResult[]): Engagement {
  const caByIndex = results.map((r) => r.unabsorbedCaCfSen);
  return {
    ...baseRollover(e, "P"),
    partnerships: e.partnerships.map((f, i) => ({
      ...blankPartnershipFirm(f.name),
      unabsorbedCaBfRM: senToRMString(caByIndex[i] ?? 0),
      partners: f.partners.map((p) => ({ ...p, id: uid(), salaryRM: "", interestRM: "" })),
    })),
    priorYear: {
      ciRM: "",
      taxRM: "",
      caRM: "",
      lossesBfRM: "",
      unabsorbedCaBfRM: "",
      reBfRM: "",
      agreed: false,
    },
  };
}

// Form B rollover: same client, next YA. Per-business unabsorbed CA rides
// with its business; B/F losses ride with year-of-origin; P&L, reliefs,
// rebates and instalments reset (relief rows are re-seeded blank).
export function rolloverEngagementB(e: Engagement, result: FormBResult): Engagement {
  return {
    ...baseRollover(e, "B"),
    // Matched by INDEX (input order is preserved in result.businesses):
    // duplicate business labels must not cross-carry unabsorbed CA.
    businesses: e.businesses.map((b, i) => ({
      ...blankBusinessUnit(b.label),
      unabsorbedCaBfRM: senToRMString(result.businesses[i]?.unabsorbedCaCfSen ?? 0),
    })),
    partnerShares: e.partnerShares.map((s) => ({ ...s, id: uid(), allocatedRM: "", salaryRM: "", interestRM: "" })),
    reliefs: standardReliefLines(),
    bfLosses: result.lossCf.map((l) => ({
      id: uid(),
      ya: String(l.yearOfAssessment),
      amountRM: senToRMString(l.amountBfSen),
    })),
    priorYear: {
      ciRM: senToRMString(result.chargeableSen),
      taxRM: senToRMString(result.grossTaxSen),
      caRM: "",
      lossesBfRM: "",
      unabsorbedCaBfRM: "",
      reBfRM: "",
      agreed: false,
    },
  };
}
