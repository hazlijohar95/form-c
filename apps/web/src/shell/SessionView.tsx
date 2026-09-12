import { Suspense, lazy } from "react";
import type { Engagement } from "../lib/types.js";
import type { Tab } from "./tabs.js";
import { FilingTabs } from "./FilingTabs.js";
import { LiveRail } from "./LiveRail.js";
import { SessionHeader, SessionMenu } from "./SessionHeader.js";
import { Skeleton } from "../components/ui/primitives.js";
import type { ThemeMode } from "../lib/theme.js";

const ComputationForm = lazy(() =>
  import("../components/ComputationForm.js").then((m) => ({ default: m.ComputationForm }))
);
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
  notify: (t: { title: string; detail?: string; err?: boolean }) => void;
}): JSX.Element {
  const { eng } = props;
  return (
    <div>
      <SessionHeader
        title={eng.companyName || "(unnamed company)"}
        subtitle={`YA${eng.ya}`}
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
      <div className="session">
        <main id="panel" aria-label="Computation panel">
          <FilingTabs tab={props.tab} eng={eng} onSelect={props.onTab} />
          <Suspense fallback={<Skeleton />}>
            <section role="tabpanel" id="filing-panel" aria-labelledby={`tabbtn-${props.tab}`} aria-label="Filing step">
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
        </main>
        <LiveRail eng={eng} onRollover={props.onRollover} />
      </div>
    </div>
  );
}
