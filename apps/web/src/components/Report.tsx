import { earningsStripping, formatRM } from "@formc/engine";
import { CHECKLIST } from "../lib/types.js";
import { rmStrToSen } from "../lib/rm.js";
import { buildMytaxExport, doubleLineTotal } from "../lib/myexport.js";
import { deemed140B, useComputation, whtSectionList } from "../lib/computation.js";
import type { Engagement, RunRecord } from "../lib/types.js";

export { whtSectionList };

export function Report(props: { eng: Engagement; onChecklist: (i: number, v: boolean) => void; onSnapshot: (r: RunRecord) => void; notify: (t: { title: string; detail?: string; err?: boolean }) => void }): JSX.Element {
  const { eng } = props;
  const { result, assetRows } = useComputation(eng);
  const deemed = deemed140B(eng);
  const stripSen = earningsStripping(rmStrToSen(eng.relatedInterestRM), rmStrToSen(eng.taxEbitdaRM));
  const doneCount = eng.checks.filter(Boolean).length;
  const exportJson = buildMytaxExport(eng);

  return (
    <div className="report">
      <div className="card">
        <div className="rephead">
          <div>
            <h2>
              Tax computation — {eng.companyName} {eng.regNo && `(${eng.regNo})`}
            </h2>
            <div className="hint">
              Form C · YA {eng.ya} · Basis {eng.fyeFrom} to {eng.fyeTo} · Filing due{" "}
              {result.filingDeadline} · {result.smeQualifies ? "SME 15/17/24%" : "Flat 24%"}
            </div>
          </div>
          <div className="toolbar no-print">
            <button type="button" className="btn btn-xs" onClick={() => window.print()}>
              Print
            </button>
            <button type="button" className="btn btn-xs" onClick={() => props.onSnapshot({ at: new Date().toISOString(), ciSen: result.chargeableSen, taxSen: result.grossTaxSen, payableSen: result.taxPayableSen })}>
              Snapshot run
            </button>
            <button
              type="button"
              className="btn btn-xs primary"
              disabled={doneCount < CHECKLIST.length}
              title={doneCount < CHECKLIST.length ? `Complete ${CHECKLIST.length - doneCount} checklist item(s) to unlock export` : "Copy MyTax JSON to clipboard"}
              aria-describedby="export-hint"
              onClick={() => {
                void navigator.clipboard.writeText(exportJson).then(
                  () => props.notify({ title: "MyTax JSON copied", detail: "Paste into your export record." }),
                  () => props.notify({ title: "Copy failed", detail: "Select the JSON below and copy manually.", err: true })
                );
              }}
            >
              Copy MyTax JSON
            </button>
          </div>
          {doneCount < CHECKLIST.length && (
            <p className="hint" id="export-hint">
              Export unlocks at {CHECKLIST.length}/{CHECKLIST.length} checklist — {CHECKLIST.length - doneCount} remaining.
            </p>
          )}
        </div>

        {result.findings.map((f) => (
          <div key={f} className="flag crit" role="alert">
            {f}
          </div>
        ))}

        <h3>A · Adjusted income</h3>
        <div className="tscroll">
        <table className="w">
          <tbody>
            <tr>
              <td>Net profit per accounts</td>
              <td className="rm">{formatRM(rmStrToSen(eng.netProfitRM))}</td>
            </tr>
            {eng.addBacks.map((l) => (
              <tr key={l.id}>
                <td>
                  Add: {l.description} <span className="hint">[{l.section}]</span>
                </td>
                <td className="rm">{formatRM(rmStrToSen(l.amountRM))}</td>
              </tr>
            ))}
            {eng.whtLines.filter((l) => !l.remitted).map((l) => (
              <tr key={l.id}>
                <td>
                  Add: {l.description} <span className="hint">[s.39(2) — WHT {l.section} not remitted, auto]</span>
                </td>
                <td className="rm">{formatRM(rmStrToSen(l.amountRM))}</td>
              </tr>
            ))}
            {stripSen > 0 && (
              <tr>
                <td>
                  Add: related-party interest excess <span className="hint">[s.140C — auto]</span>
                </td>
                <td className="rm">{formatRM(stripSen)}</td>
              </tr>
            )}
            {eng.credits.map((l) => (
              <tr key={l.id}>
                <td>
                  Less: {l.description} <span className="hint">[{l.basis || "non-taxable"}]</span>
                </td>
                <td className="rm">({formatRM(rmStrToSen(l.amountRM))})</td>
              </tr>
            ))}
            {eng.doubleDeductions.map((l) => (
              <tr key={l.id}>
                <td>
                  Less: {l.description} (double){" "}
                  <span className="hint">[{l.code ? `D1 ${l.code}, ` : ""}{l.authority || "s.34"}{l.capRM ? `, cap RM${l.capRM}` : ""}]</span>
                </td>
                <td className="rm">({formatRM(doubleLineTotal(l))})</td>
              </tr>
            ))}
            <tr>
              <td>
                <strong>Adjusted income</strong>
              </td>
              <td className="rm">
                <strong>{formatRM(result.adjustedSen)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
        </div>

        <h3>C · Capital allowances (Sch 3)</h3>
        {eng.schedule3.enabled ? (
          <div>
            <div className="flag">
              External schedule: {eng.schedule3.note || "no basis noted"} — verify basis before filing.
            </div>
            <OverrideTable eng={eng} />
          </div>
        ) : (
        <div className="tscroll">
        <table className="w">
          <thead>
            <tr>
              <th>Asset</th>
              <th style={{ textAlign: "right" }}>RE b/f</th>
              <th style={{ textAlign: "right" }}>IA</th>
              <th style={{ textAlign: "right" }}>AA</th>
              <th style={{ textAlign: "right" }}>CA</th>
              <th style={{ textAlign: "right" }}>RE c/f</th>
            </tr>
          </thead>
          <tbody>
            {assetRows.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.description}
                  {r.notes.map((n) => (
                    <div key={n} className="hint">
                      {n}
                    </div>
                  ))}
                  {r.balancingChargeSen > 0 && (
                    <div className="hint">BC: {formatRM(r.balancingChargeSen)}</div>
                  )}
                  {r.balancingAllowanceSen > 0 && (
                    <div className="hint">BA: {formatRM(r.balancingAllowanceSen)}</div>
                  )}
                </td>
                <td className="rm">{formatRM(r.residualBfSen)}</td>
                <td className="rm">{formatRM(r.iaSen)}</td>
                <td className="rm">{formatRM(r.aaSen)}</td>
                <td className="rm">{formatRM(r.totalCaSen)}</td>
                <td className="rm">{formatRM(r.residualCfSen)}</td>
              </tr>
            ))}
            <tr>
              <td>
                <strong>Total</strong>
              </td>
              <td className="rm" colSpan={3}></td>
              <td className="rm">
                <strong>{formatRM(result.totalCaSen)}</strong>
              </td>
              <td className="rm">
                <strong>{formatRM(result.residualCfSen)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
        )}

        <h3>D · Statutory → chargeable → payable</h3>
        <div className="tscroll">
        <table className="w">
          <tbody>
            <tr>
              <td>Statutory business income (before incentives)</td>
              <td className="rm">{formatRM(result.statutoryBeforeIncentivesSen)}</td>
            </tr>
            {result.raAbsorbedSen > 0 && (
              <tr><td>Less: RA absorbed <span className="hint">[Sch 7A, c/f {formatRM(result.raCfSen)}]</span></td><td className="rm">({formatRM(result.raAbsorbedSen)})</td></tr>
            )}
            {result.itaAbsorbedSen > 0 && (
              <tr><td>Less: ITA absorbed <span className="hint">[c/f {formatRM(result.itaCfSen)}]</span></td><td className="rm">({formatRM(result.itaAbsorbedSen)})</td></tr>
            )}
            {result.groupReliefSen > 0 && (
              <tr><td>Less: group relief surrendered <span className="hint">[s.44A]</span></td><td className="rm">({formatRM(result.groupReliefSen)})</td></tr>
            )}
            {eng.nonBusiness.map((l) => (
              <tr key={l.id}>
                <td>Add: {l.label} <span className="hint">[per-source, floor NIL]</span></td>
                <td className="rm">{formatRM(Math.max(0, rmStrToSen(l.amountRM)))}</td>
              </tr>
            ))}
            {deemed.lines.map((l, i) => (
              <tr key={`${l.name}-${i}`}>
                <td>Add: deemed interest — {l.name} <span className="hint">[s.140B]</span></td>
                <td className="rm">{formatRM(l.amountSen)}</td>
              </tr>
            ))}
            <tr>
              <td>Aggregate income</td>
              <td className="rm">{formatRM(result.aggregateSen)}</td>
            </tr>
            <tr>
              <td>
                Chargeable income <span className="hint">({formatRM(result.chargeableExactSen)} → Form C whole RM)</span>
              </td>
              <td className="rm">{formatRM(result.chargeableSen)}</td>
            </tr>
            <tr>
              <td>Gross tax</td>
              <td className="rm">{formatRM(result.grossTaxSen)}</td>
            </tr>
            <tr>
              <td>
                <strong>Balance of tax payable</strong>
              </td>
              <td className="rm">
                <strong>{formatRM(result.taxPayableSen)}</strong>
              </td>
            </tr>
            <tr>
              <td>
                Net cash {result.netCashSen <= 0 ? "(recoverable)" : "payable"}{" "}
                <span className="hint">
                  {eng.priorCreditVerified ? "after verified prior credits" : "prior credits UNVERIFIED — excluded"}
                </span>
              </td>
              <td className="rm">{formatRM(result.netCashSen)}</td>
            </tr>
            <tr>
              <td>CP204 penalty</td>
              <td className="rm">{formatRM(result.cp204PenaltySen)}</td>
            </tr>
          </tbody>
        </table>
        </div>

        <h3>Checklist — {doneCount}/{CHECKLIST.length}</h3>
        {CHECKLIST.map((c, i) => (
          <CheckRow
            key={c}
            label={c}
            checked={eng.checks[i] ?? false}
            on={(v) =>
              props.onChecklist(i, v)
            }
          />
        ))}
      </div>
    </div>
  );
}

function OverrideTable(props: { eng: Engagement }): JSX.Element {
  const o = props.eng.schedule3;
  return (
    <table className="w">
      <tbody>
        <tr><td>RE b/f + additions − CA − disposed RE − RE c/f = {formatRM(rmStrToSen(o.reBfRM) + rmStrToSen(o.additionsRM) - rmStrToSen(o.caRM) - rmStrToSen(o.disposedReRM) - rmStrToSen(o.reCfRM))}</td><td className="rm"></td></tr>
        <tr><td>CA deducted</td><td className="rm">{formatRM(rmStrToSen(o.caRM))}</td></tr>
        <tr><td>Balancing charge</td><td className="rm">{formatRM(rmStrToSen(o.bcRM))}</td></tr>
        <tr><td>RE c/f → opens next YA</td><td className="rm">{formatRM(rmStrToSen(o.reCfRM))}</td></tr>
      </tbody>
    </table>
  );
}

function CheckRow(props: { label: string; checked: boolean; on: (v: boolean) => void }): JSX.Element {
  return (
    <label className="check">
      <input type="checkbox" checked={props.checked} onChange={(e) => props.on(e.target.checked)} />
      <span>{props.label}</span>
    </label>
  );
}
