import { formatRM } from "@formc/engine";
import { defaultDeclarations, rmStrToSen } from "../lib/types.js";
import type { Engagement } from "../lib/types.js";
import { deemed140B, useComputation } from "./Report.js";

type Patch = (p: Partial<Engagement>) => void;

function KRow(props: { label: string; cur: string; prior: string }): JSX.Element {
  return (
    <tr>
      <td>{props.label}</td>
      <td className="rm">{props.cur}</td>
      <td className="rm hint">{props.prior || "—"}</td>
    </tr>
  );
}

export function EKeying(props: { eng: Engagement; patch: Patch }): JSX.Element {
  const { eng, patch } = props;
  const { result } = useComputation(eng);
  const deemed = deemed140B(eng);
  const decls = eng.declarations.length > 0 ? eng.declarations : defaultDeclarations();
  const py = eng.priorYear;

  function setDecl(key: string, value: boolean): void {
    const base = eng.declarations.length > 0 ? eng.declarations : defaultDeclarations();
    patch({ declarations: base.map((d) => (d.key === key ? { ...d, value } : d)) });
  }

  return (
    <div>
      <div className="card">
        <h3>e-C keying — screen order, current vs filed prior year</h3>
        <p className="hint">
          Key top to bottom into MyTax. Prior column is the filed YA{eng.ya - 1} position —
          large unexplained swings attract queries. Print this page as the keying record.
        </p>
        <h4>Maklumat syarikat</h4>
        <table className="w">
          <thead><tr><th>Field</th><th style={{ textAlign: "right" }}>Key (YA{eng.ya})</th><th style={{ textAlign: "right" }}>Prior filed</th></tr></thead>
          <tbody>
            <KRow label="Company / Reg no" cur={`${eng.companyName} ${eng.regNo}`} prior="" />
            <KRow label="Basis period" cur={`${eng.fyeFrom} – ${eng.fyeTo}`} prior="" />
            <KRow label="SME rate" cur={result.smeQualifies && !eng.isIhc ? "15/17/24%" : "Flat 24%"} prior="" />
          </tbody>
        </table>

        <h4>Pengarah / Pemegang saham</h4>
        <table className="w">
          <tbody>
            {eng.directors.map((d) => (
              <KRow key={d.id} label={`Director — ${d.name || "(unnamed)"} (${d.sharePct || "?"}%)`} cur={`salary ${d.salaryRM || "0"} · loan ${d.loanRM || "0"}`} prior="" />
            ))}
            {eng.shareholders.map((s) => (
              <KRow key={s.id} label={`Shareholder — ${s.name || "(unnamed)"}`} cur={`${s.shares || "0"} shares (${s.pct || "?"}%)`} prior="" />
            ))}
            {eng.directors.length === 0 && eng.shareholders.length === 0 && (
              <tr><td colSpan={3} className="hint">No directors/shareholders entered — see Registers tab.</td></tr>
            )}
          </tbody>
        </table>

        <h4>Perisytiharan (Yes/No)</h4>
        {decls.map((d) => (
          <label key={d.key} className="check">
            <input type="checkbox" checked={d.value} onChange={(e) => setDecl(d.key, e.target.checked)} />
            <span>{d.label} — <strong>{d.value ? "Ya" : "Tidak"}</strong></span>
          </label>
        ))}

        <h4>Bahagian B — pendapatan</h4>
        <table className="w">
          <tbody>
            <KRow label="Statutory business" cur={formatRM(result.statutoryBeforeIncentivesSen)} prior="" />
            {eng.nonBusiness.map((l) => (
              <KRow key={l.id} label={l.label} cur={formatRM(rmStrToSen(l.amountRM))} prior="" />
            ))}
            {deemed.lines.map((l) => (
              <KRow key={l.name} label={`Deemed interest s.140B — ${l.name}`} cur={formatRM(l.amountSen)} prior="" />
            ))}
            <KRow label="CHARGEABLE INCOME" cur={formatRM(result.chargeableSen)} prior={py.ciRM ? `RM ${py.ciRM}` : ""} />
            <KRow label="Tax" cur={formatRM(result.grossTaxSen)} prior={py.taxRM ? `RM ${py.taxRM}` : ""} />
            <KRow label="s.107C paid" cur={formatRM(rmStrToSen(eng.cp204PaidRM))} prior="" />
            <KRow label="BALANCE" cur={formatRM(result.taxPayableSen)} prior="" />
          </tbody>
        </table>

        <h4>Lampiran A1 — pelarasan</h4>
        <table className="w">
          <tbody>
            <KRow label="Net profit per accounts" cur={formatRM(rmStrToSen(eng.netProfitRM))} prior="" />
            <KRow label="Add-backs total" cur={formatRM(eng.addBacks.reduce((a, l) => a + rmStrToSen(l.amountRM), 0))} prior="" />
            <KRow label="Adjusted income" cur={formatRM(result.adjustedSen)} prior="" />
          </tbody>
        </table>

        <h4>Jadual 3 — CA</h4>
        <table className="w">
          <tbody>
            <KRow label="CA deducted" cur={formatRM(result.totalCaSen)} prior={py.caRM ? `RM ${py.caRM}` : ""} />
            <KRow label="Balancing charge" cur={formatRM(result.balancingChargeSen)} prior="" />
            <KRow label="RE c/f" cur={formatRM(result.residualCfSen)} prior={py.reBfRM ? `RE b/f RM ${py.reBfRM}` : ""} />
          </tbody>
        </table>

        <h4>D1 — potongan khas</h4>
        <table className="w">
          <tbody>
            {eng.doubleDeductions.map((l) => (
              <KRow key={l.id} label={`Code ${l.code || "?"} — ${l.description}`} cur={formatRM(rmStrToSen(l.amountRM))} prior="" />
            ))}
            {eng.doubleDeductions.length === 0 && (
              <tr><td colSpan={3} className="hint">None claimed.</td></tr>
            )}
          </tbody>
        </table>

        <div className="toolbar no-print">
          <button className="btn" onClick={() => window.print()}>Print keying record</button>
        </div>
      </div>
    </div>
  );
}
