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
          describe={(d) => d.name || "director"}
          emptyTitle="No directors"
          emptyHint="Add each director — Form C schedule needs name, share %, salary, loan."
          columns={[
            { header: "Name", cell: (d, set) => (<input value={d.name} onChange={(e) => set({ name: e.target.value })} aria-label="Name" />) },
            { header: "Share %", cell: (d, set) => (<RmInput label="Share %" compact kind="pct" value={d.sharePct} on={(v) => set({ sharePct: v })} placeholder="0–100" />) },
            { header: "Salary RM", cell: (d, set) => (<RmInput label="Salary (RM)" compact value={d.salaryRM} on={(v) => set({ salaryRM: v })} placeholder="0.00" />) },
            { header: "Loan RM", cell: (d, set) => (<RmInput label="Director loan (RM)" compact value={d.loanRM} on={(v) => set({ loanRM: v })} placeholder="0.00" />) },
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
          describe={(s) => s.name || "shareholder"}
          emptyTitle="No shareholders"
          emptyHint="Add each shareholder with shares and %."
          columns={[
            { header: "Name", cell: (s, set) => (<input value={s.name} onChange={(e) => set({ name: e.target.value })} aria-label="Name" />) },
            { header: "Shares", cell: (s, set) => (<RmInput label="Shares held" compact kind="int" value={s.shares} on={(v) => set({ shares: v })} placeholder="e.g. 1000" />) },
            { header: "%", cell: (s, set) => (<RmInput label="Share %" compact kind="pct" value={s.pct} on={(v) => set({ pct: v })} placeholder="0–100" />) },
          ]}
        />
      </div>

      <div className="card">
        <h3>Related-party accounts — month-end balances (s.140B)</h3>
        <p className="hint">Positive = company owes (credit). Negative = advance to director — engages s.140B deemed interest + CA 2016 s.224.</p>
        <div className="row2">
          <RmInput label="Market rate for s.140B (% p.a.)" kind="pct" value={eng.deemedRatePct} on={(v) => patch({ deemedRatePct: v })} placeholder="e.g. 4" hint="Applied to peak debit × months in debit" />
        </div>
        {eng.relatedAccounts.map((a) => {
          const debit = hasDebitBalance(a.balances);
          return (
            <div key={a.id} className="assetbox">
              <div className="linerow">
                <input value={a.name} onChange={(e) => patch({ relatedAccounts: updateById(eng.relatedAccounts, a.id, { name: e.target.value }) })} aria-label="e.g. Director — current account" placeholder="e.g. Director — current account" className="linerow-main" />
                {debit && <span className="flag crit flag-inline">DEBIT — s.140B</span>}
                <button type="button" className="btn btn-xs ghost danger" onClick={() => patch({ relatedAccounts: removeById(eng.relatedAccounts, a.id) })} aria-label={`Remove related account ${a.name || "(unnamed)"}`}><span aria-hidden="true">×</span></button>
              </div>
              <div className="mgrid">
                {MONTHS.map((m, i) => (
                  <div key={m}>
                    <RmInput
                      label={`${m} balance (RM)`}
                      kind="signed"
                      value={a.balances[i] ?? ""}
                      placeholder="0.00"
                      on={(v) => {
                        const b = [...a.balances];
                        b[i] = v;
                        patch({ relatedAccounts: updateById(eng.relatedAccounts, a.id, { balances: b }) });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <button className="btn add-action" onClick={() => patch({ relatedAccounts: [...eng.relatedAccounts, { id: uid(), name: "", balances: Array(12).fill("") }] })}>+ Related account</button>
      </div>

      <div className="card">
        <h3>CP204 instalment bills</h3>
        <LineTable<Cp204Bill>
          data={eng.cp204Bills}
          onUpdate={(id, p) => patch({ cp204Bills: updateById(eng.cp204Bills, id, p) })}
          onRemove={(id) => patch({ cp204Bills: removeById(eng.cp204Bills, id) })}
          onAdd={() => patch({ cp204Bills: [...eng.cp204Bills, { id: uid(), billNo: "", amountRM: "850", paidOn: "", inFY: true }] })}
          addLabel="+ Bill"
          describe={(b) => b.billNo ? `bill ${b.billNo}` : "CP204 bill"}
          emptyTitle="No CP204 bills"
          emptyHint="Add each instalment bill — ties to s.107C paid."
          columns={[
            { header: "Bill no", cell: (b, set) => (<input value={b.billNo} onChange={(e) => set({ billNo: e.target.value })} aria-label="Bill no" />) },
            { header: "RM", cell: (b, set) => (<RmInput label="Bill amount (RM)" compact value={b.amountRM} on={(v) => set({ amountRM: v })} placeholder="0.00" />) },
            { header: "Paid", cell: (b, set) => (<input type="date" value={b.paidOn} onChange={(e) => set({ paidOn: e.target.value })} aria-label="Paid on YYYY-MM-DD" placeholder="YYYY-MM-DD" />) },
            { header: "In FY", cell: (b, set) => (<label className="check"><input type="checkbox" checked={b.inFY} onChange={(e) => set({ inFY: e.target.checked })} /><span>Yes</span></label>) },
          ]}
        />
      </div>
    </div>
  );
}
