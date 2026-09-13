import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { blankEngagement, checklistFor } from "./lib/types.js";
import { headsOf } from "./lib/computation.js";
import { buildMytaxExport } from "./lib/myexport.js";
import { copyText } from "./lib/clipboard.js";
import type { Engagement, RunRecord } from "./lib/types.js";
import { eraseAll, loadAll, saveAll } from "./lib/store.js";
import { loadClients, saveClients } from "./lib/clients.js";
import type { Client } from "./lib/types.js";
import {
  migrateLocalToServer,
  useDeleteEngagement,
  useEngagements,
  useSaveEngagement,
} from "./lib/engagements.js";
import { uid, plural } from "./lib/lists.js";
import { rolloverEngagement } from "./lib/rollover.js";
import { demoSeed } from "./lib/seed.js";
import { buildCommands, suggestedIdsFor } from "./lib/commands.js";
import { useTheme } from "./hooks/useTheme.js";
import { TABS, isTab, type Tab } from "./shell/tabs.js";
import { EngagementTabs } from "./shell/EngagementTabs.js";
import { HomePage } from "./shell/HomePage.js";
import { SettingsPage, type SettingsSection } from "./shell/SettingsPage.js";
import { SessionView } from "./shell/SessionView.js";
import { Palette, Toasts, pushToast } from "./components/ui.js";
import type { Toast } from "./components/ui.js";
import "./theme.css";

export default function App(): JSX.Element {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { engagementId?: string; tab?: string; section?: string };
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const settingsMode = pathname.startsWith("/settings");
  const settingsSection: SettingsSection =
    params.section === "appearance" || params.section === "filing" || params.section === "data" || params.section === "about"
      ? params.section
      : "preferences";

  const [initial] = useState<Engagement[]>(() => loadAll());
  const [list, setList] = useState<Engagement[]>(initial);
  const [clients, setClients] = useState<Client[]>(() => loadClients());
  const { list: serverList, useServer, error: serverError, retry: retryServer } = useEngagements(initial);
  const saveServer = useSaveEngagement();
  const deleteServer = useDeleteEngagement();
  const [notice, setNotice] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [palette, setPalette] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const syncedOnce = useRef(false);
  const pendingG = useRef<number>(0);
  const toast = useCallback((t: Omit<Toast, "id">) => pushToast(setToasts, t), []);

  useEffect(() => {
    if (!useServer || syncedOnce.current) return;
    syncedOnce.current = true;
    const serverIds = new Set(serverList.map((e) => e.id));
    const localOnly = list.filter((e) => !serverIds.has(e.id));
    if (localOnly.length > 0) {
      setList((prev) => {
        const ids = new Set(serverList.map((e) => e.id));
        return [...serverList, ...prev.filter((e) => !ids.has(e.id))];
      });
      migrateLocalToServer(localOnly)
        .then((n) => setNotice(`Synced ${n} local ${plural(n, "engagement")} to D1`))
        .catch(() => setNotice("Sync failed — retry from Settings → Data"));
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
  const [defaultYa, setDefaultYa] = useState<number>(2025);

  useEffect(() => saveAll(list), [list]);
  useEffect(() => saveClients(clients), [clients]);

  useEffect(() => {
    if (params.engagementId && params.engagementId !== activeId) setActiveId(params.engagementId);
    if (isTab(params.tab) && params.tab !== tab) setTab(params.tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.engagementId, params.tab]);

  function go(id: string | null, t: Tab): void {
    if (id) navigate({ to: "/engagement/$engagementId/$tab", params: { engagementId: id, tab: t } }).catch(() => undefined);
    else navigate({ to: "/" }).catch(() => undefined);
  }
  function goHome(): void {
    navigate({ to: "/" }).catch(() => undefined);
  }
  function goSettings(s: SettingsSection = "preferences"): void {
    if (s === "preferences") navigate({ to: "/settings" }).catch(() => undefined);
    else navigate({ to: "/settings/$section", params: { section: s } }).catch(() => undefined);
  }
  function closeTab(id: string): void {
    if (id !== activeId) return;
    const idx = list.findIndex((e) => e.id === id);
    const next = list[idx + 1] ?? list[idx - 1] ?? null;
    setActiveId(next ? next.id : null);
    if (next) go(next.id, tab);
    else goHome();
  }

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
        const idx = ["0", "1", "2", "3", "4", "5", "6"].indexOf(e.key);
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

  const eng = useMemo(() => list.find((e) => e.id === activeId) ?? null, [list, activeId]);

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
      if (next) saveServer(next).catch(() => toast({ title: "Save failed", detail: "Kept locally.", err: true }));
    });
  }

  function create(): void {
    const e = blankEngagement();
    e.ya = defaultYa;
    setList((prev) => [e, ...prev]);
    setActiveId(e.id);
    setTab("onboard");
    go(e.id, "onboard");
    saveServer(e).catch(() => toast({ title: "Saved locally", detail: "Will sync when D1 is reachable.", err: true }));
    toast({ title: "Engagement created", detail: "Start at Onboard." });
  }

  function rollover(next: Engagement): void {
    setList((prev) => [next, ...prev]);
    setActiveId(next.id);
    setTab("entry");
    go(next.id, "entry");
    saveServer(next).catch(() => toast({ title: "Saved locally", err: true }));
    toast({ title: `Rolled over to YA${next.ya}` });
  }

  function duplicate(): void {
    if (!eng) return;
    const copy: Engagement = { ...JSON.parse(JSON.stringify(eng)) as Engagement, id: uid(), companyName: `${eng.companyName} (copy)`, runs: [] };
    setList((prev) => [copy, ...prev]);
    setActiveId(copy.id);
    go(copy.id, tab);
    saveServer(copy).catch(() => toast({ title: "Saved locally", err: true }));
  }

  function remove(): void {
    if (!activeId || !eng) return;
    if (!window.confirm(`Delete “${eng.companyName}” (YA${eng.ya})? This cannot be undone.`)) return;
    const id = activeId;
    setList((prev) => prev.filter((e) => e.id !== id));
    setActiveId(null);
    goHome();
    deleteServer(id).catch(() =>
      toast({
        title: "Delete failed on server",
        detail: "Removed here only. Push again from Settings → Data to retry.",
        err: true,
      })
    );
  }

  async function migrate(): Promise<void> {
    try {
      const n = await migrateLocalToServer(list);
      setNotice(`Pushed ${n} ${plural(n, "engagement")} to D1`);
    } catch {
      setNotice("Push failed — is the API reachable?");
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
    const heads = headsOf(current);
    const r: RunRecord = {
      at: new Date().toISOString(),
      ciSen: heads.ciSen,
      taxSen: heads.taxSen,
      payableSen: heads.payableSen,
    };
    const updated: Engagement = { ...current, runs: [...current.runs, r].slice(-20), updatedAt: new Date().toISOString() };
    setList((prev) => prev.map((e) => (e.id === activeId ? updated : e)));
    saveServer(updated).catch(() => toast({ title: "Snapshot kept locally", err: true }));
    toast({ title: "Snapshot saved" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, list, toast]);

  const doCopyExport = useCallback((): void => {
    if (!activeId) return;
    const current = list.find((e) => e.id === activeId);
    if (!current) return;
    const done = current.checks.filter(Boolean).length;
    const want = checklistFor(current.formType).length;
    if (done < want) {
      toast({ title: "Checklist incomplete", detail: `${want - done} left.`, err: true });
      setTab("report");
      go(activeId, "report");
      return;
    }
    void copyText(buildMytaxExport(current)).then((ok) =>
      ok ? toast({ title: "MyTax JSON copied" }) : toast({ title: "Copy failed", err: true })
    );
  }, [activeId, list, toast]);

  const suggestedIds = useMemo(() => suggestedIdsFor(eng), [eng]);
  const actions = useMemo(() => buildCommands({
    eng, list, activeId, theme, serverError,
    select, selectTab, create, duplicate, remove, rollover, migrate,
    retryServer, doSnapshot, doCopyExport, setTheme, toast,
    saveServer, setList, setActiveId, setTab, go,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [eng?.id, eng?.checks, eng?.ingestText, list.length, activeId, theme, serverError]);

  function onDemo(): void {
    const e = demoSeed();
    setList((prev) => [e, ...prev]);
    setActiveId(e.id); setTab("report"); go(e.id, "report");
    saveServer(e).catch(() => undefined);
  }

  return (
    <div className="app">
      {!settingsMode && pathname !== "/" && eng && (
        <a className="skip" href="#panel">Skip to computation panel</a>
      )}
      <EngagementTabs
        list={list}
        activeId={activeId}
        settingsActive={settingsMode}
        onHome={goHome}
        onSelect={select}
        onClose={closeTab}
        onCreate={create}
        onSettings={() => goSettings("preferences")}
      />

      {settingsMode ? (
        <div className="panel">
        <SettingsPage
          section={settingsSection}
          onSection={(s) => goSettings(s)}
          onBack={() => { if (activeId) go(activeId, tab); else goHome(); }}
          theme={theme}
          onTheme={setTheme}
          defaultYa={defaultYa}
          onDefaultYa={setDefaultYa}
          useServer={useServer}
          serverError={serverError}
          onRetry={() => retryServer()}
          onPush={() => void migrate()}
          onDemo={onDemo}
          onEraseAll={() => { if (window.confirm("Erase all engagements?")) { eraseAll(); setList([]); setActiveId(null); goHome(); } }}
          notice={notice}
        />
        </div>
      ) : pathname === "/" || !eng ? (
        <div className="panel">
        <HomePage
          list={list}
          selectedId={activeId}
          onSelect={select}
          onCreate={create}
          onDemo={onDemo}
          onSettings={() => goSettings("preferences")}
          onHelp={() => setPalette(true)}
        />
        </div>
      ) : (
        <div className="panel">
        <SessionView
          eng={eng}
          tab={tab}
          onTab={selectTab}
          patch={patch}
          useServer={useServer}
          serverError={serverError}
          onPalette={() => setPalette(true)}
          theme={theme}
          resolvedTheme={resolvedTheme}
          onToggleTheme={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          onRollover={rollover}
          onSnapshot={() => doSnapshot()}
          onExport={() => doCopyExport()}
          onDuplicate={duplicate}
          onRemove={remove}
          clients={clients}
          onClients={setClients}
          notify={toast}
        />
        </div>
      )}
      <Toasts items={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((x) => x.id !== id))} />
      <Palette open={palette} close={() => setPalette(false)} actions={actions} suggestedIds={suggestedIds} />
    </div>
  );
}
