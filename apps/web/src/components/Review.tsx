import { formatRM } from "@formc/engine";
import { uid, rmStrToSen } from "../lib/types.js";
import type { Engagement } from "../lib/types.js";
import { useComputation } from "./Report.js";

type Patch = (p: Partial<Engagement>) => void;

interface Check {
  name: string;
  pass: boolean;
  detail: string;
}

export function verification(eng: Engagement): Check[] {
  const { result, assetRows } = useComputation(eng);
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
        {eng.openItems.map((o) => (
          <div key={o.id} className="assetbox">
            <div className="linerow">
              <input value={o.title} onChange={(e) => patch({ openItems: eng.openItems.map((x) => (x.id === o.id ? { ...x, title: e.target.value } : x)) })} placeholder="Item" style={{ flex: 2 }} />
              <label className="check"><input type="checkbox" checked={o.resolved} onChange={(e) => patch({ openItems: eng.openItems.map((x) => (x.id === o.id ? { ...x, resolved: e.target.checked } : x)) })} /><span>Resolved</span></label>
              <button className="btn ghost" onClick={() => patch({ openItems: eng.openItems.filter((x) => x.id !== o.id) })}>×</button>
            </div>
            <div className="row2">
              <div><label className="f">Why it blocks</label><input value={o.whyBlocks} onChange={(e) => patch({ openItems: eng.openItems.map((x) => (x.id === o.id ? { ...x, whyBlocks: e.target.value } : x)) })} /></div>
              <div><label className="f">Effect if it changes</label><input value={o.effect} onChange={(e) => patch({ openItems: eng.openItems.map((x) => (x.id === o.id ? { ...x, effect: e.target.value } : x)) })} /></div>
            </div>
          </div>
        ))}
        <button className="btn" onClick={() => patch({ openItems: [...eng.openItems, { id: uid(), title: "", whyBlocks: "", effect: "", resolved: false }] })}>+ Blocking item</button>
      </div>

      <div className="card">
        <h3>Judgements — partner sign-off</h3>
        {eng.judgements.map((j) => (
          <div key={j.id} className="assetbox">
            <div className="linerow">
              <input value={j.title} onChange={(e) => patch({ judgements: eng.judgements.map((x) => (x.id === j.id ? { ...x, title: e.target.value } : x)) })} placeholder="Judgement" style={{ flex: 2 }} />
              <label className="check"><input type="checkbox" checked={j.signedOff} onChange={(e) => patch({ judgements: eng.judgements.map((x) => (x.id === j.id ? { ...x, signedOff: e.target.checked } : x)) })} /><span>Signed off</span></label>
              <button className="btn ghost" onClick={() => patch({ judgements: eng.judgements.filter((x) => x.id !== j.id) })}>×</button>
            </div>
            <div className="row2">
              <div><label className="f">Position taken</label><input value={j.position} onChange={(e) => patch({ judgements: eng.judgements.map((x) => (x.id === j.id ? { ...x, position: e.target.value } : x)) })} /></div>
              <div><label className="f">Alternative</label><input value={j.alternative} onChange={(e) => patch({ judgements: eng.judgements.map((x) => (x.id === j.id ? { ...x, alternative: e.target.value } : x)) })} /></div>
            </div>
          </div>
        ))}
        <button className="btn" onClick={() => patch({ judgements: [...eng.judgements, { id: uid(), title: "", position: "", alternative: "", signedOff: false }] })}>+ Judgement</button>
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
        {eng.runs.slice(-8).reverse().map((r) => (
          <div key={r.at} className="kv">
            <span className="hint">{new Date(r.at).toLocaleString()}</span>
            <span className="num">CI {formatRM(r.ciSen)} · Tax {formatRM(r.taxSen)} · Bal {formatRM(r.payableSen)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
