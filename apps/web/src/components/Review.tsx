import { formatRM } from "@formc/engine";
import { rmStrToSen } from "../lib/rm.js";
import { updateById, removeById, uid } from "../lib/lists.js";
import { computeEngagement } from "../lib/computation.js";
import { LineTable } from "./LineTable.js";
import type { Engagement, Judgement, OpenItem } from "../lib/types.js";

type Patch = (p: Partial<Engagement>) => void;

interface Check {
  name: string;
  pass: boolean;
  detail: string;
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
  const open = eng.openItems.filter((o) => !o.resolved).length;
  out.push({ name: "No unresolved blocking items", pass: open === 0, detail: open === 0 ? "clear" : `${open} open` });
  const hpMissing = eng.assets.filter((a) => a.isHirePurchase && (a.hpPaidPeriodRM === "" || a.hpPaidTotalRM === "")).length;
  out.push({ name: "HP assets carry paid figures", pass: hpMissing === 0, detail: hpMissing === 0 ? "complete" : `${hpMissing} missing` });
  const unsigned = eng.judgements.filter((j) => !j.signedOff).length;
  out.push({ name: "Judgements signed off", pass: unsigned === 0, detail: unsigned === 0 ? "all signed" : `${unsigned} unsigned` });
  return out;
}

export function Review(props: { eng: Engagement; patch: Patch }): JSX.Element {
  const { eng, patch } = props;
  const checks = verification(eng);
  const failed = checks.filter((c) => !c.pass).length;
  return (
    <div>
      <div className="card">
        <h3>Verification — {checks.length - failed}/{checks.length} pass</h3>
        {checks.map((c) => (
          <div key={c.name} className={c.pass ? "vrow pass" : "vrow fail"}>
            <span>{c.pass ? "✓" : "✗"} {c.name}</span>
            <span className="num hint">{c.detail}</span>
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
          columns={[
            { header: "Item", cell: (o, set) => (<input value={o.title} onChange={(e) => set({ title: e.target.value })} placeholder="Item" style={{ width: "100%" }} />) },
            { header: "Why it blocks", cell: (o, set) => (<input value={o.whyBlocks} onChange={(e) => set({ whyBlocks: e.target.value })} placeholder="Why" style={{ width: "100%" }} />) },
            { header: "Effect", cell: (o, set) => (<input value={o.effect} onChange={(e) => set({ effect: e.target.value })} placeholder="Effect" style={{ width: "100%" }} />) },
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
          columns={[
            { header: "Judgement", cell: (j, set) => (<input value={j.title} onChange={(e) => set({ title: e.target.value })} placeholder="Judgement" style={{ width: "100%" }} />) },
            { header: "Position", cell: (j, set) => (<input value={j.position} onChange={(e) => set({ position: e.target.value })} placeholder="Position" style={{ width: "100%" }} />) },
            { header: "Alternative", cell: (j, set) => (<input value={j.alternative} onChange={(e) => set({ alternative: e.target.value })} placeholder="Alternative" style={{ width: "100%" }} />) },
            { header: "Signed", cell: (j, set) => (<label className="check"><input type="checkbox" checked={j.signedOff} onChange={(e) => set({ signedOff: e.target.checked })} /><span>Yes</span></label>) },
          ]}
        />
      </div>

      <div className="card">
        <h3>Prior-year filed position (YA{eng.ya - 1})</h3>
        <div className="row3">
          <div><label className="f">Chargeable income</label><input className="num" value={eng.priorYear.ciRM} onChange={(e) => patch({ priorYear: { ...eng.priorYear, ciRM: e.target.value } })} /></div>
          <div><label className="f">Tax</label><input className="num" value={eng.priorYear.taxRM} onChange={(e) => patch({ priorYear: { ...eng.priorYear, taxRM: e.target.value } })} /></div>
          <div><label className="f">CA absorbed</label><input className="num" value={eng.priorYear.caRM} onChange={(e) => patch({ priorYear: { ...eng.priorYear, caRM: e.target.value } })} /></div>
        </div>
        <div className="row3">
          <div><label className="f">Losses b/f</label><input className="num" value={eng.priorYear.lossesBfRM} onChange={(e) => patch({ priorYear: { ...eng.priorYear, lossesBfRM: e.target.value } })} /></div>
          <div><label className="f">Unabsorbed CA b/f</label><input className="num" value={eng.priorYear.unabsorbedCaBfRM} onChange={(e) => patch({ priorYear: { ...eng.priorYear, unabsorbedCaBfRM: e.target.value } })} /></div>
          <div><label className="f">RE at 1.1 (blank = not agreed)</label><input className="num" value={eng.priorYear.reBfRM} onChange={(e) => patch({ priorYear: { ...eng.priorYear, reBfRM: e.target.value } })} /></div>
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
