import { blankMyTaxProfile, evaluateCoverage } from "@formc/engine";
import type { MyTaxProfile } from "@formc/engine";
import { useComputation } from "./computation.js";
import { CHECKLIST } from "./constants.js";
import { rmStrToSen } from "./rm.js";
import type { Engagement } from "./types.js";

const PNL_TIED_INDEX = CHECKLIST.findIndex((s) => s.startsWith("P&L net profit"));
const pnlTiedChecked = (eng: Engagement): boolean =>
  PNL_TIED_INDEX < 0 ? false : eng.checks[PNL_TIED_INDEX] === true;

export function mytaxOf(eng: Engagement): MyTaxProfile {
  return (eng as Partial<Engagement>).mytax ?? blankMyTaxProfile();
}

export function useMyTaxCoverage(eng: Engagement) {
  const { result } = useComputation(eng);
  const profile = mytaxOf(eng);
  const netProfitTied =
    pnlTiedChecked(eng) && rmStrToSen(eng.netProfitRM) !== 0;
  const out = evaluateCoverage({
    profile,
    directors: eng.directors.map((d) => ({ name: d.name })),
    shareholders: eng.shareholders.map((s) => ({ name: s.name })),
    smeQualifies: result.smeQualifies,
    portalSmeBand: (eng as Partial<Engagement>).portalSmeBand ?? "",
    chargeableSen: result.chargeableSen,
    grossTaxSen: result.grossTaxSen,
    netProfitTied,
    kewanganTied: (eng as Partial<Engagement>).kewanganTied ?? false,
    checklistDone: eng.checks.every(Boolean),
  });
  return { ...out, result, profile };
}
