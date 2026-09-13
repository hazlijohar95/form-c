import { formatRM } from "@formc/engine";
import { checklistFor } from "./types.js";
import { computeEngagement, computeEngagementB, computeEngagementP, headsOf } from "./computation.js";
import { rolloverEngagement, rolloverEngagementB, rolloverEngagementP } from "./rollover.js";
import { demoSeed, demoSeedB, demoSeedP } from "./seed.js";
import { TABS, type Tab } from "../shell/tabs.js";
import type { PaletteAction } from "../components/ui/Palette.js";
import type { ThemeMode } from "./theme.js";
import type { Engagement } from "./types.js";

export function buildCommands(o: {
  eng: Engagement | null;
  list: Engagement[];
  activeId: string | null;
  theme: ThemeMode;
  serverError: string | null;
  select: (id: string) => void;
  selectTab: (t: Tab) => void;
  create: () => void;
  duplicate: () => void;
  remove: () => void;
  rollover: (next: Engagement) => void;
  migrate: () => void;
  retryServer: () => void;
  doSnapshot: () => void;
  doCopyExport: () => void;
  setTheme: (m: ThemeMode) => void;
  toast: (t: { title: string; detail?: string; err?: boolean }) => void;
  saveServer: (e: Engagement) => Promise<void>;
  setList: React.Dispatch<React.SetStateAction<Engagement[]>>;
  setActiveId: (id: string | null) => void;
  setTab: (t: Tab) => void;
  go: (id: string | null, t: Tab) => void;
}): PaletteAction[] {
  const { eng, list, activeId, theme, serverError } = o;
  const tabActions: PaletteAction[] = TABS.map((t, i) => ({
    id: `tab-${t.id}`,
    group: "Go to step",
    title: `${t.step} · ${t.label}`,
    hint: `g ${i + 1}`,
    run: () => {
      if (eng) o.selectTab(t.id);
    },
  }));
  const switchActions: PaletteAction[] = list.map((e) => ({
    id: `switch-${e.id}`,
    group: "Switch engagement",
    title: `${e.companyName || "(unnamed company)"} · YA${e.ya}`,
    hint: e.id === activeId ? "current" : "",
    run: () => o.select(e.id),
  }));
  const out: PaletteAction[] = [
    {
      id: "snapshot",
      group: "Filing",
      title: "Snapshot",
      hint: eng ? `CI ${formatRM(headsOf(eng).ciSen)}` : "",
      run: o.doSnapshot,
    },
    { id: "copy-export", group: "Filing", title: "Copy MyTax JSON", hint: "gated by checklist", run: o.doCopyExport },
    ...tabActions,
    { id: "new", group: "Engagement", title: "New engagement", hint: "", run: o.create },
    {
      id: "demo", group: "Engagement", title: "Load demo proof", hint: "", run: () => {
        const e = demoSeed();
        o.setList((prev) => [e, ...prev]);
        o.setActiveId(e.id); o.setTab("report"); o.go(e.id, "report");
        o.saveServer(e).catch(() => undefined);
        o.toast({ title: "Demo loaded", detail: "Showing the Report tab." });
      },
    },
    {
      id: "demo-b", group: "Engagement", title: "Load Form B demo", hint: "sole prop", run: () => {
        const e = demoSeedB();
        o.setList((prev) => [e, ...prev]);
        o.setActiveId(e.id); o.setTab("report"); o.go(e.id, "report");
        o.saveServer(e).catch(() => undefined);
        o.toast({ title: "Form B demo loaded", detail: "Showing the Report tab." });
      },
    },
    {
      id: "demo-p", group: "Engagement", title: "Load Form P demo", hint: "partnership", run: () => {
        const e = demoSeedP();
        o.setList((prev) => [e, ...prev]);
        o.setActiveId(e.id); o.setTab("report"); o.go(e.id, "report");
        o.saveServer(e).catch(() => undefined);
        o.toast({ title: "Form P demo loaded", detail: "Showing the Report tab." });
      },
    },
    ...switchActions,
  ];
  if (eng) {
    out.push(
      { id: "duplicate", group: "Engagement", title: `Duplicate “${eng.companyName || "engagement"}”`, hint: "", run: o.duplicate },
      {
        id: "rollover",
        group: "Engagement",
        title: `Rollover to YA${eng.ya + 1}`,
        hint: "carries B/F",
        run: () => o.rollover(
          eng.formType === "B"
            ? rolloverEngagementB(eng, computeEngagementB(eng).result)
            : eng.formType === "P"
              ? rolloverEngagementP(eng, computeEngagementP(eng).results)
              : rolloverEngagement(eng, computeEngagement(eng).result)
        ),
      },
      { id: "delete", group: "Engagement", title: `Delete “${eng.companyName || "engagement"}”`, hint: "confirms", run: o.remove }
    );
  }
  out.push(
    { id: "print", group: "Filing", title: "Print computation", hint: "", run: () => window.print() },
    { id: "push", group: "Filing", title: "Push local → D1", hint: "", run: () => void o.migrate() },
  );
  if (serverError) {
    out.push({ id: "retry", group: "Filing", title: "Retry server connection", hint: "", run: () => o.retryServer() });
  }
  (["dark", "light", "system"] as ThemeMode[]).forEach((m) => {
    out.push({
      id: `theme-${m}`,
      group: "Appearance",
      title: `${m[0].toUpperCase()}${m.slice(1)} theme`,
      hint: theme === m ? "current" : "",
      run: () => {
        o.setTheme(m);
        o.toast({ title: `${m[0].toUpperCase()}${m.slice(1)} theme`, detail: m === "system" ? "Follows your OS." : undefined });
      },
    });
  });
  return out;
}

export function suggestedIdsFor(eng: Engagement | null): string[] {
  if (!eng) return ["new"];
  const done = eng.checks.filter(Boolean).length;
  if (eng.ingestText.trim() === "" && eng.addBacks.length === 0 && eng.businesses.length === 0) return ["tab-onboard"];
  if (done < checklistFor(eng.formType).length) return ["tab-report"];
  return ["snapshot"];
}
