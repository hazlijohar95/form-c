import { createContext, useContext, useState, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import "./tabs.css";

interface TabsContextValue {
  value: string | undefined;
  select: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue>({ value: undefined, select: () => undefined });

export interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: "normal" | "alt" | "pill" | "settings";
  orientation?: "horizontal" | "vertical";
  className?: string;
  children: ReactNode;
}

function TabsRoot(props: TabsProps): JSX.Element {
  const [uncontrolled, setUncontrolled] = useState(props.defaultValue);
  const value = props.value ?? uncontrolled;
  const select = (next: string): void => {
    props.onValueChange?.(next);
    if (props.value === undefined) setUncontrolled(next);
  };
  return (
    <TabsContext.Provider value={{ value, select }}>
      <div
        data-component="tabs"
        data-variant={props.variant ?? "normal"}
        data-orientation={props.orientation ?? "horizontal"}
        className={props.className}
      >
        {props.children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function TabsList(props: TabsListProps): JSX.Element {
  const { children, ...rest } = props;
  return (
    <div {...rest} role="tablist" data-slot="tabs-list">
      {children}
    </div>
  );
}

export interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  buttonClassName?: string;
  hideCloseButton?: boolean;
  closeButton?: ReactNode;
  onMiddleClick?: () => void;
  children: ReactNode;
}

function TabsTrigger(props: TabsTriggerProps): JSX.Element {
  const { value, buttonClassName, hideCloseButton, closeButton, onMiddleClick, children, onClick, ...rest } = props;
  const { value: active, select } = useContext(TabsContext);
  const selected = active === value;
  return (
    <div data-slot="tabs-trigger-wrapper" data-value={value} data-selected={selected ? true : undefined}>
      <button
        type="button"
        role="tab"
        aria-selected={selected}
        dir="auto"
        {...rest}
        data-slot="tabs-trigger"
        data-value={value}
        className={buttonClassName}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          select(value);
        }}
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
        {children}
      </button>
      {closeButton ? (
        <div data-slot="tabs-trigger-close-button" data-hidden={hideCloseButton}>
          {closeButton}
        </div>
      ) : null}
    </div>
  );
}

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  children: ReactNode;
}

function TabsContent(props: TabsContentProps): JSX.Element | null {
  const { value, children, ...rest } = props;
  const { value: active } = useContext(TabsContext);
  if (active !== value) return null;
  return (
    <div {...rest} role="tabpanel" data-slot="tabs-content" data-value={value}>
      {children}
    </div>
  );
}

function TabsSectionTitle(props: { children: ReactNode }): JSX.Element {
  return <div data-slot="tabs-section-title">{props.children}</div>;
}

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
  SectionTitle: TabsSectionTitle,
});
