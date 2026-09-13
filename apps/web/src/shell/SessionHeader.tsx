import { StatusDot } from "../components/ui/primitives.js";
import type { ThemeMode } from "../lib/theme.js";

export function SessionHeader(props: {
  title: string;
  subtitle: string;
  useServer: boolean;
  serverError: string | null;
  onPalette: () => void;
  theme: ThemeMode;
  resolvedTheme: "dark" | "light";
  onToggleTheme: () => void;
  menu: React.ReactNode;
}): JSX.Element {
  return (
    <div className="session-head no-print">
      <div className="session-titlewrap">
        <h1 className="session-title">{props.title}</h1>
        <span className="session-sub">{props.subtitle}</span>
        <span className="save-dot" title="All changes save automatically" aria-label="All changes save automatically">
          <span className="save-pulse" aria-hidden="true" />Saved
        </span>
      </div>
      <div className="session-actions">
        <StatusDot useServer={props.useServer} error={props.serverError} />
        <button type="button" className="btn btn-xs ghost" onClick={props.onPalette} title="Command palette (Ctrl/⌘+K)" aria-label="Open command palette">
          ⌘K
        </button>
        <button
          type="button"
          className="btn btn-xs ghost"
          onClick={props.onToggleTheme}
          aria-label={`Switch to ${props.resolvedTheme === "dark" ? "light" : "dark"} theme`}
        >
          <span aria-hidden="true">{props.resolvedTheme === "dark" ? "☀" : "☾"}</span>
        </button>
        {props.menu}
      </div>
    </div>
  );
}

export function SessionMenu(props: {
  onSnapshot: () => void;
  onExport: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onPrint: () => void;
}): JSX.Element {
  return (
    <details
      className="menu"
      onKeyDown={(e) => {
        if (e.key === "Escape") e.currentTarget.open = false;
      }}
    >
      <summary className="btn btn-xs ghost" aria-label="Session actions"><span aria-hidden="true">···</span></summary>
      <div className="menu-pop">
        <button type="button" onClick={props.onSnapshot}>Snapshot</button>
        <button type="button" onClick={props.onExport}>Copy MyTax JSON</button>
        <button type="button" onClick={props.onDuplicate}>Duplicate</button>
        <button type="button" onClick={props.onPrint}>Print</button>
        <button type="button" className="danger" onClick={props.onRemove}>Delete</button>
      </div>
    </details>
  );
}
