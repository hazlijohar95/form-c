import { earningsStripping, formatRM } from "@formc/engine";
import { checklistFor } from "../lib/types.js";
import { plural } from "../lib/lists.js";
import { rmStrToSen, signedRmToSen } from "../lib/rm.js";
import { buildMytaxExport, doubleLineTotal } from "../lib/myexport.js";
import { deemed140B, useComputation, computeEngagementB, computeEngagementP, whtSectionList } from "../lib/computation.js";
import { copyText } from "../lib/clipboard.js";
import type { Engagement, RunRecord } from "../lib/types.js";
import { TableScroll } from "./ui/primitives.js";

export { whtSectionList };

export function Report(props: { eng: Engagement; onChecklist: (i: number, v: boolean) => void; onSnapshot: (r: RunRecord) => void; notify: (t: { title: string; detail?: string; err?: boolean }) => void }): JSX.Element {
  const { eng } = props;
  if (eng.formType === "P") return <ReportP eng={eng} onChecklist={props.onChecklist} onSnapshot={props.onSnapshot} notify={props.notify} />;
  if (eng.formType === "B") return <ReportB eng={eng} onChecklist={props.onChecklist} onSnapshot={props.onSnapshot} notify={props.notify} />;
  const checklist = checklistFor(eng.formType);
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
          <ReportToolbar
            buildSnapshot={() => ({ at: new Date().toISOString(), ciSen: result.chargeableSen, taxSen: result.grossTaxSen, payableSen: result.taxPayableSen })}
            onSnapshot={props.onSnapshot}
            exportJson={exportJson}
            doneCount={doneCount}
            total={checklist.length}
            notify={props.notify}
          />
        </div>

        {result.findings.map((f) => (
          <div key={f} className="flag crit" role="alert">
            {f}
          </div>
        ))}

        <h3>A · Adjusted income</h3>
        <TableScroll label="Adjusted income table">
        <table className="w">
          <tbody>
            <tr>
              <th scope="row">Net profit per accounts</th>
              <td className="rm">{formatRM(rmStrToSen(eng.netProfitRM))}</td>
            </tr>
            {eng.addBacks.map((l) => (
              <tr key={l.id}>
                <th scope="row">
                  Add: {l.description} <span className="hint">[{l.section}]</span>
                </th>
                <td className="rm">{formatRM(rmStrToSen(l.amountRM))}</td>
              </tr>
            ))}
            {eng.whtLines.filter((l) => !l.remitted).map((l) => (
              <tr key={l.id}>
                <th scope="row">
                  Add: {l.description} <span className="hint">[s.39(2) — WHT {l.section} not remitted, auto]</span>
                </th>
                <td className="rm">{formatRM(rmStrToSen(l.amountRM))}</td>
              </tr>
            ))}
            {stripSen > 0 && (
              <tr>
                <th scope="row">
                  Add: related-party interest excess <span className="hint">[s.140C — auto]</span>
                </th>
                <td className="rm">{formatRM(stripSen)}</td>
              </tr>
            )}
            {eng.credits.map((l) => (
              <tr key={l.id}>
                <th scope="row">
                  Less: {l.description} <span className="hint">[{l.basis || "non-taxable"}]</span>
                </th>
                <td className="rm">({formatRM(rmStrToSen(l.amountRM))})</td>
              </tr>
            ))}
            {eng.doubleDeductions.map((l) => (
              <tr key={l.id}>
                <th scope="row">
                  Less: {l.description} (double){" "}
                  <span className="hint">[{l.code ? `D1 ${l.code}, ` : ""}{l.authority || "s.34"}{l.capRM ? `, cap RM${l.capRM}` : ""}]</span>
                </th>
                <td className="rm">({formatRM(doubleLineTotal(l))})</td>
              </tr>
            ))}
            <tr>
              <th scope="row">
                <strong>Adjusted income</strong>
              </th>
              <td className="rm">
                <strong>{formatRM(result.adjustedSen)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
        </TableScroll>

        <h3>C · Capital allowances (Sch 3)</h3>
        {eng.schedule3.enabled ? (
          <div>
            <div className="flag">
              External schedule: {eng.schedule3.note || "no basis noted"} — verify basis before filing.
            </div>
            <OverrideTable eng={eng} />
          </div>
        ) : (
        <TableScroll label="Capital allowances table">
        <table className="w">
          <thead>
            <tr>
              <th>Asset</th>
              <th className="num-h">RE b/f</th>
              <th className="num-h">IA</th>
              <th className="num-h">AA</th>
              <th className="num-h">CA</th>
              <th className="num-h">RE c/f</th>
            </tr>
          </thead>
          <tbody>
            {assetRows.map((r) => (
              <tr key={r.id}>
                <th scope="row">
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
                </th>
                <td className="rm">{formatRM(r.residualBfSen)}</td>
                <td className="rm">{formatRM(r.iaSen)}</td>
                <td className="rm">{formatRM(r.aaSen)}</td>
                <td className="rm">{formatRM(r.totalCaSen)}</td>
                <td className="rm">{formatRM(r.residualCfSen)}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">
                <strong>Total</strong>
              </th>
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
        </TableScroll>
        )}

        <h3>D · Statutory → chargeable → payable</h3>
        <TableScroll label="Statutory to payable table">
        <table className="w">
          <tbody>
            <tr>
              <th scope="row">Statutory business income (before incentives)</th>
              <td className="rm">{formatRM(result.statutoryBeforeIncentivesSen)}</td>
            </tr>
            {result.raAbsorbedSen > 0 && (
              <tr><th scope="row">Less: RA absorbed <span className="hint">[Sch 7A, c/f {formatRM(result.raCfSen)}]</span></th><td className="rm">({formatRM(result.raAbsorbedSen)})</td></tr>
            )}
            {result.itaAbsorbedSen > 0 && (
              <tr><th scope="row">Less: ITA absorbed <span className="hint">[c/f {formatRM(result.itaCfSen)}]</span></th><td className="rm">({formatRM(result.itaAbsorbedSen)})</td></tr>
            )}
            {result.groupReliefSen > 0 && (
              <tr><th scope="row">Less: group relief surrendered <span className="hint">[s.44A]</span></th><td className="rm">({formatRM(result.groupReliefSen)})</td></tr>
            )}
            {eng.nonBusiness.map((l) => (
              <tr key={l.id}>
                <th scope="row">Add: {l.label} <span className="hint">[per-source, floor NIL]</span></th>
                <td className="rm">{formatRM(Math.max(0, rmStrToSen(l.amountRM)))}</td>
              </tr>
            ))}
            {deemed.lines.map((l, i) => (
              <tr key={`${l.name}-${i}`}>
                <th scope="row">Add: deemed interest — {l.name} <span className="hint">[s.140B]</span></th>
                <td className="rm">{formatRM(l.amountSen)}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">Aggregate income</th>
              <td className="rm">{formatRM(result.aggregateSen)}</td>
            </tr>
            <tr>
              <th scope="row">
                Chargeable income <span className="hint">({formatRM(result.chargeableExactSen)} → Form C whole RM)</span>
              </th>
              <td className="rm">{formatRM(result.chargeableSen)}</td>
            </tr>
            <tr>
              <th scope="row">Gross tax</th>
              <td className="rm">{formatRM(result.grossTaxSen)}</td>
            </tr>
            <tr>
              <th scope="row">
                <strong>Balance of tax payable</strong>
              </th>
              <td className="rm">
                <strong>{formatRM(result.taxPayableSen)}</strong>
              </td>
            </tr>
            <tr>
              <th scope="row">
                Net cash {result.netCashSen <= 0 ? "(recoverable)" : "payable"}{" "}
                <span className="hint">
                  ({eng.priorCreditVerified ? "after verified prior credits" : "prior credits unverified — excluded"})
                </span>
              </th>
              <td className="rm">{formatRM(result.netCashSen)}</td>
            </tr>
            <tr>
              <th scope="row">CP204 penalty</th>
              <td className="rm">{formatRM(result.cp204PenaltySen)}</td>
            </tr>
          </tbody>
        </table>
        </TableScroll>

        <ChecklistRows items={checklist} checks={eng.checks} onChecklist={props.onChecklist} />
        <details>
          <summary>View MyTax JSON</summary>
          <pre className="export">{exportJson}</pre>
        </details>
      </div>
    </div>
  );
}

// Form P report: information return — divisional income per firm plus the
// partner allocation schedule. No bands, no tax: partners are taxed on Form B.
function ReportP(props: { eng: Engagement; onChecklist: (i: number, v: boolean) => void; onSnapshot: (r: RunRecord) => void; notify: (t: { title: string; detail?: string; err?: boolean }) => void }): JSX.Element {
  const { eng } = props;
  const { results } = computeEngagementP(eng);
  const checklist = checklistFor(eng.formType);
  const doneCount = eng.checks.filter(Boolean).length;
  const exportJson = buildMytaxExport(eng);
  const divisionalTotal = results.reduce((a, r) => a + r.statutorySen, 0);
  return (
    <div className="report">
      <div className="card">
        <div className="rephead">
          <div>
            <h2>
              Partnership return (Form P) — {eng.companyName} {eng.regNo && `(${eng.regNo})`}
            </h2>
            <div className="hint">
              Form P · YA {eng.ya} · information return — tax is charged at partner level (Form B)
            </div>
          </div>
          <ReportToolbar
            buildSnapshot={() => ({ at: new Date().toISOString(), ciSen: divisionalTotal, taxSen: 0, payableSen: 0 })}
            onSnapshot={props.onSnapshot}
            exportJson={exportJson}
            doneCount={doneCount}
            total={checklist.length}
            notify={props.notify}
          />
        </div>

        {results.flatMap((r) => r.findings).map((f) => (
          <div key={f} className="flag crit" role="alert">
            {f}
          </div>
        ))}

        <h3>A · Divisional income per firm</h3>
        <TableScroll label="Divisional income table">
        <table className="w">
          <tbody>
            {results.map((r) => (
              <tr key={r.label}>
                <th scope="row">
                  {r.label} <span className="hint">[adjusted {formatRM(r.adjustedSen)} − CA {formatRM(r.totalCaSen)}]</span>
                </th>
                <td className="rm">{formatRM(r.statutorySen)}</td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr><td className="hint">No firms entered — see Entry tab.</td></tr>
            )}
            <tr>
              <th scope="row"><strong>Divisional total</strong></th>
              <td className="rm"><strong>{formatRM(divisionalTotal)}</strong></td>
            </tr>
          </tbody>
        </table>
        </TableScroll>

        <h3>B · Partner allocation schedule</h3>
        <TableScroll label="Partner allocation table">
        <table className="w">
          <tbody>
            {results.map((r) => r.allocations.map((a) => (
              <tr key={`${r.label}-${a.name}`}>
                <th scope="row">
                  {a.name || "(unnamed)"} — {r.label}{" "}
                  <span className="hint">[salary {formatRM(a.salarySen)} + interest {formatRM(a.interestSen)} + balance {formatRM(a.balanceShareSen)}]</span>
                </th>
                <td className="rm">{formatRM(a.totalSen)}</td>
              </tr>
            )))}
          </tbody>
        </table>
        </TableScroll>

        <ChecklistRows items={checklist} checks={eng.checks} onChecklist={props.onChecklist} />
        <details>
          <summary>View MyTax JSON</summary>
          <pre className="export">{exportJson}</pre>
        </details>
      </div>
    </div>
  );
}

function ReportB(props: { eng: Engagement; onChecklist: (i: number, v: boolean) => void; onSnapshot: (r: RunRecord) => void; notify: (t: { title: string; detail?: string; err?: boolean }) => void }): JSX.Element {
  const { eng } = props;
  const { result } = computeEngagementB(eng);
  const checklist = checklistFor(eng.formType);
  const doneCount = eng.checks.filter(Boolean).length;
  const exportJson = buildMytaxExport(eng);
  return (
    <div className="report">
      <div className="card">
        <div className="rephead">
          <div>
            <h2>
              Tax computation (Form B) — {eng.companyName} {eng.regNo && `(${eng.regNo})`}
            </h2>
            <div className="hint">
              Form B · YA {eng.ya} · Individual graduated bands · CP500 (s.107B)
            </div>
          </div>
          <ReportToolbar
            buildSnapshot={() => ({ at: new Date().toISOString(), ciSen: result.chargeableSen, taxSen: result.grossTaxSen, payableSen: result.taxPayableSen })}
            onSnapshot={props.onSnapshot}
            exportJson={exportJson}
            doneCount={doneCount}
            total={checklist.length}
            notify={props.notify}
          />
        </div>

        {result.findings.map((f) => (
          <div key={f} className="flag crit" role="alert">
            {f}
          </div>
        ))}

        <h3>A · Businesses + other sources</h3>
        <TableScroll label="Business statutory table">
        <table className="w">
          <tbody>
            {result.businesses.map((b) => (
              <tr key={b.label}>
                <th scope="row">
                  {b.label} <span className="hint">[adjusted {formatRM(b.adjustedSen)} − CA {formatRM(b.totalCaSen)}]</span>
                </th>
                <td className="rm">{formatRM(b.statutorySen)}</td>
              </tr>
            ))}
            {result.businesses.length === 0 && (
              <tr><td className="hint">No businesses entered — see Entry tab.</td></tr>
            )}
            {eng.partnerShares.map((s) => (
              <tr key={s.id}>
                <th scope="row">
                  {signedRmToSen(s.allocatedRM) < 0 ? "Loss share" : "Partnership share"} — {s.partnershipName || "(unnamed)"}{" "}
                  <span className="hint">[{s.ratioPct || "?"}%{signedRmToSen(s.allocatedRM) < 0 ? " · offsets other income" : ""}]</span>
                </th>
                <td className="rm">{formatRM(signedRmToSen(s.allocatedRM))}</td>
              </tr>
            ))}
            {eng.employmentRM !== "" && (
              <tr>
                <th scope="row">Employment income <span className="hint">[per EA]</span></th>
                <td className="rm">{formatRM(rmStrToSen(eng.employmentRM))}</td>
              </tr>
            )}
            {eng.nonBusiness.map((l) => (
              <tr key={l.id}>
                <th scope="row">Add: {l.label} <span className="hint">[per-source, floor NIL]</span></th>
                <td className="rm">{formatRM(Math.max(0, rmStrToSen(l.amountRM)))}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">Aggregate income</th>
              <td className="rm">{formatRM(result.aggregateSen)}</td>
            </tr>
            {result.donationsAllowedSen > 0 && (
              <tr>
                <th scope="row"><span className="hint">of which: donations absorbed {formatRM(result.donationsAllowedSen)}</span></th>
                <td className="rm"></td>
              </tr>
            )}
          </tbody>
        </table>
        </TableScroll>

        <h3>B · Reliefs → chargeable → payable</h3>
        <TableScroll label="Reliefs to payable table">
        <table className="w">
          <tbody>
            {result.reliefRows.map((r, i) => (
              <tr key={`${r.key}-${i}`}>
                <th scope="row">
                  Less: {r.label || r.key}{" "}
                  {r.allowedSen < r.claimedSen && (
                    <span className="hint">[capped {formatRM(r.claimedSen)} → {formatRM(r.allowedSen)}]</span>
                  )}
                </th>
                <td className="rm">({formatRM(r.allowedSen)})</td>
              </tr>
            ))}
            <tr>
              <th scope="row">
                Chargeable income <span className="hint">({formatRM(result.chargeableExactSen)} → whole RM)</span>
              </th>
              <td className="rm">{formatRM(result.chargeableSen)}</td>
            </tr>
            <tr>
              <th scope="row">Gross tax <span className="hint">[graduated bands]</span></th>
              <td className="rm">{formatRM(result.grossTaxSen)}</td>
            </tr>
            {result.rebatesAllowedSen > 0 && (
              <tr>
                <th scope="row">Less: rebates (zakat fitrah) <span className="hint">[reduce tax]</span></th>
                <td className="rm">({formatRM(result.rebatesAllowedSen)})</td>
              </tr>
            )}
            <tr>
              <th scope="row">
                <strong>Balance of tax payable</strong>
              </th>
              <td className="rm">
                <strong>{formatRM(result.taxPayableSen)}</strong>
              </td>
            </tr>
            <tr>
              <th scope="row">
                Net cash {result.netCashSen <= 0 ? "(recoverable)" : "payable"}{" "}
                <span className="hint">
                  ({eng.priorCreditVerified ? "after verified prior credits" : "prior credits unverified — excluded"})
                </span>
              </th>
              <td className="rm">{formatRM(result.netCashSen)}</td>
            </tr>
          </tbody>
        </table>
        </TableScroll>

        <ChecklistRows items={checklist} checks={eng.checks} onChecklist={props.onChecklist} />
        <details>
          <summary>View MyTax JSON</summary>
          <pre className="export">{exportJson}</pre>
        </details>
      </div>
    </div>
  );
}

function OverrideTable(props: { eng: Engagement }): JSX.Element {
  const o = props.eng.schedule3;
  return (
    <TableScroll label="External schedule override table">
    <table className="w">
      <tbody>
        <tr><th scope="row">RE b/f + additions − CA − disposed RE − RE c/f = {formatRM(rmStrToSen(o.reBfRM) + rmStrToSen(o.additionsRM) - rmStrToSen(o.caRM) - rmStrToSen(o.disposedReRM) - rmStrToSen(o.reCfRM))}</th><td className="rm"></td></tr>
        <tr><th scope="row">CA deducted</th><td className="rm">{formatRM(rmStrToSen(o.caRM))}</td></tr>
        <tr><th scope="row">Balancing charge</th><td className="rm">{formatRM(rmStrToSen(o.bcRM))}</td></tr>
        <tr><th scope="row">RE c/f → opens next YA</th><td className="rm">{formatRM(rmStrToSen(o.reCfRM))}</td></tr>
      </tbody>
    </table>
    </TableScroll>
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

type Notify = (t: { title: string; detail?: string; err?: boolean }) => void;

// Print / snapshot / gated-export toolbar shared by the C, B, and P
// reports — the snapshot payload is built at click time by each caller.
function ReportToolbar(props: {
  buildSnapshot: () => RunRecord;
  onSnapshot: (r: RunRecord) => void;
  exportJson: string;
  doneCount: number;
  total: number;
  notify: Notify;
}): JSX.Element {
  const remaining = props.total - props.doneCount;
  return (
    <>
      <div className="toolbar no-print">
        <button type="button" className="btn btn-xs" onClick={() => window.print()}>
          Print
        </button>
        <button type="button" className="btn btn-xs" onClick={() => props.onSnapshot(props.buildSnapshot())}>
          Snapshot
        </button>
        <button
          type="button"
          className="btn btn-xs primary"
          disabled={props.doneCount < props.total}
          title={props.doneCount < props.total ? `Complete ${remaining} ${plural(remaining, "checklist item")} to unlock export` : "Copy MyTax JSON to clipboard"}
          aria-describedby="export-hint"
          onClick={() => {
            void copyText(props.exportJson).then((ok) =>
              ok
                ? props.notify({ title: "MyTax JSON copied", detail: "Paste into your export record." })
                : props.notify({ title: "Copy failed", detail: "Select the JSON below and copy manually.", err: true })
            );
          }}
        >
          Copy MyTax JSON
        </button>
      </div>
      {props.doneCount < props.total ? (
        <p className="hint" id="export-hint">
          Export unlocks when all {props.total} checklist items are done — {remaining} remaining.
        </p>
      ) : (
        <p className="hint" id="export-hint">
          Checklist complete — ready to export.
        </p>
      )}
    </>
  );
}

function ChecklistRows(props: { items: string[]; checks: boolean[]; onChecklist: (i: number, v: boolean) => void }): JSX.Element {
  const done = props.checks.filter(Boolean).length;
  return (
    <>
      <h3>Checklist — {done}/{props.items.length}</h3>
      {props.items.map((c, i) => (
        <CheckRow
          key={c}
          label={c}
          checked={props.checks[i] ?? false}
          on={(v) => props.onChecklist(i, v)}
        />
      ))}
    </>
  );
}
