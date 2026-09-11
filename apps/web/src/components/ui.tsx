import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface Toast {
  id: string;
  title: string;
  detail?: string;
  err?: boolean;
}

export function pushToast(set: React.Dispatch<React.SetStateAction<Toast[]>>, t: Omit<Toast, "id">): void {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  set((prev) => [...prev.slice(-3), { ...t, id }]);
  window.setTimeout(() => {
    set((prev) => prev.filter((x) => x.id !== id));
  }, 4200);
}

export function Toasts(props: { items: Toast[] }): JSX.Element {
  return (
    <div className="toasts no-print" aria-live="polite" aria-atomic="false" role="status">
      {props.items.map((t) => (
        <div key={t.id} className={t.err ? "toast err" : "toast"}>
          <div className="tt">{t.title}</div>
          {t.detail && <div className="td">{t.detail}</div>}
        </div>
      ))}
    </div>
  );
}

// Labelled text field — replaces bare placeholder-only inputs.
export function Field(props: {
  label: string;
  value: string;
  on: (v: string) => void;
  mono?: boolean;
  hint?: string;
  type?: string;
  required?: boolean;
}): JSX.Element {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div>
      <label className="f" htmlFor={id}>
        {props.label} {props.required && <span className="req" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        type={props.type ?? "text"}
        className={props.mono ? "num" : ""}
        value={props.value}
        required={props.required}
        aria-describedby={props.hint ? hintId : undefined}
        onChange={(e) => props.on(e.target.value)}
      />
      {props.hint && (
        <div className="field-hint" id={hintId}>
          {props.hint}
        </div>
      )}
    </div>
  );
}

export interface PaletteAction {
  id: string;
  group: string;
  title: string;
  hint: string;
  run: () => void;
}

function PaletteItem(props: {
  action: PaletteAction;
  index: number;
  active: number;
  setActive: (v: number) => void;
  choose: (a: PaletteAction) => void;
}): JSX.Element {
  const { action: a, index: idx } = props;
  return (
    <button
      type="button"
      className="item"
      data-active={idx === props.active}
      onMouseEnter={() => props.setActive(idx)}
      onClick={() => props.choose(a)}
    >
      <span>{a.title}</span>
      <span className="k">{a.hint}</span>
    </button>
  );
}

// OpenCode-style command palette: single Cmd/Ctrl+K entry, Suggested on
// empty filter, grouped fuzzy title-weighted results, footer key hints.
export function Palette(props: { open: boolean; close: () => void; actions: PaletteAction[]; suggestedIds?: string[] }): JSX.Element | null {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (props.open) {
      setQ("");
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [props.open]);
  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return props.actions;
    const scored = props.actions
      .map((a) => {
        const t = a.title.toLowerCase();
        const g = a.group.toLowerCase();
        let s = -1;
        if (t.startsWith(needle)) s = 0;
        else if (t.includes(needle)) s = 1;
        else if (g.includes(needle)) s = 2;
        return { a, s };
      })
      .filter((x) => x.s >= 0)
      .sort((x, y) => x.s - y.s || x.a.title.localeCompare(y.a.title));
    return scored.map((x) => x.a);
  }, [q, props.actions]);
  useEffect(() => setActive(0), [q]);
  // Render-order index shared by suggested + grouped items so arrows and
  // hover stay on the same flat list. useRef lives with the other hooks —
  // above the early return — or React throws on open/close toggles.
  const idxRef = useRef(0);
  idxRef.current = -1;
  function nextIdx(): number {
    idxRef.current += 1;
    return idxRef.current;
  }
  if (!props.open) return null;
  const groups: { name: string; items: PaletteAction[] }[] = [];
  for (const a of items) {
    const g = groups.find((x) => x.name === a.group);
    if (g) g.items.push(a);
    else groups.push({ name: a.group, items: [a] });
  }
  const showSuggested = q.trim() === "" && (props.suggestedIds?.length ?? 0) > 0;
  const suggested = showSuggested
    ? props.suggestedIds!.map((id) => props.actions.find((a) => a.id === id)).filter((a): a is PaletteAction => !!a)
    : [];
  const flat = [...suggested, ...groups.flatMap((g) => g.items)];
  function choose(a: PaletteAction | undefined): void {
    if (!a) return;
    props.close();
    a.run();
  }
  return (
    <div
      className="palette-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) props.close();
      }}
    >
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type a command — filing, engagement, tab…"
          aria-label="Search commands"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((v) => Math.min(v + 1, flat.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((v) => Math.max(v - 1, 0)); }
            else if (e.key === "Enter") { e.preventDefault(); choose(flat[active]); }
            else if (e.key === "Escape") { e.preventDefault(); props.close(); }
          }}
        />
        <div style={{ overflowY: "auto" }}>
          {flat.length === 0 && (
            <div className="empty">
              <div className="t">No results found</div>
              <div className="d">
                Nothing matches <strong>{q}</strong>. Try “engagement”, “report”, or “snapshot”.
              </div>
            </div>
          )}
          {suggested.length > 0 && (
            <div>
              <div className="group">Suggested</div>
              {suggested.map((a) => {
                const idx = nextIdx();
                return <PaletteItem key={`s-${a.id}`} action={a} index={idx} active={active} setActive={setActive} choose={choose} />;
              })}
            </div>
          )}
          {groups.map((g) => (
            <div key={g.name}>
              <div className="group">{g.name}</div>
              {g.items.map((a) => {
                const idx = nextIdx();
                return <PaletteItem key={a.id} action={a} index={idx} active={active} setActive={setActive} choose={choose} />;
              })}
            </div>
          ))}
        </div>
        <div className="foot">
          <span><kbd className="chip">↑↓</kbd> move</span>
          <span><kbd className="chip">↵</kbd> run</span>
          <span><kbd className="chip">g 1–6</kbd> steps</span>
          <span><kbd className="chip">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
