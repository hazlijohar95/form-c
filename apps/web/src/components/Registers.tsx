import { uid } from "../lib/types.js";
import type { Engagement } from "../lib/types.js";

type Patch = (p: Partial<Engagement>) => void;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function Registers(props: { eng: Engagement; patch: Patch }): JSX.Element {
  const { eng, patch } = props;
  return (
    <div>
      <div className="card">
        <h3>Directors (Form C schedule)</h3>
        {eng.directors.map((d) => (
          <div key={d.id} className="linerow">
            <input value={d.name} onChange={(e) => patch({ directors: eng.directors.map((x) => (x.id === d.id ? { ...x, name: e.target.value } : x)) })} placeholder="Name" style={{ flex: 2 }} />
            <input className="num" value={d.sharePct} onChange={(e) => patch({ directors: eng.directors.map((x) => (x.id === d.id ? { ...x, sharePct: e.target.value } : x)) })} placeholder="Share %" style={{ flex: 1 }} />
            <input className="num" value={d.salaryRM} onChange={(e) => patch({ directors: eng.directors.map((x) => (x.id === d.id ? { ...x, salaryRM: e.target.value } : x)) })} placeholder="Salary RM" style={{ flex: 1 }} />
            <input className="num" value={d.loanRM} onChange={(e) => patch({ directors: eng.directors.map((x) => (x.id === d.id ? { ...x, loanRM: e.target.value } : x)) })} placeholder="Loan RM" style={{ flex: 1 }} />
            <button className="btn ghost" onClick={() => patch({ directors: eng.directors.filter((x) => x.id !== d.id) })}>×</button>
          </div>
        ))}
        <button className="btn" onClick={() => patch({ directors: [...eng.directors, { id: uid(), name: "", sharePct: "", salaryRM: "", loanRM: "" }] })}>+ Director</button>
      </div>

      <div className="card">
        <h3>Shareholders</h3>
        {eng.shareholders.map((s) => (
          <div key={s.id} className="linerow">
            <input value={s.name} onChange={(e) => patch({ shareholders: eng.shareholders.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)) })} placeholder="Name" style={{ flex: 2 }} />
            <input className="num" value={s.shares} onChange={(e) => patch({ shareholders: eng.shareholders.map((x) => (x.id === s.id ? { ...x, shares: e.target.value } : x)) })} placeholder="Shares" style={{ flex: 1 }} />
            <input className="num" value={s.pct} onChange={(e) => patch({ shareholders: eng.shareholders.map((x) => (x.id === s.id ? { ...x, pct: e.target.value } : x)) })} placeholder="%" style={{ flex: 1 }} />
            <button className="btn ghost" onClick={() => patch({ shareholders: eng.shareholders.filter((x) => x.id !== s.id) })}>×</button>
          </div>
        ))}
        <button className="btn" onClick={() => patch({ shareholders: [...eng.shareholders, { id: uid(), name: "", shares: "", pct: "" }] })}>+ Shareholder</button>
      </div>

      <div className="card">
        <h3>Related-party accounts — month-end balances (s.140B)</h3>
        <p className="hint">Positive = company owes (credit). Negative = advance to director — engages s.140B deemed interest + CA 2016 s.224.</p>
        <div className="row2">
          <div><label className="f">Market rate for s.140B (% p.a.)</label><input className="num" value={eng.deemedRatePct} onChange={(e) => patch({ deemedRatePct: e.target.value })} placeholder="e.g. 4" /></div>
        </div>
        {eng.relatedAccounts.map((a) => {
          const debit = a.balances.some((b) => Number(b) < 0);
          return (
            <div key={a.id} className="assetbox">
              <div className="linerow">
                <input value={a.name} onChange={(e) => patch({ relatedAccounts: eng.relatedAccounts.map((x) => (x.id === a.id ? { ...x, name: e.target.value } : x)) })} placeholder="e.g. Director — current account" style={{ flex: 3 }} />
                {debit && <span className="flag crit" style={{ margin: 0 }}>DEBIT — s.140B</span>}
                <button className="btn ghost" onClick={() => patch({ relatedAccounts: eng.relatedAccounts.filter((x) => x.id !== a.id) })}>×</button>
              </div>
              <div className="mgrid">
                {MONTHS.map((m, i) => (
                  <div key={m}>
                    <label className="f">{m}</label>
                    <input
                      className="num"
                      value={a.balances[i] ?? ""}
                      onChange={(e) => {
                        const b = [...a.balances];
                        b[i] = e.target.value;
                        patch({ relatedAccounts: eng.relatedAccounts.map((x) => (x.id === a.id ? { ...x, balances: b } : x)) });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <button className="btn" onClick={() => patch({ relatedAccounts: [...eng.relatedAccounts, { id: uid(), name: "", balances: Array(12).fill("") }] })}>+ Related account</button>
      </div>

      <div className="card">
        <h3>CP204 instalment bills</h3>
        {eng.cp204Bills.map((b) => (
          <div key={b.id} className="linerow">
            <input value={b.billNo} onChange={(e) => patch({ cp204Bills: eng.cp204Bills.map((x) => (x.id === b.id ? { ...x, billNo: e.target.value } : x)) })} placeholder="Bill no" style={{ flex: 2 }} />
            <input className="num" value={b.amountRM} onChange={(e) => patch({ cp204Bills: eng.cp204Bills.map((x) => (x.id === b.id ? { ...x, amountRM: e.target.value } : x)) })} placeholder="RM" style={{ flex: 1 }} />
            <input value={b.paidOn} onChange={(e) => patch({ cp204Bills: eng.cp204Bills.map((x) => (x.id === b.id ? { ...x, paidOn: e.target.value } : x)) })} placeholder="Paid YYYY-MM-DD" style={{ flex: 1.2 }} />
            <label className="check"><input type="checkbox" checked={b.inFY} onChange={(e) => patch({ cp204Bills: eng.cp204Bills.map((x) => (x.id === b.id ? { ...x, inFY: e.target.checked } : x)) })} /><span>In FY</span></label>
            <button className="btn ghost" onClick={() => patch({ cp204Bills: eng.cp204Bills.filter((x) => x.id !== b.id) })}>×</button>
          </div>
        ))}
        <button className="btn" onClick={() => patch({ cp204Bills: [...eng.cp204Bills, { id: uid(), billNo: "", amountRM: "850", paidOn: "", inFY: true }] })}>+ Bill</button>
      </div>
    </div>
  );
}
