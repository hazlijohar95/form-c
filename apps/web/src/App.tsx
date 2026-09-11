import { useEffect, useMemo, useState } from "react";
import { ComputationForm } from "./components/ComputationForm.js";
import { Ingest } from "./components/Ingest.js";
import { Registers } from "./components/Registers.js";
import { Review } from "./components/Review.js";
import { Report, useComputation } from "./components/Report.js";
import { formatRM } from "@formc/engine";
import { blankEngagement, eraseAll, loadAll, saveAll, uid } from "./lib/types.js";
import { demoSeed } from "./lib/seed.js";
import type { Engagement, RunRecord } from "./lib/types.js";
import "./theme.css";

type Tab = "ingest" | "entry" | "registers" | "review" | "report";

export default function App(): JSX.Element {
  const [list, setList] = useState<Engagement[]>(() => loadAll());
  const [activeId, setActiveId] = useState<string | null>(() => loadAll()[0]?.id ?? null);
  const [tab, setTab] = useState<Tab>("entry");

  useEffect(() => saveAll(list), [list]);

  const eng = useMemo(
    () => list.find((e) => e.id === activeId) ?? null,
    [list, activeId]
  );

  function patch(p: Partial<Engagement>): void {
    if (!activeId) return;
    setList((prev) =>
      prev.map((e) =>
        e.id === activeId ? { ...e, ...p, updatedAt: new Date().toISOString() } : e
      )
    );
  }

  function create(): void {
    const e = blankEngagement();
    setList((prev) => [e, ...prev]);
    setActiveId(e.id);
    setTab("ingest");
  }

  function rollover(): void {
    if (!eng) return;
    const next: Engagement = {
      ...blankEngagement(),
      id: uid(),
      companyName: eng.companyName,
      regNo: eng.regNo,
      ya: eng.ya + 1,
      paidUpRM: eng.paidUpRM,
      grossIncRM: eng.grossIncRM,
      foreignPct: eng.foreignPct,
      directors: eng.directors.map((d) => ({ ...d, id: uid(), salaryRM: "", loanRM: "" })),
      bfLosses: [],
      unabsorbedCaBfRM: "0",
      priorYear: { ...eng.priorYear, agreed: false },
    };
    setList((prev) => [next, ...prev]);
    setActiveId(next.id);
    setTab("entry");
  }
  function duplicate(): void {
    if (!eng) return;
    const copy: Engagement = { ...eng, id: uid(), companyName: `${eng.companyName} (copy)` };
    setList((prev) => [copy, ...prev]);
    setActiveId(copy.id);
  }

  function remove(): void {
    if (!activeId) return;
    setList((prev) => prev.filter((e) => e.id !== activeId));
    setActiveId(null);
  }

  return (
    <div className="app">
      <div className="topbar no-print">
        <div className="brand">
          Form C Studio <small>Sdn Bhd · ITA 1967</small>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={create}>
            + Engagement
          </button>
          <button className="btn ghost" onClick={() => { const e = demoSeed(); setList((prev) => [e, ...prev]); setActiveId(e.id); setTab("report"); }}>
            Load demo proof
          </button>
          {eng && (
            <>
              <button className="btn ghost" onClick={duplicate}>
                Duplicate
              </button>
              <button className="btn ghost" onClick={rollover}>
                Rollover YA{eng.ya + 1}
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
                  onClick={() => setActiveId(e.id)}
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
          {eng && <MiniSummary eng={eng} />}
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
                    ["report", "5 · Report"],
                  ] as [Tab, string][]
                ).map(([t, label]) => (
                  <button
                    key={t}
                    className={tab === t ? "btn primary" : "btn"}
                    onClick={() => setTab(t)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {tab === "ingest" && <Ingest eng={eng} patch={patch} />}
              {tab === "entry" && <ComputationForm eng={eng} patch={patch} />}
              {tab === "registers" && <Registers eng={eng} patch={patch} />}
              {tab === "review" && <Review eng={eng} patch={patch} />}
              {tab === "report" && (
                <Report
                  eng={eng}
                  onChecklist={(i, v) =>
                    patch({ checks: eng.checks.map((c, j) => (j === i ? v : c)) })
                  }
                  onSnapshot={(r) => patch({ runs: [...eng.runs, r].slice(-20) })}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniSummary(props: { eng: Engagement }): JSX.Element {
  const { result } = useComputation(props.eng);
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
    </div>
  );
}
