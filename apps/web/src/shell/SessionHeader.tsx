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
      <h1 className="session-title">{props.title} <span className="hint">· {props.subtitle}</span></h1>
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
    <details className="menu">
      <summary className="btn btn-xs ghost" aria-label="Session actions">···</summary>
      <div className="menu-pop" role="menu">
        <button type="button" role="menuitem" onClick={props.onSnapshot}>Snapshot run</button>
        <button type="button" role="menuitem" onClick={props.onExport}>Copy MyTax JSON</button>
        <button type="button" role="menuitem" onClick={props.onDuplicate}>Duplicate</button>
        <button type="button" role="menuitem" onClick={props.onPrint}>Print</button>
        <button type="button" role="menuitem" className="danger" onClick={props.onRemove}>Delete</button>
      </div>
    </details>
  );
}
