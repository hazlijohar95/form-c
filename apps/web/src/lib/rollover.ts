import { uid } from "./lists.js";
import { senToRMString } from "./rm.js";
import { blankEngagement } from "./types.js";
import type { Engagement } from "./types.js";
import type { FormCResult } from "@formc/engine";

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
