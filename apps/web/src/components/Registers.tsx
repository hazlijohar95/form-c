import { uid, updateById, removeById } from "../lib/lists.js";
import { hasDebitBalance } from "../lib/rm.js";
import { LineTable } from "./LineTable.js";
import { RmInput } from "./RmInput.js";
import type { Cp204Bill, Director, Engagement, Shareholder } from "../lib/types.js";

type Patch = (p: Partial<Engagement>) => void;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function Registers(props: { eng: Engagement; patch: Patch }): JSX.Element {
  const { eng, patch } = props;
  return (
    <div>
      <div className="card">
        <h3>Directors (Form C schedule)</h3>
        <LineTable<Director>
          data={eng.directors}
          onUpdate={(id, p) => patch({ directors: updateById(eng.directors, id, p) })}
          onRemove={(id) => patch({ directors: removeById(eng.directors, id) })}
          onAdd={() => patch({ directors: [...eng.directors, { id: uid(), name: "", sharePct: "", salaryRM: "", loanRM: "" }] })}
          addLabel="+ Director"
          columns={[
            { header: "Name", cell: (d, set) => (<input value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Name" style={{ width: "100%" }} />) },
            { header: "Share %", cell: (d, set) => (<input value={d.sharePct} onChange={(e) => set({ sharePct: e.target.value })} placeholder="%" style={{ width: "100%" }} />) },
            { header: "Salary RM", cell: (d, set) => (<RmInput value={d.salaryRM} on={(v) => set({ salaryRM: v })} placeholder="RM" />) },
            { header: "Loan RM", cell: (d, set) => (<RmInput value={d.loanRM} on={(v) => set({ loanRM: v })} placeholder="RM" />) },
          ]}
        />
      </div>

      <div className="card">
        <h3>Shareholders</h3>
        <LineTable<Shareholder>
          data={eng.shareholders}
          onUpdate={(id, p) => patch({ shareholders: updateById(eng.shareholders, id, p) })}
          onRemove={(id) => patch({ shareholders: removeById(eng.shareholders, id) })}
          onAdd={() => patch({ shareholders: [...eng.shareholders, { id: uid(), name: "", shares: "", pct: "" }] })}
          addLabel="+ Shareholder"
          columns={[
            { header: "Name", cell: (s, set) => (<input value={s.name} onChange={(e) => set({ name: e.target.value })} placeholder="Name" style={{ width: "100%" }} />) },
            { header: "Shares", cell: (s, set) => (<input value={s.shares} onChange={(e) => set({ shares: e.target.value })} placeholder="Shares" style={{ width: "100%" }} />) },
            { header: "%", cell: (s, set) => (<input value={s.pct} onChange={(e) => set({ pct: e.target.value })} placeholder="%" style={{ width: "100%" }} />) },
          ]}
        />
      </div>

      <div className="card">
        <h3>Related-party accounts — month-end balances (s.140B)</h3>
        <p className="hint">Positive = company owes (credit). Negative = advance to director — engages s.140B deemed interest + CA 2016 s.224.</p>
        <div className="row2">
          <div><label className="f">Market rate for s.140B (% p.a.)</label><input className="num" value={eng.deemedRatePct} onChange={(e) => patch({ deemedRatePct: e.target.value })} placeholder="e.g. 4" /></div>
        </div>
        {eng.relatedAccounts.map((a) => {
          const debit = hasDebitBalance(a.balances);
          return (
            <div key={a.id} className="assetbox">
              <div className="linerow">
                <input value={a.name} onChange={(e) => patch({ relatedAccounts: updateById(eng.relatedAccounts, a.id, { name: e.target.value }) })} placeholder="e.g. Director — current account" style={{ flex: 3 }} />
                {debit && <span className="flag crit" style={{ margin: 0 }}>DEBIT — s.140B</span>}
                <button className="btn ghost" onClick={() => patch({ relatedAccounts: removeById(eng.relatedAccounts, a.id) })}>×</button>
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
                        patch({ relatedAccounts: updateById(eng.relatedAccounts, a.id, { balances: b }) });
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
        <LineTable<Cp204Bill>
          data={eng.cp204Bills}
          onUpdate={(id, p) => patch({ cp204Bills: updateById(eng.cp204Bills, id, p) })}
          onRemove={(id) => patch({ cp204Bills: removeById(eng.cp204Bills, id) })}
          onAdd={() => patch({ cp204Bills: [...eng.cp204Bills, { id: uid(), billNo: "", amountRM: "850", paidOn: "", inFY: true }] })}
          addLabel="+ Bill"
          columns={[
            { header: "Bill no", cell: (b, set) => (<input value={b.billNo} onChange={(e) => set({ billNo: e.target.value })} placeholder="Bill no" style={{ width: "100%" }} />) },
            { header: "RM", cell: (b, set) => (<RmInput value={b.amountRM} on={(v) => set({ amountRM: v })} placeholder="RM" />) },
            { header: "Paid", cell: (b, set) => (<input value={b.paidOn} onChange={(e) => set({ paidOn: e.target.value })} placeholder="YYYY-MM-DD" style={{ width: "100%" }} />) },
            { header: "In FY", cell: (b, set) => (<label className="check"><input type="checkbox" checked={b.inFY} onChange={(e) => set({ inFY: e.target.checked })} /><span>Yes</span></label>) },
          ]}
        />
      </div>
    </div>
  );
}
