import { formatRM } from "@formc/engine";
import { computeEngagement, computeEngagementB, computeEngagementP, headsOf } from "../lib/computation.js";
import { rolloverEngagement, rolloverEngagementB, rolloverEngagementP } from "../lib/rollover.js";
import type { Engagement } from "../lib/types.js";

export function LiveRail(props: { eng: Engagement; onRollover: (next: Engagement) => void }): JSX.Element {
  const isB = props.eng.formType === "B";
  const isP = props.eng.formType === "P";
  if (isP) {
    const { results } = computeEngagementP(props.eng);
    const divisional = results.reduce((a, r) => a + r.statutorySen, 0);
    const partners = results.reduce((a, r) => a + r.allocations.length, 0);
    const done = props.eng.checks.filter(Boolean).length;
    const total = props.eng.checks.length;
    return (
      <aside className="rail no-print" aria-label="Live position">
        <section className="card" data-variant={done === total ? "success" : "normal"} aria-labelledby="live-h">
          <h3 id="live-h">Live position</h3>
          <div className="rail-figs">
            <div className="kv">
              <span>Divisional</span>
              <span className="num">{formatRM(divisional)}</span>
            </div>
            <div className="kv">
              <span>Partners</span>
              <span className="num">{partners}</span>
            </div>
            <div className="kv">
              <span>Checklist</span>
              <span className="num">{done}/{total}</span>
            </div>
          </div>
          <div className="progress" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} aria-label="Checklist progress">
            <div className="progress-fill" style={{ width: `${total ? Math.round((done / total) * 100) : 0}%` }} />
          </div>
          <div className="toolbar">
            <button
              type="button"
              className="btn btn-xs"
              onClick={() => props.onRollover(rolloverEngagementP(props.eng, computeEngagementP(props.eng).results))}
            >
              Rollover YA{props.eng.ya + 1}
            </button>
          </div>
        </section>
      </aside>
    );
  }
  const heads = headsOf(props.eng);
  function rollover(): void {
    props.onRollover(
      isB
        ? rolloverEngagementB(props.eng, computeEngagementB(props.eng).result)
        : rolloverEngagement(props.eng, computeEngagement(props.eng).result)
    );
  }
  const done = props.eng.checks.filter(Boolean).length;
  const total = props.eng.checks.length;
  return (
    <aside className="rail no-print" aria-label="Live position">
      <section className="card" data-variant={done === total ? "success" : "normal"} aria-labelledby="live-h">
        <h3 id="live-h">Live position</h3>
        {/*
         * "Balance of tax", not "tax payable": this figure is gross tax less
         * CP204, WHT and bilateral credits, so labelling it "tax payable" reads
         * as the gross charge and understates the liability at a glance. Gross
         * tax sits directly above it to make the set-off visible.
         */}
        <div className="rail-figs">
          <div className="kv">
            <span>Chargeable</span>
            <span className="num">{formatRM(heads.ciSen)}</span>
          </div>
          <div className="kv">
            <span>Gross tax</span>
            <span className="num">{formatRM(heads.taxSen)}</span>
          </div>
          <div className="kv">
            <span>Balance of tax</span>
            <span className="num">{formatRM(heads.payableSen)}</span>
          </div>
          <div className="kv">
            <span>Checklist</span>
            <span className="num">{done}/{total}</span>
          </div>
        </div>
        <div className="progress" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} aria-label="Checklist progress">
          <div className="progress-fill" style={{ width: `${total ? Math.round((done / total) * 100) : 0}%` }} />
        </div>
        <div className="toolbar">
          <button type="button" className="btn btn-xs" onClick={rollover}>
            Rollover YA{props.eng.ya + 1}
          </button>
        </div>
      </section>
    </aside>
  );
}
