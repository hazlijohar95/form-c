import type { Engagement } from "../lib/types.js";

export function EngagementTabs(props: {
  list: Engagement[];
  activeId: string | null;
  settingsActive: boolean;
  onHome: () => void;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onCreate: () => void;
  onSettings: () => void;
}): JSX.Element {
  return (
    <nav className="tabbar no-print" aria-label="Engagements">
      <button
        type="button"
        aria-current={!props.activeId && !props.settingsActive ? "page" : undefined}
        className="tabbar-tab icon"
        title="Home — all and recent engagements"
        onClick={props.onHome}
      >
        <span aria-hidden="true">▦</span>
        <span className="sr-only">Home</span>
      </button>
      {props.list.map((e) => {
        const label = `${e.companyName || "(unnamed)"} · YA${e.ya}`;
        const selected = e.id === props.activeId && !props.settingsActive;
        return (
          <div key={e.id} className={`tabbar-tab wrap${selected ? " sel" : ""}`}>
            <button
              type="button"
              aria-current={selected ? "page" : undefined}
              className="tabbar-main"
              title={label}
              onClick={() => props.onSelect(e.id)}
            >
              <span className="tabbar-badge" aria-hidden="true">{e.formType}</span>
              <span className="tabbar-label">{e.companyName || "(unnamed company)"}</span>
            </button>
            <button
              type="button"
              className="tabbar-x"
              aria-label={`Close ${label}`}
              title={`Close ${label}`}
              onClick={() => props.onClose(e.id)}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        );
      })}
      <button type="button" className="tabbar-tab icon" title="New engagement" aria-label="New engagement" onClick={props.onCreate}>
        <span aria-hidden="true">+</span>
      </button>
      <div className="tabbar-sp" />
      <button
        type="button"
        aria-current={props.settingsActive ? "page" : undefined}
        className="tabbar-tab icon"
        title="Settings"
        aria-label="Settings"
        onClick={props.onSettings}
      >
        <span aria-hidden="true">⚙</span>
      </button>
    </nav>
  );
}
