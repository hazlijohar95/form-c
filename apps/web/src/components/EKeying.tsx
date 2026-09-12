import { formatRM } from "@formc/engine";
import { defaultDeclarations } from "../lib/types.js";
import { rmStrToSen, signedRmToSen } from "../lib/rm.js";
import type { Engagement } from "../lib/types.js";
import { deemed140B, useComputation, computeEngagementB, computeEngagementP } from "../lib/computation.js";
import { MyTaxCoverage } from "./MyTaxCoverage.js";
import { TableScroll } from "./ui/primitives.js";

type Patch = (p: Partial<Engagement>) => void;

function KRow(props: { label: string; cur: string; prior: string }): JSX.Element {
  return (
    <tr>
      <th scope="row">{props.label}</th>
      <td className="rm">{props.cur}</td>
      <td className="rm hint">{props.prior || "—"}</td>
    </tr>
  );
}

export function EKeying(props: { eng: Engagement; patch: Patch }): JSX.Element {
  const { eng, patch } = props;
  if (eng.formType === "P") return <EKeyingP eng={eng} />;
  if (eng.formType === "B") return <EKeyingB eng={eng} />;
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
      <MyTaxCoverage eng={eng} patch={patch} />
      <div className="card">
        <h3>e-C keying — screen order, current vs filed prior year</h3>
        <p className="hint">
          Key top to bottom into MyTax. Prior column is the filed YA{eng.ya - 1} position —
          large unexplained swings attract queries. Print this page as the keying record.
        </p>
        <h4>Maklumat syarikat</h4>
        <TableScroll label="Company keying table">
        <table className="w">
          <thead><tr><th>Field</th><th className="num-h">Key (YA{eng.ya})</th><th className="num-h">Prior filed</th></tr></thead>
          <tbody>
            <KRow label="Company / Reg no" cur={`${eng.companyName} ${eng.regNo}`} prior="" />
            <KRow label="Basis period" cur={`${eng.fyeFrom} – ${eng.fyeTo}`} prior="" />
            <KRow label="SME rate" cur={result.smeQualifies && !eng.isIhc ? "15/17/24%" : "Flat 24%"} prior="" />
          </tbody>
        </table>
        </TableScroll>

        <h4>Pengarah / Pemegang saham</h4>
        <TableScroll label="Directors and shareholders keying table">
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
        </TableScroll>

        <h4>Perisytiharan (Yes/No)</h4>
        {decls.map((d) => (
          <label key={d.key} className="check">
            <input type="checkbox" checked={d.value} onChange={(e) => setDecl(d.key, e.target.checked)} />
            <span>{d.label} — <strong>{d.value ? "Ya" : "Tidak"}</strong></span>
          </label>
        ))}

        <h4>Bahagian B — pendapatan</h4>
        <TableScroll label="Income keying table">
        <table className="w">
          <tbody>
            <KRow label="Statutory business" cur={formatRM(result.statutoryBeforeIncentivesSen)} prior="" />
            {eng.nonBusiness.map((l) => (
              <KRow key={l.id} label={l.label} cur={formatRM(rmStrToSen(l.amountRM))} prior="" />
            ))}
            {deemed.lines.map((l, i) => (
              <KRow key={`${l.name}-${i}`} label={`Deemed interest s.140B — ${l.name}`} cur={formatRM(l.amountSen)} prior="" />
            ))}
            <KRow label="CHARGEABLE INCOME" cur={formatRM(result.chargeableSen)} prior={py.ciRM ? `RM ${py.ciRM}` : ""} />
            <KRow label="Tax" cur={formatRM(result.grossTaxSen)} prior={py.taxRM ? `RM ${py.taxRM}` : ""} />
            <KRow label="s.107C paid" cur={formatRM(rmStrToSen(eng.cp204PaidRM))} prior="" />
            <KRow label="BALANCE" cur={formatRM(result.taxPayableSen)} prior="" />
          </tbody>
        </table>
        </TableScroll>

        <h4>Lampiran A1 — pelarasan</h4>
        <TableScroll label="Adjustments keying table">
        <table className="w">
          <tbody>
            <KRow label="Net profit per accounts" cur={formatRM(rmStrToSen(eng.netProfitRM))} prior="" />
            <KRow label="Add-backs total" cur={formatRM(eng.addBacks.reduce((a, l) => a + rmStrToSen(l.amountRM), 0))} prior="" />
            <KRow label="Adjusted income" cur={formatRM(result.adjustedSen)} prior="" />
          </tbody>
        </table>
        </TableScroll>

        <h4>Jadual 3 — CA</h4>
        <TableScroll label="Capital allowances keying table">
        <table className="w">
          <tbody>
            <KRow label="CA deducted" cur={formatRM(result.totalCaSen)} prior={py.caRM ? `RM ${py.caRM}` : ""} />
            <KRow label="Balancing charge" cur={formatRM(result.balancingChargeSen)} prior="" />
            <KRow label="RE c/f" cur={formatRM(result.residualCfSen)} prior={py.reBfRM ? `RE b/f RM ${py.reBfRM}` : ""} />
          </tbody>
        </table>
        </TableScroll>

        <h4>D1 — potongan khas</h4>
        <TableScroll label="Special deductions keying table">
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
        </TableScroll>

        <div className="toolbar no-print">
          <button className="btn" onClick={() => window.print()}>Print keying record</button>
        </div>
      </div>
    </div>
  );
}

// Form P keying record — divisional income per firm plus the partner
// allocation schedule each partner keys into their Form B.
export function EKeyingP(props: { eng: Engagement }): JSX.Element {
  const { eng } = props;
  const { results } = computeEngagementP(eng);
  return (
    <div>
      <div className="card">
        <h3>e-P keying — divisional + allocation, current vs filed prior year</h3>
        <p className="hint">
          Key the firm return top to bottom; each partner keys their apportioned share
          into their own Form B. Print this page as the keying record.
        </p>
        <h4>Maklumat perkongsian</h4>
        <TableScroll label="Firm keying table">
        <table className="w">
          <thead><tr><th>Field</th><th className="num-h">Key (YA{eng.ya})</th><th className="num-h">Prior filed</th></tr></thead>
          <tbody>
            <KRow label="Firm / Reg no" cur={`${eng.companyName} ${eng.regNo}`} prior="" />
            {results.map((r) => (
              <KRow key={r.label} label={`${r.label} (divisional)`} cur={formatRM(r.statutorySen)} prior="" />
            ))}
          </tbody>
        </table>
        </TableScroll>

        <h4>Bahagian rakan kongsi</h4>
        <TableScroll label="Partner allocation keying table">
        <table className="w">
          <tbody>
            {results.map((r) => r.allocations.map((a) => (
              <KRow key={`${r.label}-${a.name}`} label={`${a.name || "(unnamed)"} — ${r.label}`} cur={formatRM(a.totalSen)} prior="" />
            )))}
            {results.length === 0 && (
              <tr><td colSpan={3} className="hint">No firms entered — see Entry tab.</td></tr>
            )}
          </tbody>
        </table>
        </TableScroll>

        <div className="toolbar no-print">
          <button className="btn" onClick={() => window.print()}>Print keying record</button>
        </div>
      </div>
    </div>
  );
}

// Form B keying record — same current-vs-prior discipline, individual
// sections (businesses, partnership, employment, reliefs, CP500).
// Portal step IDs for e-B live in skill/formc-mytax/mytax-field-map.json.
export function EKeyingB(props: { eng: Engagement }): JSX.Element {
  const { eng } = props;
  const { result } = computeEngagementB(eng);
  const py = eng.priorYear;
  return (
    <div>
      <div className="card">
        <h3>e-B keying — screen order, current vs filed prior year</h3>
        <p className="hint">
          Key top to bottom into MyTax. Prior column is the filed YA{eng.ya - 1} position —
          large unexplained swings attract queries. Print this page as the keying record.
        </p>
        <h4>Maklumat individu</h4>
        <TableScroll label="Taxpayer keying table">
        <table className="w">
          <thead><tr><th>Field</th><th className="num-h">Key (YA{eng.ya})</th><th className="num-h">Prior filed</th></tr></thead>
          <tbody>
            <KRow label="Name / Reg no" cur={`${eng.companyName} ${eng.regNo}`} prior="" />
            <KRow label="Basis period" cur={`${eng.fyeFrom} – ${eng.fyeTo}`} prior="" />
          </tbody>
        </table>
        </TableScroll>

        <h4>Punca perniagaan</h4>
        <TableScroll label="Business keying table">
        <table className="w">
          <tbody>
            {result.businesses.map((b) => (
              <KRow key={b.label} label={`${b.label} (statutory)`} cur={formatRM(b.statutorySen)} prior="" />
            ))}
            {eng.partnerShares.map((s) => (
              <KRow key={s.id} label={`Kongsi — ${s.partnershipName || "(unnamed)"} (${s.ratioPct || "?"}%)`} cur={formatRM(signedRmToSen(s.allocatedRM))} prior="" />
            ))}
            {eng.employmentRM !== "" && (
              <KRow label="Employment (EA)" cur={formatRM(rmStrToSen(eng.employmentRM))} prior="" />
            )}
            <KRow label="CHARGEABLE INCOME" cur={formatRM(result.chargeableSen)} prior={py.ciRM ? `RM ${py.ciRM}` : ""} />
            <KRow label="Tax" cur={formatRM(result.grossTaxSen)} prior={py.taxRM ? `RM ${py.taxRM}` : ""} />
            <KRow label="CP500 paid" cur={formatRM(rmStrToSen(eng.cp500PaidRM))} prior="" />
            <KRow label="BALANCE" cur={formatRM(result.taxPayableSen)} prior="" />
          </tbody>
        </table>
        </TableScroll>

        <h4>Pelepasan individu</h4>
        <TableScroll label="Reliefs keying table">
        <table className="w">
          <tbody>
            {result.reliefRows.map((r, i) => (
              <KRow key={`${r.key}-${i}`} label={r.label || r.key} cur={formatRM(r.allowedSen)} prior="" />
            ))}
            {result.reliefRows.length === 0 && (
              <tr><td colSpan={3} className="hint">No reliefs keyed — see Entry tab.</td></tr>
            )}
          </tbody>
        </table>
        </TableScroll>

        <div className="toolbar no-print">
          <button className="btn" onClick={() => window.print()}>Print keying record</button>
        </div>
      </div>
    </div>
  );
}
