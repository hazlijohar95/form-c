import { formatRM } from "@formc/engine";
import { computeEngagement, computeEngagementB, computeEngagementP, headsOf } from "../lib/computation.js";
import { rolloverEngagement, rolloverEngagementB, rolloverEngagementP } from "../lib/rollover.js";
import type { Engagement } from "../lib/types.js";

function Ring(props: { done: number; total: number }): JSX.Element {
  const pct = props.total ? props.done / props.total : 0;
  const r = 15.5;
  const c = 2 * Math.PI * r;
  return (
    <span className="rail-ring" role="img" aria-label={`${props.done} of ${props.total} checklist items done`}>
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r={r} className="rail-ring-bg" />
        <circle
          cx="20" cy="20" r={r} className="rail-ring-fg"
          strokeDasharray={`${c}`}
          strokeDashoffset={`${c * (1 - pct)}`}
        />
      </svg>
      <span className="rail-ring-n" aria-hidden="true">{props.done}/{props.total}</span>
    </span>
  );
}

function RailShell(props: {
  heroLabel: string;
  heroValue: string;
  heroHint: string;
  rows: { label: string; value: string }[];
  done: number;
  total: number;
  onRollover: () => void;
  rolloverLabel: string;
  onExport?: () => void;
  onSnapshot?: () => void;
}): JSX.Element {
  const exportReady = props.done === props.total;
  return (
    <aside className="rail no-print" aria-label="Live position">
      <section className="card rail-card" data-variant={exportReady ? "success" : "normal"} aria-labelledby="live-h">
        <div className="rail-top">
          <h3 id="live-h">Live position</h3>
          <span className="live-dot" aria-hidden="true"><span className="pulse" />Live</span>
        </div>
        <div className="rail-hero">
          <span className="rail-hero-label">{props.heroLabel}</span>
          <span className="rail-hero-value num">{props.heroValue}</span>
          <span className="hint rail-hero-hint">{props.heroHint}</span>
        </div>
        <div className="rail-figs">
          {props.rows.map((r) => (
            <div className="kv" key={r.label}>
              <span>{r.label}</span>
              <span className="num">{r.value}</span>
            </div>
          ))}
        </div>
        <div className="rail-check">
          <Ring done={props.done} total={props.total} />
          <div className="rail-check-meta">
            <span className="rail-check-t">Ready to file</span>
            <div className="progress" role="progressbar" aria-valuenow={props.done} aria-valuemin={0} aria-valuemax={props.total} aria-label="Checklist progress">
              <div className="progress-fill" style={{ width: `${props.total ? Math.round((props.done / props.total) * 100) : 0}%` }} />
            </div>
          </div>
        </div>
        <div className="rail-actions">
          {props.onExport && (
            <button type="button" className="btn btn-xs primary" disabled={!exportReady} onClick={props.onExport} aria-describedby="rail-export-hint">
              Copy MyTax JSON
            </button>
          )}
          {props.onSnapshot && (
            <button type="button" className="btn btn-xs" onClick={props.onSnapshot}>
              Snapshot
            </button>
          )}
          <button type="button" className="btn btn-xs ghost" onClick={props.onRollover}>
            {props.rolloverLabel}
          </button>
        </div>
        <p className="hint rail-note" id="rail-export-hint">
          {exportReady ? "Checklist complete — ready to export." : "Export unlocks when the checklist is complete."}
        </p>
      </section>
      <p className="hint rail-note">Totals recompute on every keystroke — no Save button needed.</p>
    </aside>
  );
}

export function LiveRail(props: {
  eng: Engagement;
  onRollover: (next: Engagement) => void;
  onExport?: () => void;
  onSnapshot?: () => void;
}): JSX.Element {
  const isB = props.eng.formType === "B";
  const isP = props.eng.formType === "P";
  const done = props.eng.checks.filter(Boolean).length;
  const total = props.eng.checks.length;

  if (isP) {
    const { results } = computeEngagementP(props.eng);
    const divisional = results.reduce((a, r) => a + r.statutorySen, 0);
    const partners = results.reduce((a, r) => a + r.allocations.length, 0);
    return (
      <RailShell
        heroLabel="Divisional income"
        heroValue={formatRM(divisional)}
        heroHint={`${results.length} firms · ${partners} partners`}
        rows={[
          { label: "Partners", value: `${partners}` },
          { label: "Checklist", value: `${done}/${total}` },
        ]}
        done={done}
        total={total}
        rolloverLabel={`Rollover YA${props.eng.ya + 1}`}
        onRollover={() => props.onRollover(rolloverEngagementP(props.eng, results))}
        onExport={props.onExport}
        onSnapshot={props.onSnapshot}
      />
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
  return (
    <RailShell
      heroLabel="Balance of tax"
      heroValue={formatRM(heads.payableSen)}
      heroHint={`Gross ${formatRM(heads.taxSen)} · CI ${formatRM(heads.ciSen)}`}
      rows={[
        { label: "Chargeable", value: formatRM(heads.ciSen) },
        { label: "Gross tax", value: formatRM(heads.taxSen) },
      ]}
      done={done}
      total={total}
      rolloverLabel={`Rollover YA${props.eng.ya + 1}`}
      onRollover={rollover}
      onExport={props.onExport}
      onSnapshot={props.onSnapshot}
    />
  );
}
