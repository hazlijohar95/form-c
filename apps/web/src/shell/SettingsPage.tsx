import type { ThemeMode } from "../lib/theme.js";
import { ButtonV2 } from "../components/ui/v2/button-v2.js";
import { SegmentedControlV2, SegmentedControlItemV2 } from "../components/ui/v2/segmented-control-v2.js";
import { SelectV2 } from "../components/ui/v2/select-v2.js";
import { Tag } from "../components/ui/v2/badge-v2.js";
import { Icon } from "../components/ui/v2/icon.js";

export type SettingsSection = "preferences" | "appearance" | "filing" | "data" | "about";

export const SETTINGS_NAV: { group: string; items: { id: SettingsSection; label: string; icon: string }[] }[] = [
  {
    group: "Preferences",
    items: [
      { id: "preferences", label: "Preferences", icon: "settings-gear" },
      { id: "appearance", label: "Appearance", icon: "monitor" },
    ],
  },
  { group: "Filing", items: [{ id: "filing", label: "Filing defaults", icon: "grid-plus" }] },
  {
    group: "Workspace",
    items: [
      { id: "data", label: "Data & sync", icon: "archive" },
      { id: "about", label: "About", icon: "help" },
    ],
  },
];

const YA_OPTIONS = [2025, 2026];
const THEME_MODES: ThemeMode[] = ["system", "dark", "light"];
const THEME_LABEL: Record<ThemeMode, string> = { system: "Auto", dark: "Dark", light: "Light" };

/** One settings row: title + description on the left, control on the right. */
function PrefRow(props: { title: string; description: string; children?: JSX.Element }): JSX.Element {
  return (
    <div className="pref-row">
      <div>
        <div className="t">{props.title}</div>
        <div className="d">{props.description}</div>
      </div>
      {props.children}
    </div>
  );
}

export function SettingsPage(props: {
  section: SettingsSection;
  onSection: (s: SettingsSection) => void;
  onBack: () => void;
  theme: ThemeMode;
  onTheme: (m: ThemeMode) => void;
  defaultYa: number;
  onDefaultYa: (ya: number) => void;
  useServer: boolean;
  serverError: string | null;
  onRetry: () => void;
  onPush: () => void;
  onDemo: () => void;
  onEraseAll: () => void;
  notice: string | null;
}): JSX.Element {
  const syncDescription = props.useServer
    ? "Connected to D1"
    : props.serverError
      ? `Local — ${props.serverError}`
      : "Local only";

  return (
    <div className="settings">
      <div className="settings-side no-print">
        <button type="button" className="row ghost" onClick={props.onBack}>
          <span aria-hidden="true">←</span> Back to app
        </button>
        <nav aria-label="Settings">
          {SETTINGS_NAV.map((g) => (
            <div key={g.group}>
              <div className="group" aria-hidden="true">
                {g.group}
              </div>
              {g.items.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  role="tab"
                  aria-selected={props.section === it.id}
                  className="row"
                  onClick={() => props.onSection(it.id)}
                >
                  <Icon name={it.icon} size="small" />
                  {it.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </div>
      <div className="settings-main">
        {props.section === "preferences" && (
          <>
            <h2>Preferences</h2>
            <p className="hint">Customize preferences and default behavior</p>
            <div className="pref-card">
              <PrefRow title="Default YA" description="Choose which year new engagements start in">
                <SelectV2
                  options={YA_OPTIONS}
                  current={props.defaultYa}
                  value={(ya) => String(ya)}
                  label={(ya) => `YA${ya}`}
                  onSelect={(ya) => {
                    if (ya != null) props.onDefaultYa(ya);
                  }}
                  aria-label="Default YA"
                />
              </PrefRow>
              <PrefRow title="Sync status" description={syncDescription}>
                <div className="pref-actions">
                  <Tag variant={props.useServer ? "accent" : "neutral"}>{props.useServer ? "Online" : "Offline"}</Tag>
                  <ButtonV2 size="small" onClick={props.onRetry}>
                    Retry
                  </ButtonV2>
                </div>
              </PrefRow>
            </div>
          </>
        )}
        {props.section === "appearance" && (
          <>
            <h2>Appearance</h2>
            <p className="hint">Theme follows your OS on Auto</p>
            <div className="pref-card">
              <PrefRow title="Theme" description="Applies immediately and is remembered on this device">
                <SegmentedControlV2
                  value={props.theme}
                  onChange={(v) => {
                    if (v) props.onTheme(v as ThemeMode);
                  }}
                  aria-label="Theme"
                >
                  {THEME_MODES.map((m) => (
                    <SegmentedControlItemV2 key={m} value={m}>
                      {THEME_LABEL[m]}
                    </SegmentedControlItemV2>
                  ))}
                </SegmentedControlV2>
              </PrefRow>
            </div>
          </>
        )}
        {props.section === "filing" && (
          <>
            <h2>Filing defaults</h2>
            <p className="hint">Defaults applied to new engagements only</p>
            <div className="pref-card">
              <PrefRow title="Load demo proof" description="Open a complete example Report">
                <ButtonV2 size="small" variant="contrast" onClick={props.onDemo}>
                  Load
                </ButtonV2>
              </PrefRow>
            </div>
          </>
        )}
        {props.section === "data" && (
          <>
            <h2>Data & sync</h2>
            <p className="hint">Local browser storage + D1 when connected</p>
            <div className="pref-card">
              <PrefRow title="Push local → D1" description="Upload all local engagements to the server">
                <ButtonV2 size="small" onClick={props.onPush}>
                  Push
                </ButtonV2>
              </PrefRow>
              <PrefRow
                title="Erase all"
                description="Delete every engagement in this browser. Cannot be undone."
              >
                <ButtonV2 size="small" variant="danger" onClick={props.onEraseAll}>
                  Erase
                </ButtonV2>
              </PrefRow>
            </div>
            {props.notice && (
              <p className="hint" role="status">
                {props.notice}
              </p>
            )}
          </>
        )}
        {props.section === "about" && (
          <>
            <h2>About</h2>
            <p className="hint">Form C Studio — Sdn Bhd · ITA 1967</p>
            <div className="pref-card">
              <PrefRow title="Engine" description="@formc/engine — sen-integer tax math, zero dependencies" />
              <PrefRow title="Shortcuts" description="⌘K palette · g 1–6 steps · ←/→ tabs" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
