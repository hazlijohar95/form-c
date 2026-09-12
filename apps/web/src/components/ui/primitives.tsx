export type ServerStatus = "server" | "local" | "error";

export function serverStatus(s: { useServer: boolean; error: string | null }): { kind: ServerStatus; text: string; className: string } {
  if (s.useServer) return { kind: "server", text: "server (D1)", className: "status-dot on" };
  // Missing wrangler / offline is normal local dev — show calm "local", not scary red.
  // Only auth errors get error styling.
  if (s.error && /401|403|unauthorized/i.test(s.error)) return { kind: "error", text: `local — ${s.error}`, className: "status-dot err" };
  return { kind: "local", text: "local", className: "status-dot" };
}

export function StatusDot(props: { useServer: boolean; error: string | null }): JSX.Element {
  const st = serverStatus(props);
  return (
    <span className={st.className} role="status" title={props.error ?? "D1 reachable"}>
      <span className="dot" aria-hidden="true" />
      {st.text}
    </span>
  );
}

export function Empty(props: { title: string; hint?: React.ReactNode; icon?: string }): JSX.Element {
  return (
    <div className="empty">
      {props.icon && <div className="eicon" aria-hidden="true">{props.icon}</div>}
      <div className="t">{props.title}</div>
      {props.hint && <div className="d">{props.hint}</div>}
    </div>
  );
}

/*
 * Horizontally scrollable table wrapper. A scroll container that only responds
 * to the mouse is unreachable by keyboard, so the region gets a tab stop and an
 * accessible name — the pair has to travel together, which is why this is one
 * component rather than a class plus three attributes at each call site.
 */
export function TableScroll(props: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="tscroll" tabIndex={0} role="region" aria-label={`${props.label}, scrollable`}>
      {props.children}
    </div>
  );
}

export function Skeleton(props: { label?: string }): JSX.Element {
  return (
    <div className="skeleton" role="status" aria-label={props.label ?? "Loading step"}>
      <div className="bar" style={{ width: "40%" }} />
      <div className="bar" />
      <div className="bar" style={{ width: "70%" }} />
    </div>
  );
}
