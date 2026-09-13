import type { Engagement } from "../lib/types.js";
import { TABS, tabIndex, type Tab } from "./tabs.js";

/*
 * One badge slot, one meaning: how many lines this step currently holds, so the
 * numbers are comparable across tabs. Report is the exception and shows
 * checklist progress, because that is what gates export.
 *
 * The badge digit is decorative (aria-hidden) and paired with an sr-only phrase,
 * so a screen-reader user hears "Entry, 3 lines entered" rather than a bare
 * number with no unit.
 */
function badgeFor(id: Tab, eng: Engagement): { text: string; label: string } | null {
  if (id === "onboard") {
    const req = eng.documents.filter((d) => d.required);
    if (req.length === 0) return null;
    const done = req.filter((d) => d.status !== "missing").length;
    return { text: `${done}/${req.length}`, label: `${done} of ${req.length} required documents in` };
  }
  if (id === "report") {
    const done = eng.checks.filter(Boolean).length;
    return { text: `${done}/${eng.checks.length}`, label: `${done} of ${eng.checks.length} checklist items done` };
  }
  if (id === "entry") {
    const n = eng.addBacks.length + eng.credits.length + eng.doubleDeductions.length + eng.assets.length;
    return { text: `${n}`, label: `${n} ${n === 1 ? "line" : "lines"} entered` };
  }
  if (id === "registers") {
    const n = eng.directors.length + eng.shareholders.length + eng.relatedAccounts.length + eng.cp204Bills.length;
    return { text: `${n}`, label: `${n} ${n === 1 ? "entry" : "entries"} recorded` };
  }
  return null;
}

function stateFor(id: Tab, active: Tab): "done" | "active" | "todo" {
  const a = tabIndex(active);
  const i = tabIndex(id);
  if (i === a) return "active";
  return i < a ? "done" : "todo";
}

export function FilingTabs(props: {
  tab: Tab;
  eng: Engagement;
  onSelect: (t: Tab) => void;
}): JSX.Element {
  function onKey(e: React.KeyboardEvent): void {
    const idx = TABS.findIndex((t) => t.id === props.tab);
    function jump(id: Tab): void {
      props.onSelect(id);
      window.setTimeout(() => document.getElementById(`tabbtn-${id}`)?.focus(), 0);
    }
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); jump(TABS[(idx + 1) % TABS.length].id); }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); jump(TABS[(idx - 1 + TABS.length) % TABS.length].id); }
    if (e.key === "Home") { e.preventDefault(); jump(TABS[0].id); }
    if (e.key === "End") { e.preventDefault(); jump(TABS[TABS.length - 1].id); }
  }

  const activeIdx = tabIndex(props.tab);
  const pct = Math.round(((activeIdx + 1) / TABS.length) * 100);

  return (
    <nav className="stepnav no-print" aria-label="Filing progress" onKeyDown={onKey}>
      <div className="stepnav-head">
        <span className="stepnav-title">Filing flow</span>
        <span className="stepnav-pct" aria-hidden="true">{activeIdx + 1} / {TABS.length}</span>
      </div>
      <div className="stepnav-bar" role="progressbar" aria-valuenow={activeIdx + 1} aria-valuemin={1} aria-valuemax={TABS.length} aria-label="Filing progress">
        <div className="stepnav-fill" style={{ width: `${pct}%` }} />
      </div>
      <div role="tablist" aria-label="Filing steps" className="stepnav-list">
      {TABS.map((t) => {
        const badge = badgeFor(t.id, props.eng);
        const st = stateFor(t.id, props.tab);
        const selected = props.tab === t.id;
        return (
          <button
            key={t.id}
            id={`tabbtn-${t.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls="filing-panel"
            tabIndex={selected ? 0 : -1}
            className="stepnav-item"
            data-state={st}
            onClick={() => props.onSelect(t.id)}
          >
            <span className="stepnav-dot" aria-hidden="true">
              {st === "done" ? "✓" : <span className="stepnav-n">{t.step}</span>}
            </span>
            <span className="stepnav-meta">
              <span className="stepnav-label">{t.plain}<span className="stepnav-sub"> · {t.label}</span></span>
              <span className="stepnav-blurb">{t.blurb}</span>
            </span>
            {badge ? (
              <>
                <span className="badge" aria-hidden="true">{badge.text}</span>
                <span className="sr-only">, {badge.label}</span>
              </>
            ) : (
              <span className="stepnav-kbd" aria-hidden="true">g{t.step}</span>
            )}
          </button>
        );
      })}
      </div>
      <p className="stepnav-foot hint">
        <kbd className="chip">⌃↵</kbd> continue · <kbd className="chip">g 0–6</kbd> jump
      </p>
    </nav>
  );
}
