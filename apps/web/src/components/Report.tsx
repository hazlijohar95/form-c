import { useMemo } from "react";
import { checkSme, computeAsset, computeFormC, deemedInterest140B, earningsStripping, formatRM } from "@formc/engine";
import type { FormCInput, WhtSection } from "@formc/engine";
import { CHECKLIST, rmStrToSen, toAssetInput } from "../lib/types.js";
import type { Engagement, RunRecord } from "../lib/types.js";

const WHT_SECTIONS: WhtSection[] = ["s.109-interest", "s.109-royalty", "s.109B", "s.107A", "s.109A"];

export function whtSectionList(): WhtSection[] {
  return WHT_SECTIONS;
}

// s.140B deemed interest from related-account month-ends: peak debit ×
// months in debit × market rate.
export function deemed140B(eng: Engagement): { lines: { name: string; amountSen: number }[]; totalSen: number } {
  const rate = Number(eng.deemedRatePct);
  if (!Number.isFinite(rate) || rate <= 0) return { lines: [], totalSen: 0 };
  const lines = eng.relatedAccounts.flatMap((a) => {
    const nums = a.balances.map((b) => Number(b)).filter((n) => Number.isFinite(n));
    if (nums.every((n) => n >= 0)) return [];
    const peak = Math.max(0, ...nums.map((n) => -n));
    const months = nums.filter((n) => n < 0).length;
    const amt = deemedInterest140B(Math.round(peak * 100), months, rate);
    return amt > 0 ? [{ name: a.name || "related account", amountSen: amt }] : [];
  });
  return { lines, totalSen: lines.reduce((a, l) => a + l.amountSen, 0) };
}

export function useComputation(eng: Engagement): {
  result: ReturnType<typeof computeFormC>;
  assetRows: ReturnType<typeof computeAsset>[];
} {
  return useMemo(() => {
    const sme = {
      paidUpCapitalRM: Number(eng.paidUpRM) || 0,
      grossBusinessIncomeRM: Number(eng.grossIncRM) || 0,
      controlsLargeCompany: eng.controlsLarge,
      controlledByLargeCompany: eng.controlledByLarge,
      foreignOwnershipPct: Number(eng.foreignPct) || 0,
      isResident: true,
    };
    const smeRes = checkSme(sme);
    let smallUsed = 0;
    const assetRows = eng.assets.map((a) => {
      const r = computeAsset(toAssetInput(a), smeRes.qualifies, smallUsed);
      if (a.category === "small-value") smallUsed += rmStrToSen(a.costRM);
      return r;
    });
    const o = eng.schedule3;
    const useOverride = o.enabled;
    const input: FormCInput = {
      ya: eng.ya,
      companyName: eng.companyName,
      regNo: eng.regNo,
      fyeFrom: eng.fyeFrom,
      fyeTo: eng.fyeTo,
      sme,
      netProfitSen: rmStrToSen(eng.netProfitRM),
      addBacks: eng.addBacks.map((l) => ({
        description: l.description || "(unnamed)",
        amountSen: rmStrToSen(l.amountRM),
        section: l.section,
      })),
      credits: eng.credits.map((l) => ({
        description: l.description || "(unnamed)",
        amountSen: rmStrToSen(l.amountRM),
        basis: l.basis,
      })),
      doubleDeductions: eng.doubleDeductions.map((l) => ({
        description: l.description || "(unnamed)",
        amountSen: rmStrToSen(l.amountRM),
        authority: l.authority,
        code: l.code || undefined,
        capSen: l.capRM === "" ? undefined : rmStrToSen(l.capRM),
      })),
      assets: eng.assets.map(toAssetInput),
      nonBusiness: eng.nonBusiness.map((l) => ({ label: l.label || "(unnamed)", amountSen: rmStrToSen(l.amountRM) })),
      whtLines: eng.whtLines.map((l) => ({
        description: l.description || "(unnamed)",
        amountSen: rmStrToSen(l.amountRM),
        section: (WHT_SECTIONS.includes(l.section as WhtSection) ? l.section : "s.109B") as WhtSection,
        remitted: l.remitted,
      })),
      deemedInterestSen: deemed140B(eng).totalSen,
      relatedInterestSen: rmStrToSen(eng.relatedInterestRM),
      taxEbitdaSen: rmStrToSen(eng.taxEbitdaRM),
      raQeSen: rmStrToSen(eng.raQeRM),
      raBfSen: rmStrToSen(eng.raBfRM),
      itaAllowanceSen: rmStrToSen(eng.itaAllowanceRM),
      itaBfSen: rmStrToSen(eng.itaBfRM),
      itaPct: eng.itaPct === "100" ? 100 : 70,
      pioneerExemptSen: rmStrToSen(eng.pioneerExemptRM),
      groupSurrenderedSen: rmStrToSen(eng.groupSurrenderedRM),
      groupSurrendererLossSen: rmStrToSen(eng.groupSurrendererLossRM),
      groupConditionsMet: eng.groupConditionsMet,
      isIhc: eng.isIhc,
      schedule3Override: useOverride
        ? {
            caSen: rmStrToSen(o.caRM),
            balancingChargeSen: rmStrToSen(o.bcRM),
            balancingAllowanceSen: rmStrToSen(o.baRM),
            residualBfSen: rmStrToSen(o.reBfRM),
            additionsSen: rmStrToSen(o.additionsRM),
            disposedReSen: rmStrToSen(o.disposedReRM),
            residualCfSen: rmStrToSen(o.reCfRM),
            note: o.note || "external schedule",
          }
        : undefined,
      donationsSen: rmStrToSen(eng.donationsRM),
      zakatSen: rmStrToSen(eng.zakatRM),
      currentLossOffsetSen: rmStrToSen(eng.currentLossOffsetRM),
      bfLosses: eng.bfLosses.map((l) => ({
        yearOfAssessment: Number(l.ya) || 0,
        amountBfSen: rmStrToSen(l.amountRM),
      })),
      unabsorbedCaBfSen: rmStrToSen(eng.unabsorbedCaBfRM),
      cp204EstimateSen: rmStrToSen(eng.cp204EstimateRM),
      cp204PaidSen: rmStrToSen(eng.cp204PaidRM),
      whtCreditSen: rmStrToSen(eng.whtCreditRM),
      bilateralCreditSen: rmStrToSen(eng.bilateralCreditRM),
      priorCreditSen: eng.priorCreditVerified ? rmStrToSen(eng.priorCreditRM) : 0,
    };
    return { result: computeFormC(input), assetRows };
  }, [eng]);
}

export function Report(props: { eng: Engagement; onChecklist: (i: number, v: boolean) => void; onSnapshot: (r: RunRecord) => void }): JSX.Element {
  const { eng } = props;
  const { result, assetRows } = useComputation(eng);
  const deemed = deemed140B(eng);
  const stripSen = earningsStripping(rmStrToSen(eng.relatedInterestRM), rmStrToSen(eng.taxEbitdaRM));
  const doneCount = eng.checks.filter(Boolean).length;
  const exportJson = JSON.stringify(
    {
      form: "C",
      ya: eng.ya,
      company: eng.companyName,
      regNo: eng.regNo,
      chargeableIncomeSen: result.chargeableSen,
      grossTaxSen: result.grossTaxSen,
      taxPayableSen: result.taxPayableSen,
      cp204PenaltySen: result.cp204PenaltySen,
      smeQualifies: result.smeQualifies,
      filingDeadline: result.filingDeadline,
      checklist: CHECKLIST.map((c, i) => ({ item: c, done: eng.checks[i] })),
    },
    null,
    2
  );

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
            <button className="btn" onClick={() => window.print()}>
              Print
            </button>
            <button className="btn" onClick={() => props.onSnapshot({ at: new Date().toISOString(), ciSen: result.chargeableSen, taxSen: result.grossTaxSen, payableSen: result.taxPayableSen })}>
              Snapshot run
            </button>
            <button
              className="btn primary"
              disabled={doneCount < CHECKLIST.length}
              onClick={() => void navigator.clipboard.writeText(exportJson)}
            >
              Copy MyTax JSON
            </button>
          </div>
        </div>

        {result.findings.map((f) => (
          <div key={f} className="flag crit">
            {f}
          </div>
        ))}

        <h3>A · Adjusted income</h3>
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
                <td className="rm">({formatRM(Math.min(rmStrToSen(l.amountRM), l.capRM === "" ? rmStrToSen(l.amountRM) : rmStrToSen(l.capRM)))})</td>
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

        <h3>C · Capital allowances (Sch 3)</h3>
        {eng.schedule3.enabled ? (
          <div>
            <div className="flag">
              External schedule: {eng.schedule3.note || "no basis noted"} — verify basis before filing.
            </div>
            <OverrideTable eng={eng} />
          </div>
        ) : (
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
        )}

        <h3>D · Statutory → chargeable → payable</h3>
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
            {deemed.lines.map((l) => (
              <tr key={l.name}>
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
