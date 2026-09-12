import type { Engagement } from "../lib/types.js";
import { TABS, type Tab } from "./tabs.js";

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
    if (e.key === "ArrowRight") { e.preventDefault(); jump(TABS[(idx + 1) % TABS.length].id); }
    if (e.key === "ArrowLeft") { e.preventDefault(); jump(TABS[(idx - 1 + TABS.length) % TABS.length].id); }
    if (e.key === "Home") { e.preventDefault(); jump(TABS[0].id); }
    if (e.key === "End") { e.preventDefault(); jump(TABS[TABS.length - 1].id); }
  }

  return (
    <div className="tabs no-print" role="tablist" aria-label="Filing steps" onKeyDown={onKey}>
      {TABS.map((t) => {
        const badge = badgeFor(t.id, props.eng);
        return (
          <button
            key={t.id}
            id={`tabbtn-${t.id}`}
            type="button"
            role="tab"
            aria-selected={props.tab === t.id}
            aria-controls="filing-panel"
            tabIndex={props.tab === t.id ? 0 : -1}
            className="tab"
            onClick={() => props.onSelect(t.id)}
          >
            <span className="step-n" aria-hidden="true">{t.step}</span>{t.label}
            {badge && (
              <>
                <span className="badge" aria-hidden="true">{badge.text}</span>
                <span className="sr-only">, {badge.label}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
