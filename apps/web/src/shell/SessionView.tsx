import { Suspense, lazy, useEffect, useRef } from "react";
import type { Client, Engagement } from "../lib/types.js";
import { TABS, nextTab, prevTab, tabIndex, type Tab } from "./tabs.js";
import { FilingTabs } from "./FilingTabs.js";
import { LiveRail } from "./LiveRail.js";
import { SessionHeader, SessionMenu } from "./SessionHeader.js";
import { Skeleton } from "../components/ui/primitives.js";
import type { ThemeMode } from "../lib/theme.js";

const ComputationForm = lazy(() =>
  import("../components/ComputationForm.js").then((m) => ({ default: m.ComputationForm }))
);
const Onboard = lazy(() => import("../components/Onboard.js").then((m) => ({ default: m.Onboard })));
const EKeying = lazy(() => import("../components/EKeying.js").then((m) => ({ default: m.EKeying })));
const Ingest = lazy(() => import("../components/Ingest.js").then((m) => ({ default: m.Ingest })));
const Registers = lazy(() =>
  import("../components/Registers.js").then((m) => ({ default: m.Registers }))
);
const Review = lazy(() => import("../components/Review.js").then((m) => ({ default: m.Review })));
const Report = lazy(() => import("../components/Report.js").then((m) => ({ default: m.Report })));

type Patch = (p: Partial<Engagement>) => void;

export function SessionView(props: {
  eng: Engagement;
  tab: Tab;
  onTab: (t: Tab) => void;
  patch: Patch;
  useServer: boolean;
  serverError: string | null;
  onPalette: () => void;
  theme: ThemeMode;
  resolvedTheme: "dark" | "light";
  onToggleTheme: () => void;
  onRollover: (next: Engagement) => void;
  onSnapshot: () => void;
  onExport: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  clients: Client[];
  onClients: (next: Client[]) => void;
  notify: (t: { title: string; detail?: string; err?: boolean }) => void;
}): JSX.Element {
  const { eng, tab, onTab, onExport } = props;
  const activeIdx = tabIndex(tab);
  const meta = TABS[activeIdx] ?? TABS[0];
  const isFirst = activeIdx === 0;
  const isLast = activeIdx === TABS.length - 1;
  const scrollRef = useRef<HTMLDivElement>(null);

  // One viewport: chrome stays fixed, only the stage scrolls.
  // Reset the stage scroll on step change and keep focus in the panel.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab, eng.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !e.shiftKey) {
        if (typing && t?.tagName === "TEXTAREA") return;
        e.preventDefault();
        if (isLast) onExport();
        else onTab(nextTab(tab));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tab, isLast, onTab, onExport]);

  function goNext(): void {
    if (isLast) onExport();
    else onTab(nextTab(tab));
  }

  return (
    <div className="workspace">
      <SessionHeader
        title={eng.companyName || "(unnamed company)"}
        subtitle={`YA${eng.ya} · ${eng.formType === "C" ? "Form C" : eng.formType === "B" ? "Form B" : "Form P"}`}
        useServer={props.useServer}
        serverError={props.serverError}
        onPalette={props.onPalette}
        theme={props.theme}
        resolvedTheme={props.resolvedTheme}
        onToggleTheme={props.onToggleTheme}
        menu={
          <SessionMenu
            onSnapshot={props.onSnapshot}
            onExport={props.onExport}
            onDuplicate={props.onDuplicate}
            onRemove={props.onRemove}
            onPrint={() => window.print()}
          />
        }
      />
      <div className="session session--workspace">
        <FilingTabs tab={props.tab} eng={eng} onSelect={props.onTab} />
        <main id="panel" aria-label="Computation panel" className="stage">
          <div className="stage-head no-print">
            <div className="stage-head-text">
              {/* No total here: the step nav's "n / 7" counter, progress bar and
                * footer dots already carry position, and "of 6" contradicted them. */}
              <p className="stage-kicker">Step {meta.step} · {meta.label}</p>
              <h2 className="stage-title">{meta.blurb}</h2>
              <p className="hint stage-hint">{meta.hint}</p>
            </div>
            <div className="stage-head-nav" role="group" aria-label="Step navigation">
              <button type="button" className="btn btn-xs ghost" disabled={isFirst} onClick={() => props.onTab(prevTab(props.tab))} aria-label="Previous step">
                ← Back
              </button>
              <button type="button" className="btn btn-xs primary" onClick={goNext}>
                {isLast ? "Copy MyTax JSON" : "Continue →"}
              </button>
            </div>
          </div>
          <div ref={scrollRef} className="stage-scroll" tabIndex={-1}>
            <Suspense fallback={<Skeleton />}>
              <section
                key={`${eng.id}-${props.tab}`}
                role="tabpanel"
                id="filing-panel"
                aria-labelledby={`tabbtn-${props.tab}`}
                aria-label="Filing step"
                className="stage-anim"
              >
                {props.tab === "onboard" && <Onboard eng={eng} patch={props.patch} clients={props.clients} onClients={props.onClients} notify={props.notify} />}
                {props.tab === "ingest" && <Ingest eng={eng} patch={props.patch} />}
                {props.tab === "entry" && <ComputationForm eng={eng} patch={props.patch} />}
                {props.tab === "registers" && <Registers eng={eng} patch={props.patch} />}
                {props.tab === "review" && <Review eng={eng} patch={props.patch} />}
                {props.tab === "ekey" && <EKeying eng={eng} patch={props.patch} />}
                {props.tab === "report" && (
                  <Report
                    eng={eng}
                    notify={props.notify}
                    onChecklist={(i, v) =>
                      props.patch({ checks: eng.checks.map((c, j) => (j === i ? v : c)) })
                    }
                    onSnapshot={() => props.onSnapshot()}
                  />
                )}
              </section>
            </Suspense>
          </div>
          <div className="stage-foot no-print">
            <span className="hint">
              {isLast ? "Export unlocks when the checklist is complete." : "Your work saves automatically."} <kbd className="chip">⌃↵</kbd> to {isLast ? "export" : "continue"}
            </span>
            <div className="stage-dots" aria-hidden="true">
              {TABS.map((t) => (
                <span key={t.id} className="stage-dot" data-active={t.id === props.tab ? "true" : undefined} />
              ))}
            </div>
          </div>
        </main>
        <LiveRail eng={eng} onRollover={props.onRollover} onExport={props.onExport} onSnapshot={props.onSnapshot} />
      </div>
    </div>
  );
}
