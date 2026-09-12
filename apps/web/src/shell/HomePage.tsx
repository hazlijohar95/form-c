import { useMemo, useState } from "react";
import type { Engagement } from "../lib/types.js";
import { Empty } from "../components/ui/primitives.js";

export function HomePage(props: {
  list: Engagement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDemo: () => void;
  onSettings: () => void;
  onHelp: () => void;
}): JSX.Element {
  const [q, setQ] = useState("");
  const selected = props.list.find((e) => e.id === props.selectedId) ?? null;
  const scopeName = selected?.companyName || null;
  const filtered = useMemo(() => {
    let rows = props.list;
    if (selected) rows = rows.filter((e) => (e.companyName || "") === (selected.companyName || ""));
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((e) =>
      `${e.companyName} YA${e.ya} ${e.regNo}`.toLowerCase().includes(needle)
    );
  }, [props.list, q, selected?.companyName]);
  const recent = filtered.slice(0, 8);

  return (
    <div className="home">
      <div className="home-side no-print">
        <section aria-labelledby="home-proj-h">
          <div className="home-proj-head">
            <h3 id="home-proj-h">Projects</h3>
            <button type="button" className="iconbtn" title="New engagement" aria-label="New engagement" onClick={props.onCreate}>
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 4.5A1.5 1.5 0 0 1 2.5 3h3l1.5 2h4A1.5 1.5 0 0 1 12.5 6.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                <line x1="7" y1="9.5" x2="7" y2="12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <line x1="5.5" y1="11" x2="8.5" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <ul className="steps">
            {props.list.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className="row"
                  aria-current={e.id === props.selectedId ? "true" : undefined}
                  onClick={() => props.onSelect(e.id)}
                >
                  <span className="n" aria-hidden="true">{e.formType}</span>
                  <span className="meta">
                    <div className="name">{e.companyName || "(unnamed company)"}</div>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {props.list.length === 0 && (
            <Empty
              title="No projects yet"
              hint={<span>Create an engagement — or <button type="button" className="linkbtn" onClick={props.onDemo}>load the demo proof</button>.</span>}
              icon="▦"
            />
          )}
        </section>
        <nav aria-label="App">
          <button type="button" className="row ghost" onClick={props.onSettings}>
            <span aria-hidden="true">⚙</span> Settings
          </button>
          <button type="button" className="row ghost" onClick={props.onHelp}>
            <span aria-hidden="true">?</span> Help
          </button>
        </nav>
      </div>
      <div className="home-main">
        <label className="home-search">
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="10.5" y1="10.5" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={scopeName ? `Search sessions in ${scopeName}` : "Search engagements"}
            aria-label="Search engagements"
          />
        </label>
        <div className="home-head">
          <h2>Recent sessions</h2>
          <button type="button" className="btn-new" onClick={props.onCreate}>
            <span aria-hidden="true">✎</span> New session
          </button>
        </div>
        {recent.length === 0 ? (
          <Empty
            title={props.list.length === 0 ? "No engagements yet" : "No matches"}
            hint={props.list.length === 0 ? "Create one, or load the demo proof to see a complete Report." : `Nothing matches “${q}”.`}
            icon="＋"
          />
        ) : (
          <ul className="home-list">
            {recent.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className="home-row"
                  aria-current={e.id === props.selectedId ? "true" : undefined}
                  onClick={() => props.onSelect(e.id)}
                >
                  <span className="n" aria-hidden="true">{e.formType}</span>
                  <span className="meta">
                    <div className="name">{e.companyName || "(unnamed company)"} <span className="sub">· YA{e.ya}</span></div>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
