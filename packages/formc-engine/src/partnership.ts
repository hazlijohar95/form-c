import type { Sen } from "./money.js";
import { formatRM } from "./money.js";
import { adjustedIncome } from "./adjustedIncome.js";
import type { AddBack, Deduction, DoubleDeduction } from "./adjustedIncome.js";
import { computeSchedule3 } from "./schedule3.js";
import type { Schedule3Override } from "./schedule3.js";
import type { AssetInput } from "./capitalAllowances.js";
import { allocatePartnershipShare } from "./individual.js";

// ---------------------------------------------------------------------------
// Form P (partnership information return): firm-level divisional income plus
// per-partner allocation. The firm computes adjusted income and Schedule 3
// exactly like a business source (non-SME small-value cap); each partner
// takes salary + interest off the top and the balance splits by ratio.
// Tax is charged at partner level (Form B) — this module never applies bands.
// ---------------------------------------------------------------------------

export interface FirmPartnerInput {
  name: string;
  salarySen: Sen;
  interestSen: Sen;
  ratioPct: number;
}

export interface PartnershipInput {
  label: string;
  netProfitSen: Sen;
  addBacks: AddBack[];
  credits: Deduction[];
  doubleDeductions: DoubleDeduction[];
  assets: AssetInput[];
  schedule3Override?: Schedule3Override;
  unabsorbedCaBfSen: Sen; // same firm source only, indefinite
  partners: FirmPartnerInput[];
}

export interface PartnerAllocation {
  name: string;
  salarySen: Sen;
  interestSen: Sen;
  balanceShareSen: Sen;
  totalSen: Sen;
}

export interface PartnershipResult {
  label: string;
  adjustedSen: Sen;
  totalCaSen: Sen;
  balancingChargeSen: Sen;
  balancingAllowanceSen: Sen;
  statutorySen: Sen; // firm divisional income; NEGATIVE = divisional loss apportioned to partners
  unabsorbedCaCfSen: Sen; // CA excess only — genuine trading losses flow through, never convert
  residualCfSen: Sen;
  scheduleRollSen: Sen;
  totalSalariesSen: Sen;
  totalInterestSen: Sen;
  ratioTotalPct: number;
  allocations: PartnerAllocation[];
  allocatedTotalSen: Sen;
  allocationDeltaSen: Sen; // 0 = allocations foot to divisional
  findings: string[];
}

export function computePartnership(input: PartnershipInput): PartnershipResult {
  const adjusted = adjustedIncome(input.netProfitSen, input.addBacks, input.credits, input.doubleDeductions);
  const sched = computeSchedule3(input.assets, false, input.schedule3Override);
  // CA can only shelter positive adjusted income (Para 75 discipline):
  // excess CA carries forward same firm source, while a genuine trading
  // loss stays a loss and apportions to partners (never converts to CA).
  const caAvail = sched.totalCaSen + input.unabsorbedCaBfSen;
  const absorbable = Math.min(caAvail, Math.max(0, adjusted));
  const unabsorbedCaCf = caAvail - absorbable;
  const statutory = adjusted - absorbable + sched.balancingChargeSen - sched.balancingAllowanceSen;

  const totalSalaries = input.partners.reduce((a, p) => a + p.salarySen, 0);
  const totalInterest = input.partners.reduce((a, p) => a + p.interestSen, 0);
  const ratioTotal = input.partners.reduce((a, p) => a + Math.min(100, Math.max(0, p.ratioPct)), 0);

  const allocations = input.partners.map((p) => {
    const total = allocatePartnershipShare({
      partnershipAdjustedSen: statutory,
      totalSalariesSen: totalSalaries,
      totalInterestSen: totalInterest,
      partnerSalarySen: p.salarySen,
      partnerInterestSen: p.interestSen,
      ratioPct: p.ratioPct,
    });
    return {
      name: p.name,
      salarySen: p.salarySen,
      interestSen: p.interestSen,
      balanceShareSen: total - p.salarySen - p.interestSen,
      totalSen: total,
    };
  });
  const allocatedTotal = allocations.reduce((a, x) => a + x.totalSen, 0);
  // Footing reference is divisional income itself: allocations foot to
  // statutory when ratios total 100% (modulo ±1 sen per partner from
  // per-partner rounding). A larger shortfall means balance is unallocated.
  const delta = allocatedTotal - statutory;

  const findings: string[] = [];
  if (input.partners.length > 0 && Math.abs(ratioTotal - 100) > 1e-9)
    findings.push(`Profit-sharing ratios sum to ${Number(ratioTotal.toFixed(4))}% — must total 100%`);
  if (sched.rollSen !== 0)
    findings.push(`Schedule roll-forward off by ${formatRM(sched.rollSen)}`);
  if (unabsorbedCaCf > 0)
    findings.push(`Unabsorbed CA ${formatRM(unabsorbedCaCf)} c/f same firm source`);

  return {
    label: input.label,
    adjustedSen: adjusted,
    totalCaSen: sched.totalCaSen,
    balancingChargeSen: sched.balancingChargeSen,
    balancingAllowanceSen: sched.balancingAllowanceSen,
    statutorySen: statutory,
    unabsorbedCaCfSen: unabsorbedCaCf,
    residualCfSen: sched.residualCfSen,
    scheduleRollSen: sched.rollSen,
    totalSalariesSen: totalSalaries,
    totalInterestSen: totalInterest,
    ratioTotalPct: ratioTotal,
    allocations,
    allocatedTotalSen: allocatedTotal,
    allocationDeltaSen: delta,
    findings,
  };
}
