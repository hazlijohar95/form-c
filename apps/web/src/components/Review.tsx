import { formatRM, reliefCapFor } from "@formc/engine";
import { rmStrToSen } from "../lib/rm.js";
import { plural, updateById, removeById, uid } from "../lib/lists.js";
import { computeEngagement, computeEngagementB, computeEngagementP, diagnoseRmInputs } from "../lib/computation.js";
import { requiredDocsIn } from "../lib/onboarding.js";
import { LineTable } from "./LineTable.js";
import { RmInput } from "./RmInput.js";
import type { Engagement, Judgement, OpenItem } from "../lib/types.js";

type Patch = (p: Partial<Engagement>) => void;

interface Check {
  name: string;
  pass: boolean;
  detail: string;
}

// Shared verification atoms — C, B, and P word these identically so the
// review panel reads as one checklist no matter the return type.
function blockingCheck(eng: Engagement): Check {
  const open = eng.openItems.filter((o) => !o.resolved).length;
  return { name: "No unresolved blocking items", pass: open === 0, detail: open === 0 ? "clear" : `${open} open` };
}

function judgementsCheck(eng: Engagement): Check {
  const unsigned = eng.judgements.filter((j) => !j.signedOff).length;
  return { name: "Judgements signed off", pass: unsigned === 0, detail: unsigned === 0 ? "all signed" : `${unsigned} unsigned` };
}

function hpCheck(missing: number): Check {
  return { name: "HP assets carry paid figures", pass: missing === 0, detail: missing === 0 ? "complete" : `${missing} missing` };
}

function docsCheck(eng: Engagement): Check {
  const docs = requiredDocsIn(eng.documents);
  return {
    name: "Required source docs in",
    pass: docs.total > 0 && docs.done === docs.total,
    detail: docs.total === 0 ? "checklist not loaded" : `${docs.done}/${docs.total}`,
  };
}

export function verification(eng: Engagement): Check[] {
  const { result, assetRows } = computeEngagement(eng);
  const out: Check[] = [];
  const pbt = rmStrToSen(eng.netProfitRM);

  out.push({
    name: "CA deducted ties to schedule",
    pass: true,
    detail: `${formatRM(result.totalCaSen)} deducted`,
  });
  out.push({
    name: "Schedule roll-forward foots to zero",
    pass: result.scheduleRollSen === 0,
    detail: result.scheduleRollSen === 0 ? "0.00" : `off by ${formatRM(result.scheduleRollSen)}`,
  });
  out.push({
    name: "Para 75 — CA within adjusted income",
    pass: result.unabsorbedCaCfSen >= 0 && result.statutorySen >= 0,
    detail: result.unabsorbedCaCfSen > 0 ? `unabsorbed ${formatRM(result.unabsorbedCaCfSen)} c/f` : "no restriction",
  });
  const bfTotal = eng.bfLosses.reduce((a, l) => a + rmStrToSen(l.amountRM), 0);
  out.push({
    name: "Losses b/f agree to prior return",
    pass: eng.priorYear.agreed,
    detail: eng.priorYear.agreed ? `${formatRM(bfTotal)} agreed` : "prior year NOT marked agreed",
  });
  if (!eng.schedule3.enabled && eng.registerTotalRM !== "") {
    const qual = eng.assets.reduce((a, x) => a + rmStrToSen(x.costRM), 0);
    const nonQ = eng.nonQualifying.reduce((a, x) => a + rmStrToSen(x.amountRM), 0);
    const delta = qual + nonQ - rmStrToSen(eng.registerTotalRM);
    out.push({
      name: "Register tie — qualifying + non-qualifying = register total",
      pass: delta === 0,
      detail: delta === 0 ? formatRM(rmStrToSen(eng.registerTotalRM)) : `Δ ${formatRM(delta)}`,
    });
  }
  if (eng.priorYear.reBfRM !== "") {
    const schedReBf = eng.schedule3.enabled
      ? rmStrToSen(eng.schedule3.reBfRM)
      : assetRows.reduce((a, r) => a + r.residualBfSen, 0);
    const delta = schedReBf - rmStrToSen(eng.priorYear.reBfRM);
    out.push({
      name: "RE b/f agrees to prior-year position",
      pass: delta === 0,
      detail: delta === 0 ? "agreed" : `Δ ${formatRM(delta)} — modelled, obtain agent schedule`,
    });
  }
  if (pbt > 0) {
    const etr = (result.grossTaxSen / pbt) * 100;
    out.push({
      name: "Effective tax rate 10–35%",
      pass: etr >= 10 && etr <= 35,
      detail: `${etr.toFixed(1)}%`,
    });
  }
  const recompute = Math.floor(result.chargeableExactSen / 100) * 100;
  out.push({
    name: "CI truncation + rate recompute",
    pass: recompute === result.chargeableSen,
    detail: `${formatRM(result.chargeableExactSen)} → ${formatRM(result.chargeableSen)}`,
  });
  for (const a of eng.relatedAccounts) {
    const debits = a.balances.map((b, i) => ({ b: Number(b), i })).filter((x) => x.b < 0);
    if (a.balances.some((b) => b !== "") && debits.length > 0)
      out.push({ name: `s.140B — ${a.name || "related account"} in debit`, pass: false, detail: `months ${debits.map((d) => d.i + 1).join(", ")}` });
  }
  const billsTotal = eng.cp204Bills.reduce((a, b) => a + (b.paidOn ? rmStrToSen(b.amountRM) : 0), 0);
  if (eng.cp204Bills.length > 0)
    out.push({
      name: "CP204 bills tie to instalments paid",
      pass: billsTotal === rmStrToSen(eng.cp204PaidRM),
      detail: `bills ${formatRM(billsTotal)} vs paid ${formatRM(rmStrToSen(eng.cp204PaidRM))}`,
    });
  out.push(blockingCheck(eng));
  const hpMissing = eng.assets.filter((a) => a.isHirePurchase && (a.hpPaidPeriodRM === "" || a.hpPaidTotalRM === "")).length;
  out.push(hpCheck(hpMissing));
  out.push(judgementsCheck(eng));
  return out;
}

export function verificationB(eng: Engagement): Check[] {
  const { result } = computeEngagementB(eng);
  const out: Check[] = [];
  out.push({
    name: "At least one business entered",
    pass: eng.businesses.length > 0,
    detail: eng.businesses.length > 0 ? `${eng.businesses.length} ${plural(eng.businesses.length, "business")}` : "add one on the Entry tab",
  });
  const badRoll = result.businesses.filter((b) => b.scheduleRollSen !== 0).length;
  out.push({
    name: "Schedule roll-forward foots to zero",
    pass: badRoll === 0,
    detail: badRoll === 0 ? "0.00" : `${badRoll} off`,
  });
  const overCap = eng.reliefs.filter((l) => {
    const cap = reliefCapFor(l.key, l.capRM === "" ? undefined : rmStrToSen(l.capRM));
    return cap !== null && rmStrToSen(l.amountRM) > cap;
  }).length;
  out.push({
    name: "Reliefs within caps",
    pass: overCap === 0,
    detail: overCap === 0 ? `${formatRM(result.reliefsAllowedSen)} allowed` : `${overCap} over cap`,
  });
  const unallocated = eng.partnerShares.filter((s) => s.allocatedRM.trim() === "").length;
  out.push({
    name: "Partnership shares allocated",
    pass: unallocated === 0,
    detail: unallocated === 0 ? (eng.partnerShares.length > 0 ? "allocated" : "none — sole prop") : `${unallocated} blank`,
  });
  out.push(docsCheck(eng));
  const recompute = Math.floor(result.chargeableExactSen / 100) * 100;
  out.push({
    name: "CI truncation + rate recompute",
    pass: recompute === result.chargeableSen,
    detail: `${formatRM(result.chargeableExactSen)} → ${formatRM(result.chargeableSen)}`,
  });
  out.push(blockingCheck(eng));
  const hpMissing = eng.businesses.flatMap((b) => b.assets).filter((a) => a.isHirePurchase && (a.hpPaidPeriodRM === "" || a.hpPaidTotalRM === "")).length;
  out.push(hpCheck(hpMissing));
  out.push(judgementsCheck(eng));
  return out;
}

export function verificationP(eng: Engagement): Check[] {
  const { results } = computeEngagementP(eng);
  const out: Check[] = [];
  out.push({
    name: "At least one firm entered",
    pass: results.length > 0,
    detail: results.length > 0 ? `${results.length} ${plural(results.length, "firm")}` : "add one on the Entry tab",
  });
  const badRoll = results.filter((r) => r.scheduleRollSen !== 0).length;
  out.push({
    name: "Schedule roll-forward foots to zero",
    pass: badRoll === 0,
    detail: badRoll === 0 ? "0.00" : `${badRoll} off`,
  });
  const ratioBad = results.filter((r) => r.allocations.length > 0 && Math.abs(r.ratioTotalPct - 100) > 1e-9).length;
  out.push({
    name: "Profit-sharing ratios total 100%",
    pass: ratioBad === 0,
    detail: ratioBad === 0 ? "100%" : `${ratioBad} off`,
  });
  // Tolerance is 1 sen per partner (per-partner rounding); anything more
  // means balance went unallocated — ratios do not total 100%.
  const offFoot = results.filter((r) => Math.abs(r.allocationDeltaSen) > Math.max(1, r.allocations.length)).length;
  out.push({
    name: "Allocations foot to divisional",
    pass: offFoot === 0,
    detail: offFoot === 0 ? "footed (mod rounding)" : `${offFoot} off`,
  });
  out.push(docsCheck(eng));
  out.push(blockingCheck(eng));
  const hpMissing = eng.partnerships.flatMap((f) => f.assets).filter((a) => a.isHirePurchase && (a.hpPaidPeriodRM === "" || a.hpPaidTotalRM === "")).length;
  out.push(hpCheck(hpMissing));
  out.push(judgementsCheck(eng));
  return out;
}

export function Review(props: { eng: Engagement; patch: Patch }): JSX.Element {
  const { eng, patch } = props;
  const checks = eng.formType === "B" ? verificationB(eng) : eng.formType === "P" ? verificationP(eng) : verification(eng);
  const failed = checks.filter((c) => !c.pass).length;
  const rmIssues = diagnoseRmInputs(eng);
  return (
    <div>
      {rmIssues.length > 0 && (
        <div className="card" role="alert">
          <h3>Input errors — {rmIssues.length} {plural(rmIssues.length, "amount")} treated as 0</h3>
          <p className="hint">
            These fields failed RM validation and are computed as zero. Fix the format
            (RM 1,234.56) — the computation below does not include what you typed.
          </p>
          {rmIssues.map((m) => (
            <div key={m} className="flag crit">
              {m}
            </div>
          ))}
        </div>
      )}
      {/* The card accent states the outcome before any row is read. */}
      <div className="card" data-variant={failed > 0 ? "error" : "success"}>
        <h3>
          Verification — {checks.length - failed}/{checks.length} pass
          {failed > 0 && ` · ${failed} to clear`}
        </h3>
        {checks.map((c) => (
          <div key={c.name} className={c.pass ? "vrow" : "vrow fail"}>
            <span>{c.pass ? "✓" : "✗"} {c.name}</span>
            <span className="detail">{c.detail}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>[TO OBTAIN] — blocking items</h3>
        <LineTable<OpenItem>
          data={eng.openItems}
          onUpdate={(id, p) => patch({ openItems: updateById(eng.openItems, id, p) })}
          onRemove={(id) => patch({ openItems: removeById(eng.openItems, id) })}
          onAdd={() => patch({ openItems: [...eng.openItems, { id: uid(), title: "", whyBlocks: "", effect: "", resolved: false }] })}
          addLabel="+ Blocking item"
        describe={(o) => o.title || "blocking item"}
        emptyTitle="No blocking items"
        emptyHint="Everything obtainable is in. Add anything still [TO OBTAIN]."
          columns={[
            { header: "Item", cell: (o, set) => (<input value={o.title} onChange={(e) => set({ title: e.target.value })} aria-label="Item" />) },
            { header: "Why it blocks", cell: (o, set) => (<input value={o.whyBlocks} onChange={(e) => set({ whyBlocks: e.target.value })} aria-label="Why" />) },
            { header: "Effect", cell: (o, set) => (<input value={o.effect} onChange={(e) => set({ effect: e.target.value })} aria-label="Effect" />) },
            { header: "Resolved", cell: (o, set) => (<label className="check"><input type="checkbox" checked={o.resolved} onChange={(e) => set({ resolved: e.target.checked })} /><span>Yes</span></label>) },
          ]}
        />
      </div>

      <div className="card">
        <h3>Judgements — partner sign-off</h3>
        <LineTable<Judgement>
          data={eng.judgements}
          onUpdate={(id, p) => patch({ judgements: updateById(eng.judgements, id, p) })}
          onRemove={(id) => patch({ judgements: removeById(eng.judgements, id) })}
          onAdd={() => patch({ judgements: [...eng.judgements, { id: uid(), title: "", position: "", alternative: "", signedOff: false }] })}
          addLabel="+ Judgement"
        describe={(j) => j.title || "judgement"}
        emptyTitle="No judgements recorded"
        emptyHint="Record each position + alternative, then get partner sign-off."
          columns={[
            { header: "Judgement", cell: (j, set) => (<input value={j.title} onChange={(e) => set({ title: e.target.value })} aria-label="Judgement" />) },
            { header: "Position", cell: (j, set) => (<input value={j.position} onChange={(e) => set({ position: e.target.value })} aria-label="Position" />) },
            { header: "Alternative", cell: (j, set) => (<input value={j.alternative} onChange={(e) => set({ alternative: e.target.value })} aria-label="Alternative" />) },
            { header: "Signed", cell: (j, set) => (<label className="check"><input type="checkbox" checked={j.signedOff} onChange={(e) => set({ signedOff: e.target.checked })} /><span>Yes</span></label>) },
          ]}
        />
      </div>

      <div className="card">
        <h3>Prior-year filed position (YA{eng.ya - 1})</h3>
        <div className="row3">
          <RmInput label="Chargeable income (RM)" value={eng.priorYear.ciRM} on={(v) => patch({ priorYear: { ...eng.priorYear, ciRM: v } })} placeholder="0.00" />
          <RmInput label="Tax (RM)" value={eng.priorYear.taxRM} on={(v) => patch({ priorYear: { ...eng.priorYear, taxRM: v } })} placeholder="0.00" />
          <RmInput label="CA absorbed (RM)" value={eng.priorYear.caRM} on={(v) => patch({ priorYear: { ...eng.priorYear, caRM: v } })} placeholder="0.00" />
        </div>
        <div className="row3">
          <RmInput label="Losses b/f (RM)" value={eng.priorYear.lossesBfRM} on={(v) => patch({ priorYear: { ...eng.priorYear, lossesBfRM: v } })} placeholder="0.00" />
          <RmInput label="Unabsorbed CA b/f (RM)" value={eng.priorYear.unabsorbedCaBfRM} on={(v) => patch({ priorYear: { ...eng.priorYear, unabsorbedCaBfRM: v } })} placeholder="0.00" />
          <RmInput label="RE at 1.1 (RM)" hint="Blank = not agreed" value={eng.priorYear.reBfRM} on={(v) => patch({ priorYear: { ...eng.priorYear, reBfRM: v } })} placeholder="0.00" />
        </div>
        <label className="check"><input type="checkbox" checked={eng.priorYear.agreed} onChange={(e) => patch({ priorYear: { ...eng.priorYear, agreed: e.target.checked } })} /><span>Agreed to filed return</span></label>
      </div>

      <div className="card">
        <h3>Computation runs (basis history)</h3>
        {eng.runs.length === 0 && <p className="hint">No snapshots yet — snapshot from the Report tab.</p>}
        {eng.runs.slice(-8).reverse().map((r, i) => (
          <div key={`${r.at}-${i}`} className="kv">
            <span className="hint">{new Date(r.at).toLocaleString()}</span>
            <span className="num">CI {formatRM(r.ciSen)} · Tax {formatRM(r.taxSen)} · Bal {formatRM(r.payableSen)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
