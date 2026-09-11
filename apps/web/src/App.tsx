import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useComputation } from "./lib/computation.js";
import { formatRM } from "@formc/engine";
import { blankEngagement, CHECKLIST } from "./lib/types.js";
import { computeEngagement } from "./lib/computation.js";
import { buildMytaxExport } from "./lib/myexport.js";
import { applyTheme, getStoredTheme, resolveTheme, storeTheme } from "./lib/theme.js";
import type { ThemeMode } from "./lib/theme.js";
import type { Engagement, RunRecord } from "./lib/types.js";
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
import { Palette, Toasts, pushToast } from "./components/ui.js";
import type { PaletteAction, Toast } from "./components/ui.js";
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

const TABS: { id: Tab; label: string; step: string }[] = [
  { id: "ingest", label: "Ingest", step: "1" },
  { id: "entry", label: "Entry", step: "2" },
  { id: "registers", label: "Registers", step: "3" },
  { id: "review", label: "Review", step: "4" },
  { id: "ekey", label: "e-C keying", step: "5" },
  { id: "report", label: "Report", step: "6" },
];
function isTab(v: unknown): v is Tab {
  return typeof v === "string" && TABS.some((t) => t.id === v);
}

export default function App(): JSX.Element {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { engagementId?: string; tab?: string };
  const [initial] = useState<Engagement[]>(() => loadAll());
  const [list, setList] = useState<Engagement[]>(initial);
  const { list: serverList, useServer, error: serverError, retry: retryServer } = useEngagements(initial);
  const saveServer = useSaveEngagement();
  const deleteServer = useDeleteEngagement();
  const [notice, setNotice] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [palette, setPalette] = useState(false);
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(() => resolveTheme(getStoredTheme()));
  const syncedOnce = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const pendingG = useRef<number>(0);
  const toast = useCallback((t: Omit<Toast, "id">) => pushToast(setToasts, t), []);

  function setTheme(mode: ThemeMode): void {
    setThemeState(mode);
    storeTheme(mode);
    setResolvedTheme(applyTheme(mode));
  }

  // Apply on mount + follow the OS while on "system".
  useEffect(() => {
    setResolvedTheme(applyTheme(theme));
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (): void => setResolvedTheme(applyTheme("system"));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

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
        .then((n) => setNotice(`Synced ${n} local engagement(s) to D1`))
        .catch(() => setNotice("Sync failed — use “Push local → D1” to retry"));
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

  // Cmd/Ctrl+K palette + leader-style `g 1–6` step jumps (OpenCode
  // leader parity; guarded to non-editable targets so typing is safe).
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || palette) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const now = Date.now();
      if (pendingG.current && now - pendingG.current < 900) {
        pendingG.current = 0;
        const idx = ["1", "2", "3", "4", "5", "6"].indexOf(e.key);
        if (idx >= 0 && TABS[idx]) {
          e.preventDefault();
          setTab(TABS[idx].id);
          go(activeId, TABS[idx].id);
        }
        return;
      }
      if (e.key === "g") pendingG.current = now;
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palette, activeId]);
  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>("h2, h3")?.setAttribute("tabindex", "-1");
    panelRef.current?.querySelector<HTMLElement>("h2, h3")?.focus({ preventScroll: true });
  }, [tab, activeId]);

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
      if (next) saveServer(next).catch(() => toast({ title: "Save failed", detail: "Kept locally — will retry on next change.", err: true }));
    });
  }

  function create(): void {
    const e = blankEngagement();
    setList((prev) => [e, ...prev]);
    setActiveId(e.id);
    setTab("ingest");
    go(e.id, "ingest");
    saveServer(e).catch(() => toast({ title: "Saved locally", detail: "D1 push failed — use “Push local → D1”.", err: true }));
    toast({ title: "Engagement created", detail: "Start at Ingest — paste the trial balance." });
  }

  function rollover(next: Engagement): void {
    setList((prev) => [next, ...prev]);
    setActiveId(next.id);
    setTab("entry");
    go(next.id, "entry");
    saveServer(next).catch(() => toast({ title: "Saved locally", detail: "D1 push failed.", err: true }));
    toast({ title: `Rolled over to YA${next.ya}`, detail: "B/F balances carried — verify RE b/f in Review." });
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
    saveServer(copy).catch(() => toast({ title: "Saved locally", detail: "D1 push failed.", err: true }));
    toast({ title: "Duplicated", detail: copy.companyName });
  }

  function remove(): void {
    if (!activeId || !eng) return;
    if (!window.confirm(`Delete “${eng.companyName}” (YA${eng.ya})? This removes it from this browser and D1.`)) return;
    const id = activeId;
    setList((prev) => prev.filter((e) => e.id !== id));
    setActiveId(null);
    go(null, tab);
    deleteServer(id).catch(() => toast({ title: "Delete failed on server", detail: "Removed locally — retry from server if it reappears.", err: true }));
  }

  async function migrate(): Promise<void> {
    try {
      const n = await migrateLocalToServer(list);
      setNotice(`Pushed ${n} engagement(s) to D1`);
      toast({ title: `Pushed ${n} engagement(s) to D1` });
    } catch {
      setNotice("Push failed — is `wrangler dev` running on :8787?");
      toast({ title: "Push failed", detail: "Is `wrangler dev` running on :8787?", err: true });
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

  const doSnapshot = useCallback((): void => {
    if (!activeId) return;
    const current = list.find((e) => e.id === activeId);
    if (!current) return;
    const { result } = computeEngagement(current);
    const r: RunRecord = {
      at: new Date().toISOString(),
      ciSen: result.chargeableSen,
      taxSen: result.grossTaxSen,
      payableSen: result.taxPayableSen,
    };
    const updated: Engagement = {
      ...current,
      runs: [...current.runs, r].slice(-20),
      updatedAt: new Date().toISOString(),
    };
    setList((prev) => prev.map((e) => (e.id === activeId ? updated : e)));
    saveServer(updated).catch(() => toast({ title: "Snapshot kept locally", detail: "D1 push failed — will retry on next change.", err: true }));
    toast({ title: "Snapshot saved", detail: "Find it under Review → Computation runs." });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, list, toast]);

  const doCopyExport = useCallback((): void => {
    if (!activeId) return;
    const current = list.find((e) => e.id === activeId);
    if (!current) return;
    const done = current.checks.filter(Boolean).length;
    if (done < CHECKLIST.length) {
      toast({
        title: "Checklist incomplete",
        detail: `${CHECKLIST.length - done} item(s) left — export unlocks at ${CHECKLIST.length}/${CHECKLIST.length}.`,
        err: true,
      });
      setTab("report");
      go(activeId, "report");
      return;
    }
    void navigator.clipboard.writeText(buildMytaxExport(current)).then(
      () => toast({ title: "MyTax JSON copied", detail: "Paste into your export record." }),
      () => toast({ title: "Copy failed", detail: "Open Report and copy manually.", err: true })
    );
  }, [activeId, list, toast]);

  // Suggested = next filing-relevant move (OpenCode empty-filter pattern).
  const suggestedIds: string[] = useMemo(() => {
    if (!eng) return ["new"];
    const done = eng.checks.filter(Boolean).length;
    if (eng.ingestText.trim() === "" && eng.addBacks.length === 0) return ["tab-ingest"];
    if (done < CHECKLIST.length) return ["tab-report"];
    return ["snapshot"];
  }, [eng]);

  const actions: PaletteAction[] = useMemo(() => {
    const tabActions: PaletteAction[] = TABS.map((t, i) => ({
      id: `tab-${t.id}`,
      group: "Go to step",
      title: `${t.step} · ${t.label}`,
      hint: `g ${i + 1}`,
      run: () => {
        if (eng) selectTab(t.id);
      },
    }));
    const switchActions: PaletteAction[] = list.map((e) => ({
      id: `switch-${e.id}`,
      group: "Switch engagement",
      title: `${e.companyName || "(unnamed company)"} · YA${e.ya}`,
      hint: e.id === activeId ? "current" : "",
      run: () => select(e.id),
    }));
    const out: PaletteAction[] = [
      {
        id: "snapshot",
        group: "Filing",
        title: "Snapshot computation run",
        hint: eng ? `CI ${formatRM(computeEngagement(eng).result.chargeableSen)}` : "",
        run: doSnapshot,
      },
      { id: "copy-export", group: "Filing", title: "Copy MyTax JSON", hint: "gated by checklist", run: doCopyExport },
      ...tabActions,
      { id: "new", group: "Engagement", title: "New engagement", hint: "", run: create },
      { id: "demo", group: "Engagement", title: "Load demo proof engagement", hint: "", run: () => {
        const e = demoSeed();
        setList((prev) => [e, ...prev]);
        setActiveId(e.id); setTab("report"); go(e.id, "report");
        saveServer(e).catch(() => undefined);
        toast({ title: "Demo loaded", detail: "Showing the Report tab." });
      } },
      ...switchActions,
    ];
    if (eng) {
      out.push(
        { id: "duplicate", group: "Engagement", title: `Duplicate “${eng.companyName || "engagement"}”`, hint: "", run: duplicate },
        {
          id: "rollover",
          group: "Engagement",
          title: `Rollover to YA${eng.ya + 1}`,
          hint: "carries B/F",
          run: () => rollover(rolloverEngagement(eng, computeEngagement(eng).result)),
        },
        { id: "delete", group: "Engagement", title: `Delete “${eng.companyName || "engagement"}”`, hint: "confirms", run: remove }
      );
    }
    out.push(
      { id: "print", group: "Filing", title: "Print computation", hint: "", run: () => window.print() },
      { id: "push", group: "Filing", title: "Push local → D1", hint: "", run: () => void migrate() },
    );
    if (serverError) {
      out.push({ id: "retry", group: "Filing", title: "Retry server connection", hint: "", run: () => retryServer() });
    }
    (["dark", "light", "system"] as ThemeMode[]).forEach((m) => {
      out.push({
        id: `theme-${m}`,
        group: "Appearance",
        title: `${m[0].toUpperCase()}${m.slice(1)} theme`,
        hint: theme === m ? "current" : "",
        run: () => {
          setTheme(m);
          toast({ title: `${m[0].toUpperCase()}${m.slice(1)} theme`, detail: m === "system" ? "Follows your OS." : undefined });
        },
      });
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eng?.id, eng?.checks, eng?.ingestText, list.length, activeId, theme, serverError]);

  return (
    <div className="app">
      <a className="skip" href="#panel">Skip to computation panel</a>
      <header className="topbar no-print">
        <div className="brand">
          Form C Studio <small>Sdn Bhd · ITA 1967</small>
        </div>
        <div className="topbar-actions">
          <span className={`status-dot${useServer ? " on" : ""}`} role="status" title={serverError ?? "D1 reachable"}>
            <span className="dot" aria-hidden="true" />{useServer ? "server (D1)" : `local${serverError ? ` — ${serverError}` : ""}`}
          </span>
          {!useServer && serverError && (
            <button type="button" className="btn btn-xs ghost" onClick={() => retryServer()}>
              Retry
            </button>
          )}
          <button type="button" className="btn btn-xs ghost" onClick={() => setPalette(true)} title="Command palette (Ctrl/⌘+K)">
            ⌘K
          </button>
          <button
            type="button"
            className="btn btn-xs ghost"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            title={`Theme: ${theme}${theme === "system" ? ` (resolving ${resolvedTheme})` : ""} — click to switch to ${resolvedTheme === "dark" ? "light" : "dark"}. All three modes in ⌘K.`}
            aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} theme (currently ${theme})`}
          >
            <span aria-hidden="true">{resolvedTheme === "dark" ? "☀" : "☾"}</span>
            {theme === "system" ? "Auto" : resolvedTheme === "dark" ? "Dark" : "Light"}
          </button>
          <button type="button" className="btn btn-xs" onClick={create}>
            + Engagement
          </button>
          <button type="button" className="btn btn-xs ghost" onClick={() => { const e = demoSeed(); setList((prev) => [e, ...prev]); setActiveId(e.id); setTab("report"); go(e.id, "report"); saveServer(e).catch(() => undefined); }}>
            Load demo proof
          </button>
          <button type="button" className="btn btn-xs ghost" onClick={() => void migrate()}>
            Push local → D1
          </button>
          {notice && <span className="hint">{notice}</span>}
          {eng && (
            <>
              <button type="button" className="btn btn-xs ghost" onClick={duplicate}>
                Duplicate
              </button>
              <button type="button" className="btn btn-xs ghost danger" onClick={remove}>
                Delete
              </button>
              <button type="button" className="btn btn-xs ghost danger" onClick={() => { if (window.confirm("Erase ALL engagements from this browser?")) { eraseAll(); setList([]); setActiveId(null); } }}>
                Erase all
              </button>
            </>
          )}
        </div>
      </header>

      <div className="grid">
        <div className="sidebar no-print">
          <section className="card" aria-labelledby="eng-h">
            <h3 id="eng-h">Engagements</h3>
            {list.length === 0 && (
              <div className="empty">
                <div className="t">No engagements yet</div>
                <div className="d">Create one to start — or load the demo proof to see a filed-shape computation.</div>
              </div>
            )}
            <ul className="steps">
              {list.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    className="row"
                    aria-selected={e.id === activeId}
                    aria-current={e.id === activeId ? "true" : undefined}
                    onClick={() => select(e.id)}
                  >
                    <span className="n" aria-hidden="true">C</span>
                    <span className="meta">
                      <div className="name">{e.companyName || "(unnamed company)"}</div>
                      <div className="sub">YA{e.ya} · {e.fyeTo || "FYE —"}</div>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          {eng && <MiniSummary eng={eng} onRollover={rollover} />}
        </div>

        <main id="panel" ref={panelRef} aria-label="Computation panel">
          {eng && <h1>{eng.companyName || "(unnamed company)"} <span className="hint">· YA{eng.ya}</span></h1>}
          {!eng && (
            <div className="card">
              <div className="empty">
                <div className="t">Select or create an engagement</div>
                <div className="d">Your list is on the left. New here? <strong>Load demo proof</strong> shows a complete Report.</div>
              </div>
            </div>
          )}
          {eng && (
            <>
              <div className="tabs no-print" role="tablist" aria-label="Filing steps"
                onKeyDown={(e) => {
                  const idx = TABS.findIndex((t) => t.id === tab);
                  if (e.key === "ArrowRight") { e.preventDefault(); const n = TABS[(idx + 1) % TABS.length]; selectTab(n.id); }
                  if (e.key === "ArrowLeft") { e.preventDefault(); const n = TABS[(idx - 1 + TABS.length) % TABS.length]; selectTab(n.id); }
                }}
              >
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    className="btn btn-xs"
                    onClick={() => selectTab(t.id)}
                  >
                    <span className="step-n" aria-hidden="true">{t.step}</span>{t.label}
                  </button>
                ))}
              </div>
              <Suspense fallback={<div className="skeleton" role="status" aria-label="Loading step"><div className="bar" style={{ width: "40%" }} /><div className="bar" /><div className="bar" style={{ width: "70%" }} /></div>}>
              {tab === "ingest" && <Ingest eng={eng} patch={patch} />}
              {tab === "entry" && <ComputationForm eng={eng} patch={patch} />}
              {tab === "registers" && <Registers eng={eng} patch={patch} />}
              {tab === "review" && <Review eng={eng} patch={patch} />}
              {tab === "ekey" && <EKeying eng={eng} patch={patch} />}
              {tab === "report" && (
                <Report
                  eng={eng}
                  notify={toast}
                  onChecklist={(i, v) =>
                    patch({ checks: eng.checks.map((c, j) => (j === i ? v : c)) })
                  }
                  onSnapshot={() => doSnapshot()}
                />
              )}
              </Suspense>
            </>
          )}
        </main>
      </div>
      <Toasts items={toasts} />
      <Palette open={palette} close={() => setPalette(false)} actions={actions} suggestedIds={suggestedIds} />
    </div>
  );
}

function MiniSummary(props: { eng: Engagement; onRollover: (next: Engagement) => void }): JSX.Element {
  const { result } = useComputation(props.eng);
  function rollover(): void {
    props.onRollover(rolloverEngagement(props.eng, result));
  }
  return (
    <section className="card" aria-labelledby="live-h">
      <h3 id="live-h">Live position</h3>
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
        <button type="button" className="btn btn-xs" onClick={rollover}>
          Rollover YA{props.eng.ya + 1}
        </button>
      </div>
    </section>
  );
}
