import { useEffect, useMemo, useRef, useState } from "react";

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
      role="option"
      id={`palette-opt-${a.id}`}
      aria-selected={idx === props.active}
      tabIndex={-1}
      onMouseEnter={() => props.setActive(idx)}
      onClick={() => props.choose(a)}
    >
      <span>{a.title}</span>
      <span className="k" aria-hidden="true">{a.hint}</span>
    </button>
  );
}

export function Palette(props: { open: boolean; close: () => void; actions: PaletteAction[]; suggestedIds?: string[] }): JSX.Element | null {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (props.open) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      setQ("");
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [props.open]);
  useEffect(() => {
    if (!props.open) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key !== "Tab" || !dialogRef.current) return;
      const els = dialogRef.current.querySelectorAll<HTMLElement>(
        'input:not([disabled]), button:not([disabled])'
      );
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey, true);
    // The dialog renders inside .app, so inert the overlay's siblings —
    // Tab is already trapped, this keeps SR browse-mode cursors out too.
    const siblings = Array.from(document.querySelectorAll(".app > :not(.palette-overlay)"));
    siblings.forEach((el) => el.setAttribute("inert", ""));
    return () => {
      document.removeEventListener("keydown", onKey, true);
      siblings.forEach((el) => el.removeAttribute("inert"));
    };
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
      <div className="palette" ref={dialogRef} role="dialog" aria-modal="true" aria-label="Command palette"
        onKeyDown={(e) => {
          if (e.key === "Escape") { e.preventDefault(); props.close(); }
        }}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type a command — filing, engagement, tab…"
          aria-label="Search commands"
          role="combobox"
          aria-expanded={flat.length > 0}
          aria-controls="palette-list"
          aria-autocomplete="list"
          aria-activedescendant={flat[active] ? `palette-opt-${flat[active].id}` : undefined}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((v) => Math.min(v + 1, flat.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((v) => Math.max(v - 1, 0)); }
            else if (e.key === "Enter") { e.preventDefault(); choose(flat[active]); }
          }}
        />
        <div className="palette-list" id="palette-list" role="listbox" aria-label="Commands">
          {flat.length === 0 && (
            <div className="empty">
              <div className="t">No results found</div>
              <div className="d">
                Nothing matches <strong>{q}</strong>. Try “engagement”, “report”, or “snapshot”.{" "}
                <button
                  type="button"
                  className="linkbtn"
                  onClick={() => {
                    setQ("");
                    inputRef.current?.focus();
                  }}
                >
                  Clear search
                </button>
              </div>
            </div>
          )}
          {suggested.length > 0 && (
            <div role="group" aria-label="Suggested">
              <div className="group" aria-hidden="true">Suggested</div>
              {suggested.map((a) => {
                const idx = nextIdx();
                return <PaletteItem key={`s-${a.id}`} action={a} index={idx} active={active} setActive={setActive} choose={choose} />;
              })}
            </div>
          )}
          {groups.map((g) => (
            <div key={g.name} role="group" aria-label={g.name}>
              <div className="group" aria-hidden="true">{g.name}</div>
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
