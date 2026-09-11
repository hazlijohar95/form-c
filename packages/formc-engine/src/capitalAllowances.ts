import type { Sen } from "./money.js";
import { toSen } from "./money.js";
import { CAPS } from "./rates.js";

// Schedule 3, ITA 1967 — straight-line on ORIGINAL qualifying expenditure.
// AA each year = QE x rate (capped at remaining residual), NOT reducing balance.
// Reference model: per-asset straight-line Schedule 3 computation.

export type CaCategory =
  | "cat1-20" // heavy machinery, motor vehicles: 20% AA
  | "cat2-14" // general plant: 14% AA
  | "cat3-10" // office/furniture: 10% AA
  | "ict-std" // computers: 40% IA / 20% AA
  | "aca2026" // Budget 2026 local machinery + ICT: 20% IA / 40% AA
  | "small-value" // 100% write-off (new assets only, QE <= RM2k)
  | "iba-3"; // industrial building: 10% IA / 3% AA

export interface AssetInput {
  id: string;
  description: string;
  category: CaCategory;
  /** Original qualifying expenditure (cost). For new assets this is the addition. */
  costSen: Sen;
  /** Allowances given in prior YAs (IA+AA+SVA). 0 for new assets. */
  allowancesBfSen: Sen;
  isNew: boolean;
  isHirePurchase: boolean;
  /** HP: capital portion PAID this period. QE basis = cumulative paid. */
  hpPaidPeriodSen?: Sen;
  hpPaidTotalSen?: Sen;
  isMotorNonCommercial: boolean;
  motorTotalCostRM?: number;
  isCommercialVehicle?: boolean;
  ownedAtYearEnd: boolean;
  inUseAtYearEnd: boolean;
  monthsInUse?: number; // short basis period: AA pro-rated, IA in full
  disposalPriceSen?: Sen;
}

export interface AssetResult {
  id: string;
  description: string;
  residualBfSen: Sen;
  additionSen: Sen;
  iaSen: Sen;
  aaSen: Sen;
  svaSen: Sen;
  totalCaSen: Sen;
  disposedReSen: Sen;
  residualCfSen: Sen;
  balancingChargeSen: Sen;
  balancingAllowanceSen: Sen;
  notes: string[];
}

const IA_RATE: Record<CaCategory, number> = {
  "cat1-20": 0.2,
  "cat2-14": 0.2,
  "cat3-10": 0.2,
  "ict-std": 0.4,
  aca2026: 0.2,
  "small-value": 0,
  "iba-3": 0.1,
};

const AA_RATE: Record<CaCategory, number> = {
  "cat1-20": 0.2,
  "cat2-14": 0.14,
  "cat3-10": 0.1,
  "ict-std": 0.2,
  aca2026: 0.4,
  "small-value": 0,
  "iba-3": 0.03,
};

export function capMotorQe(costSen: Sen, asset: Pick<AssetInput, "isMotorNonCommercial" | "isCommercialVehicle" | "motorTotalCostRM">): Sen {
  if (!asset.isMotorNonCommercial || asset.isCommercialVehicle) return costSen;
  const totalCost = asset.motorTotalCostRM ?? 0;
  const capRM =
    totalCost > 0 && totalCost <= CAPS.motorNewTotalCostRM
      ? CAPS.motorNewQeRM // new test needs isNew; caller passes capped cost already — see below
      : CAPS.motorGeneralQeRM;
  return Math.min(costSen, toSen(capRM));
}

export function computeAsset(
  a: AssetInput,
  isSme: boolean,
  smallValueUsedSen: Sen,
  isNewVehicle?: boolean
): AssetResult {
  const notes: string[] = [];
  let qe = a.costSen;
  if (a.isHirePurchase) {
    // Para 46: QE in any period = capital paid in that period (interest excluded).
    // Allowances run on cumulative paid to date; IA on first-paid amount.
    if (a.hpPaidTotalSen === undefined || a.hpPaidPeriodSen === undefined) {
      notes.push("DATA: HP asset needs capital paid (period + cumulative) — skipped");
      return zero(a, 0, 0, notes);
    }
    notes.push("Hire purchase: allowances on capital paid to date (Para 46)");
    const paidTotal = a.hpPaidTotalSen;
    const paidPeriod = a.hpPaidPeriodSen;
    const hpCat: CaCategory =
      a.category === "small-value" ? "cat2-14" : a.category;
    return hpRates(a, hpCat, paidTotal, paidPeriod, isSme, smallValueUsedSen, notes, qe);
  }
  if (a.isMotorNonCommercial && !a.isCommercialVehicle) {
    const totalCost = a.motorTotalCostRM ?? 0;
    const capRM =
      a.isNew && isNewVehicle !== false && totalCost > 0 && totalCost <= CAPS.motorNewTotalCostRM
        ? CAPS.motorNewQeRM
        : CAPS.motorGeneralQeRM;
    const capped = Math.min(qe, toSen(capRM));
    if (capped < qe) notes.push(`Motor QE capped at RM${capRM.toLocaleString()} (Sch 3 Para 2(2))`);
    qe = capped;
  }

  const residualBf = a.isNew ? 0 : Math.max(0, qe - a.allowancesBfSen);
  if (!a.isNew && a.allowancesBfSen > qe)
    notes.push("DATA: allowances b/f exceed cost — opening position inconsistent");
  const addition = a.isNew ? qe : 0;

  if (a.isHirePurchase && a.category === "small-value") {
    notes.push("HP excluded from Para 19A (PR 1/2008) — Cat 2 rates applied");
  }
  const cat: CaCategory =
    a.isHirePurchase && a.category === "small-value" ? "cat2-14" : a.category;

  // Disposal: no IA/AA in year of disposal (Sch 3 Para 15 — not in use at year end).
  if (a.disposalPriceSen !== undefined) {
    let disposal = a.disposalPriceSen;
    if (a.isMotorNonCommercial && a.costSen > 0 && qe < a.costSen) {
      disposal = Math.round((disposal * qe) / a.costSen);
      notes.push("Disposal proportioned (Para 62, capped motor)");
    }
    const bc = Math.min(Math.max(disposal - residualBf, 0), a.allowancesBfSen);
    const ba = Math.max(residualBf - disposal, 0);
    if (bc > 0) notes.push(`Balancing charge (capped at allowances given, Para 37)`);
    if (ba > 0) notes.push("Balancing allowance");
    return {
      id: a.id,
      description: a.description,
      residualBfSen: residualBf,
      additionSen: addition,
      iaSen: 0,
      aaSen: 0,
      svaSen: 0,
      totalCaSen: 0,
      disposedReSen: residualBf,
      residualCfSen: 0,
      balancingChargeSen: bc,
      balancingAllowanceSen: ba,
      notes,
    };
  }

  if (!a.ownedAtYearEnd || !a.inUseAtYearEnd) {
    notes.push("No allowances: not owned and in use at year end (Para 13/14)");
    return zero(a, residualBf, addition, notes);
  }

  // Para 19A small value: NEW assets only, QE <= RM2,000, SME uncapped.
  const svaEligible =
    cat === "small-value" && a.isNew && qe <= toSen(CAPS.smallValuePerAssetRM);
  if (cat === "small-value" && (!a.isNew || qe > toSen(CAPS.smallValuePerAssetRM)))
    notes.push("Para 19A requires new asset with QE <= RM2,000 — normal rates applied");
  const useCat: CaCategory = svaEligible ? "small-value" : cat === "small-value" ? "cat2-14" : cat;
  if (svaEligible && !isSme && smallValueUsedSen + qe > toSen(CAPS.smallValueAnnualCapNonSmeRM)) {
    notes.push("Small-value cap RM20k/YA exceeded (non-SME) — normal rates on excess");
    return normalRates(a, useCat === "small-value" ? "cat2-14" : useCat, qe, residualBf, addition, notes);
  }
  if (svaEligible && (isSme || smallValueUsedSen + qe <= toSen(CAPS.smallValueAnnualCapNonSmeRM))) {
    notes.push("Para 19A 100% write-off" + (isSme ? " (SME, no cap)" : ""));
    return {
      id: a.id,
      description: a.description,
      residualBfSen: residualBf,
      additionSen: addition,
      iaSen: 0,
      aaSen: 0,
      svaSen: qe,
      totalCaSen: qe,
      disposedReSen: 0,
      residualCfSen: 0,
      balancingChargeSen: 0,
      balancingAllowanceSen: 0,
      notes,
    };
  }

  return normalRates(a, useCat, qe, residualBf, addition, notes);
}

function zero(a: AssetInput, residualBf: Sen, addition: Sen, notes: string[]): AssetResult {
  return {
    id: a.id,
    description: a.description,
    residualBfSen: residualBf,
    additionSen: addition,
    iaSen: 0,
    aaSen: 0,
    svaSen: 0,
    totalCaSen: 0,
    disposedReSen: 0,
    residualCfSen: residualBf + addition,
    balancingChargeSen: 0,
    balancingAllowanceSen: 0,
    notes,
  };
}

// Hire-purchase: QE base = cumulative capital paid; IA on first-period
// payment; AA straight-line on paid-to-date, capped at remaining.
function hpRates(
  a: AssetInput,
  cat: CaCategory,
  paidTotal: Sen,
  paidPeriod: Sen,
  isSme: boolean,
  smallValueUsedSen: Sen,
  notes: string[],
  fullCost: Sen
): AssetResult {
  void isSme;
  void smallValueUsedSen;
  void fullCost;
  if (a.isMotorNonCommercial && !a.isCommercialVehicle) {
    const totalCost = a.motorTotalCostRM ?? 0;
    const capRM =
      a.isNew && totalCost > 0 && totalCost <= CAPS.motorNewTotalCostRM
        ? CAPS.motorNewQeRM
        : CAPS.motorGeneralQeRM;
    if (paidTotal > toSen(capRM)) {
      notes.push(`Motor QE capped at RM${capRM.toLocaleString()} (Para 2(2))`);
      paidTotal = toSen(capRM);
      paidPeriod = Math.min(paidPeriod, paidTotal);
    }
  }
  if (a.disposalPriceSen !== undefined) {
    const residualBf = Math.max(0, paidTotal - paidPeriod - a.allowancesBfSen);
    const bc = Math.min(Math.max(a.disposalPriceSen - residualBf, 0), a.allowancesBfSen);
    return {
      id: a.id, description: a.description, residualBfSen: residualBf,
      additionSen: paidPeriod, iaSen: 0, aaSen: 0, svaSen: 0, totalCaSen: 0,
      disposedReSen: residualBf, residualCfSen: 0,
      balancingChargeSen: bc, balancingAllowanceSen: Math.max(residualBf - a.disposalPriceSen, 0),
      notes: [...notes, "No allowances in year of disposal (Para 15)"],
    };
  }
  if (!a.ownedAtYearEnd || !a.inUseAtYearEnd)
    return zero(a, Math.max(0, paidTotal - paidPeriod - a.allowancesBfSen), paidPeriod, [...notes, "Not owned/in use at year end"]);
  const residualBf = Math.max(0, paidTotal - paidPeriod - a.allowancesBfSen);
  const ia = a.isNew ? Math.round(paidPeriod * IA_RATE[cat]) : 0;
  const remaining = residualBf + paidPeriod - ia;
  let aa = Math.min(Math.round(paidTotal * AA_RATE[cat]), Math.max(0, remaining));
  if (a.monthsInUse !== undefined && a.monthsInUse < 12) {
    aa = Math.round((aa * a.monthsInUse) / 12);
    notes.push(`AA pro-rated ${a.monthsInUse}/12 (short basis period)`);
  }
  return {
    id: a.id, description: a.description, residualBfSen: residualBf,
    additionSen: paidPeriod, iaSen: ia, aaSen: aa, svaSen: 0,
    totalCaSen: ia + aa, disposedReSen: 0, residualCfSen: remaining - aa,
    balancingChargeSen: 0, balancingAllowanceSen: 0, notes,
  };
}

// Straight-line AA on ORIGINAL QE, capped at remaining residual (Para 18).
function normalRates(
  a: AssetInput,
  cat: CaCategory,
  qe: Sen,
  residualBf: Sen,
  addition: Sen,
  notes: string[]
): AssetResult {
  const ia = a.isNew ? Math.round(qe * IA_RATE[cat]) : 0;
  const remaining = residualBf + addition - ia;
  let aa = Math.min(Math.round(qe * AA_RATE[cat]), Math.max(0, remaining));
  if (a.monthsInUse !== undefined && a.monthsInUse < 12) {
    aa = Math.round((aa * a.monthsInUse) / 12);
    notes.push(`AA pro-rated ${a.monthsInUse}/12 (short basis period)`);
  }
  const total = ia + aa;
  return {
    id: a.id,
    description: a.description,
    residualBfSen: residualBf,
    additionSen: addition,
    iaSen: ia,
    aaSen: aa,
    svaSen: 0,
    totalCaSen: total,
    disposedReSen: 0,
    residualCfSen: remaining - aa,
    balancingChargeSen: 0,
    balancingAllowanceSen: 0,
    notes,
  };
}

// Schedule roll-forward control: RE b/f + additions − CA − disposed RE − RE c/f = 0.
export function scheduleRollForward(rows: AssetResult[]): Sen {
  return rows.reduce(
    (acc, r) => acc + r.residualBfSen + r.additionSen - r.totalCaSen - r.disposedReSen - r.residualCfSen,
    0
  );
}
