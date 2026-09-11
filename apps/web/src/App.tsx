import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useComputation } from "./lib/computation.js";
import { formatRM } from "@formc/engine";
import { blankEngagement } from "./lib/types.js";
import { eraseAll, loadAll, saveAll } from "./lib/store.js";
import {
  migrateLocalToServer,
  useDeleteEngagement,
  useEngagements,
  useSaveEngagement,
} from "./lib/engagements.js";
import { uid } from "./lib/lists.js";
import { rolloverEngagement } from "./lib/rollover.js";
import { demoSeed } from "./lib/seed.js";
import type { Engagement } from "./lib/types.js";
import "./theme.css";

const ComputationForm = lazy(() =>
  import("./components/ComputationForm.js").then((m) => ({ default: m.ComputationForm }))
);
const EKeying = lazy(() => import("./components/EKeying.js").then((m) => ({ default: m.EKeying })));
const Ingest = lazy(() => import("./components/Ingest.js").then((m) => ({ default: m.Ingest })));
const Registers = lazy(() =>
  import("./components/Registers.js").then((m) => ({ default: m.Registers }))
);
const Review = lazy(() => import("./components/Review.js").then((m) => ({ default: m.Review })));
const Report = lazy(() => import("./components/Report.js").then((m) => ({ default: m.Report })));

type Tab = "ingest" | "entry" | "registers" | "review" | "ekey" | "report";

const TABS: Tab[] = ["ingest", "entry", "registers", "review", "ekey", "report"];
function isTab(v: unknown): v is Tab {
  return typeof v === "string" && (TABS as string[]).includes(v);
}

export default function App(): JSX.Element {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { engagementId?: string; tab?: string };
  const [initial] = useState<Engagement[]>(() => loadAll());
  const [list, setList] = useState<Engagement[]>(initial);
  const { list: serverList, useServer, error: serverError, retry: retryServer } = useEngagements(initial);
  const saveServer = useSaveEngagement();
  const deleteServer = useDeleteEngagement();
  const [migrated, setMigrated] = useState<string | null>(null);
  const syncedOnce = useRef(false);

  // Merge, never replace: server records win per id, local-only records
  // survive (they may predate D1 or have failed to push). On first contact,
  // push local-only records up so both sides converge.
  useEffect(() => {
    if (!useServer || syncedOnce.current) return;
    syncedOnce.current = true;
    const serverIds = new Set(serverList.map((e) => e.id));
    const localOnly = list.filter((e) => !serverIds.has(e.id));
    if (localOnly.length > 0) {
      setList((prev) => {
        const ids = new Set(serverList.map((e) => e.id));
        const keep = prev.filter((e) => !ids.has(e.id));
        return [...serverList, ...keep];
      });
      migrateLocalToServer(localOnly)
        .then((n) => setMigrated(`Synced ${n} local engagement(s) to D1`))
        .catch(() => setMigrated("Sync failed — use “Push local → D1” to retry"));
    } else {
      setList((prev) => {
        if (serverList.length === prev.length && serverList.every((s, i) => s.id === prev[i]?.id)) return prev;
        const byId = new Map(prev.map((e) => [e.id, e]));
        for (const s of serverList) byId.set(s.id, s);
        return [...byId.values()];
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useServer]);
  const [activeId, setActiveId] = useState<string | null>(
    () => params.engagementId ?? initial[0]?.id ?? null
  );
  const [tab, setTab] = useState<Tab>(() => (isTab(params.tab) ? params.tab : "entry"));

  useEffect(() => saveAll(list), [list]);

  // URL → state (back/forward, deep links, shared URLs).
  useEffect(() => {
    if (params.engagementId && params.engagementId !== activeId) setActiveId(params.engagementId);
    if (isTab(params.tab) && params.tab !== tab) setTab(params.tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.engagementId, params.tab]);

  function go(id: string | null, t: Tab): void {
    if (id) navigate({ to: "/engagement/$engagementId/$tab", params: { engagementId: id, tab: t } }).catch(() => undefined);
    else navigate({ to: "/" }).catch(() => undefined);
  }

  const eng = useMemo(
    () => list.find((e) => e.id === activeId) ?? null,
    [list, activeId]
  );

  function patch(p: Partial<Engagement>): void {
    if (!activeId) return;
    let next: Engagement | null = null;
    setList((prev) =>
      prev.map((e) => {
        if (e.id !== activeId) return e;
        next = { ...e, ...p, updatedAt: new Date().toISOString() };
        return next;
      })
    );
    queueMicrotask(() => {
      if (next) saveServer(next).catch(() => undefined);
    });
  }

  function create(): void {
    const e = blankEngagement();
    setList((prev) => [e, ...prev]);
    setActiveId(e.id);
    setTab("ingest");
    go(e.id, "ingest");
    saveServer(e).catch(() => undefined);
  }

  function rollover(next: Engagement): void {
    setList((prev) => [next, ...prev]);
    setActiveId(next.id);
    setTab("entry");
    go(next.id, "entry");
    saveServer(next).catch(() => undefined);
  }
  function duplicate(): void {
    if (!eng) return;
    const copy: Engagement = {
      ...JSON.parse(JSON.stringify(eng)) as Engagement,
      id: uid(),
      companyName: `${eng.companyName} (copy)`,
      runs: [],
    };
    setList((prev) => [copy, ...prev]);
    setActiveId(copy.id);
    go(copy.id, tab);
    saveServer(copy).catch(() => undefined);
  }

  function remove(): void {
    if (!activeId) return;
    const id = activeId;
    setList((prev) => prev.filter((e) => e.id !== id));
    setActiveId(null);
    go(null, tab);
    deleteServer(id).catch(() => undefined);
  }

  async function migrate(): Promise<void> {
    try {
      const n = await migrateLocalToServer(list);
      setMigrated(`Pushed ${n} engagement(s) to D1`);
    } catch {
      setMigrated("Push failed — is `wrangler dev` running on :8787?");
    }
  }

  function select(id: string): void {
    setActiveId(id);
    go(id, tab);
  }

  function selectTab(t: Tab): void {
    setTab(t);
    go(activeId, t);
  }

  return (
    <div className="app">
      <div className="topbar no-print">
        <div className="brand">
          Form C Studio <small>Sdn Bhd · ITA 1967</small>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="hint" title={serverError ?? "D1 reachable"}>
            {useServer ? "● server (D1)" : `○ local${serverError ? ` — ${serverError}` : ""}`}
          </span>
          {!useServer && serverError && (
            <button className="btn ghost" onClick={() => retryServer()}>
              Retry
            </button>
          )}
          <button className="btn" onClick={create}>
            + Engagement
          </button>
          <button className="btn ghost" onClick={() => { const e = demoSeed(); setList((prev) => [e, ...prev]); setActiveId(e.id); setTab("report"); go(e.id, "report"); saveServer(e).catch(() => undefined); }}>
            Load demo proof
          </button>
          <button className="btn ghost" onClick={() => void migrate()}>
            Push local → D1
          </button>
          {migrated && <span className="hint">{migrated}</span>}
          {eng && (
            <>
              <button className="btn ghost" onClick={duplicate}>
                Duplicate
              </button>
              <button className="btn ghost" onClick={remove}>
                Delete
              </button>
              <button className="btn ghost" onClick={() => { if (window.confirm("Erase ALL engagements from this browser?")) { eraseAll(); setList([]); setActiveId(null); } }}>
                Erase all
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid">
        <div className="no-print">
          <div className="card">
            <h3>Engagements</h3>
            {list.length === 0 && (
              <p className="hint">No engagements yet. Create one to start.</p>
            )}
            <ul className="steps">
              {list.map((e) => (
                <li
                  key={e.id}
                  className={e.id === activeId ? "active" : ""}
                  onClick={() => select(e.id)}
                >
                  <span className="n">C</span>
                  <span>
                    <div>{e.companyName}</div>
                    <div className="hint">YA{e.ya} · {e.fyeTo}</div>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {eng && <MiniSummary eng={eng} onRollover={rollover} />}
        </div>

        <div>
          {!eng && (
            <div className="card">
              <p className="hint">Select or create an engagement.</p>
            </div>
          )}
          {eng && (
            <>
              <div className="tabs no-print">
                {(
                  [
                    ["ingest", "1 · Ingest"],
                    ["entry", "2 · Entry"],
                    ["registers", "3 · Registers"],
                    ["review", "4 · Review"],
                    ["ekey", "5 · e-C keying"],
                    ["report", "6 · Report"],
                  ] as [Tab, string][]
                ).map(([t, label]) => (
                  <button
                    key={t}
                    className={tab === t ? "btn primary" : "btn"}
                    onClick={() => selectTab(t)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Suspense fallback={<div className="card"><p className="hint">Loading…</p></div>}>
              {tab === "ingest" && <Ingest eng={eng} patch={patch} />}
              {tab === "entry" && <ComputationForm eng={eng} patch={patch} />}
              {tab === "registers" && <Registers eng={eng} patch={patch} />}
              {tab === "review" && <Review eng={eng} patch={patch} />}
              {tab === "ekey" && <EKeying eng={eng} patch={patch} />}
              {tab === "report" && (
                <Report
                  eng={eng}
                  onChecklist={(i, v) =>
                    patch({ checks: eng.checks.map((c, j) => (j === i ? v : c)) })
                  }
                  onSnapshot={(r) => patch({ runs: [...eng.runs, r].slice(-20) })}
                />
              )}
              </Suspense>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniSummary(props: { eng: Engagement; onRollover: (next: Engagement) => void }): JSX.Element {
  const { result } = useComputation(props.eng);
  function rollover(): void {
    props.onRollover(rolloverEngagement(props.eng, result));
  }
  return (
    <div className="card">
      <h3>Live position</h3>
      <div className="kv">
        <span>Chargeable</span>
        <span className="num">{formatRM(result.chargeableSen)}</span>
      </div>
      <div className="kv">
        <span>Tax payable</span>
        <span className="num">{formatRM(result.taxPayableSen)}</span>
      </div>
      <div className="kv">
        <span>Checks</span>
        <span className="num">
          {props.eng.checks.filter(Boolean).length}/{props.eng.checks.length}
        </span>
      </div>
      <div className="toolbar">
        <button className="btn" onClick={rollover}>
          Rollover YA{props.eng.ya + 1}
        </button>
      </div>
    </div>
  );
}
