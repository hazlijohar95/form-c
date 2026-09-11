import type { Sen } from "./money.js";
import { toSen } from "./money.js";
import { CAPS } from "./rates.js";
import type { AssetInput, AssetResult } from "./capitalAllowances.js";
import { computeAsset, isDataNote, overrideRollForward, scheduleRollForward } from "./capitalAllowances.js";

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

export interface Schedule3Totals {
  totalCaSen: Sen;
  balancingChargeSen: Sen;
  balancingAllowanceSen: Sen;
  residualCfSen: Sen;
  rollSen: Sen;
  notes: string[];
  rows: AssetResult[];
}

// Deepened Schedule 3 Module: single Seam for both Adapters
// (per-asset loop + external override). Small-value accumulator,
// motor caps, and roll-foot live inside the Implementation.
export function computeSchedule3(
  assets: AssetInput[],
  isSme: boolean,
  override?: Schedule3Override
): Schedule3Totals {
  if (override) {
    const roll = overrideRollForward(override);
    const notes: string[] = [`Schedule 3 per override: ${override.note}`];
    if (roll !== 0) notes.push(`Schedule 3 roll-forward off by ${roll} sen`);
    return {
      totalCaSen: override.caSen,
      balancingChargeSen: override.balancingChargeSen,
      balancingAllowanceSen: override.balancingAllowanceSen,
      residualCfSen: override.residualCfSen,
      rollSen: roll,
      notes,
      rows: [],
    };
  }
  let smallUsedSen = 0;
  let totalCa = 0;
  let bc = 0;
  let ba = 0;
  let reCf = 0;
  const notes: string[] = [];
  const rows: AssetResult[] = [];
  const capSen = toSen(CAPS.smallValueAnnualCapNonSmeRM);
  for (const a of assets) {
    const remaining = isSme ? null : Math.max(0, capSen - smallUsedSen);
    const r = computeAsset(a, { isSme, svaCapRemainingSen: remaining });
    rows.push(r);
    totalCa += r.totalCaSen;
    bc += r.balancingChargeSen;
    ba += r.balancingAllowanceSen;
    reCf += r.residualCfSen;
    if (a.category === "small-value") smallUsedSen += a.costSen;
    for (const n of r.notes) if (isDataNote(n)) notes.push(`${a.description}: ${n}`);
  }
  return {
    totalCaSen: totalCa,
    balancingChargeSen: bc,
    balancingAllowanceSen: ba,
    residualCfSen: reCf,
    rollSen: scheduleRollForward(rows),
    notes,
    rows,
  };
}

export function smallValueCapSen(isSme: boolean): Sen | null {
  return isSme ? null : toSen(CAPS.smallValueAnnualCapNonSmeRM);
}
