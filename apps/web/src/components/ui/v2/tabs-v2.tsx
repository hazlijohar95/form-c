import "./tabs-v2.css";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";

export type TabsV2Variant = "normal" | "pill" | "settings";
export type TabsV2Orientation = "horizontal" | "vertical";

interface TabsContextValue {
  value: string | null;
  select: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsV2 subcomponents must be used within <TabsV2>");
  return ctx;
}

export interface TabsV2Props extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "children"> {
  variant?: TabsV2Variant;
  orientation?: TabsV2Orientation;
  value?: string | null;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
}

function TabsV2Root(props: TabsV2Props): JSX.Element {
  const { variant, orientation, value, defaultValue, onValueChange, children, ...rest } = props;
  const [internal, setInternal] = useState<string | null>(defaultValue ?? null);
  const controlled = Object.hasOwn(props as object, "value");
  const current = controlled ? (value ?? null) : internal;
  const select = useCallback(
    (next: string) => {
      if (!controlled) setInternal(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange],
  );
  return (
    <TabsContext.Provider value={{ value: current, select }}>
      <div
        {...rest}
        data-component="tabs-v2"
        data-variant={variant ?? "normal"}
        data-orientation={orientation ?? "horizontal"}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabsV2ListProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

function TabsV2List(props: TabsV2ListProps): JSX.Element {
  const { children, ...rest } = props;
  return (
    <div {...rest} role="tablist" data-slot="tabs-v2-list">
      {children}
    </div>
  );
}

export interface TabsV2TriggerProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  value: string;
  disabled?: boolean;
  onMiddleClick?: () => void;
  /** Optional subtext shown beside the primary content (muted style) */
  subtext?: ReactNode;
  children?: ReactNode;
}

function TabsV2Trigger(props: TabsV2TriggerProps): JSX.Element {
  const { value, disabled, onMiddleClick, subtext, children, ...rest } = props;
  const tabs = useTabs();
  const selected = tabs.value === value;
  return (
    <div
      {...rest}
      data-slot="tabs-v2-trigger-wrapper"
      data-value={value}
      data-selected={selected ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      onMouseDown={(e) => {
        if (e.button === 1 && onMiddleClick) e.preventDefault();
      }}
      onAuxClick={(e) => {
        if (e.button === 1 && onMiddleClick) {
          e.preventDefault();
          onMiddleClick();
        }
      }}
    >
      <button
        type="button"
        role="tab"
        aria-selected={selected}
        data-slot="tabs-v2-trigger"
        data-value={value}
        data-selected={selected ? "" : undefined}
        disabled={disabled}
        onClick={() => tabs.select(value)}
      >
        <span data-slot="tabs-v2-trigger-content">
          {children}
          {subtext ? <span data-slot="tabs-v2-subtext">{subtext}</span> : null}
        </span>
      </button>
    </div>
  );
}

export interface TabsV2CloseButtonProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}

function TabsV2CloseButton(props: TabsV2CloseButtonProps): JSX.Element {
  const { label, onClick, ...rest } = props;
  return (
    <div
      {...rest}
      role="button"
      tabIndex={0}
      aria-label={label ?? "Close tab"}
      data-slot="tabs-v2-close-button"
      onClick={(e: ReactMouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof onClick === "function") onClick(e);
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.8889 3.11108L3.11108 10.8889" stroke="currentColor" strokeLinejoin="round" />
        <path d="M3.11108 3.11108L10.8889 10.8889" stroke="currentColor" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export interface TabsV2ContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  children?: ReactNode;
}

function TabsV2Content(props: TabsV2ContentProps): JSX.Element {
  const { value, children, ...rest } = props;
  const tabs = useTabs();
  if (tabs.value !== value) return <div {...rest} data-slot="tabs-v2-content" hidden />;
  return (
    <div {...rest} role="tabpanel" data-slot="tabs-v2-content">
      {children}
    </div>
  );
}

function TabsV2SectionTitle(props: { children?: ReactNode }): JSX.Element {
  return <div data-slot="tabs-v2-section-title">{props.children}</div>;
}

export const TabsV2 = Object.assign(TabsV2Root, {
  List: TabsV2List,
  Trigger: TabsV2Trigger,
  CloseButton: TabsV2CloseButton,
  Content: TabsV2Content,
  SectionTitle: TabsV2SectionTitle,
});
