import {
  createContext,
  useContext,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import "./accordion-v2.css";

interface AccordionV2RootContext {
  openValues: string[];
  toggle: (value: string) => void;
  isOpen: (value: string) => boolean;
}

const RootContext = createContext<AccordionV2RootContext>({
  openValues: [],
  toggle: () => undefined,
  isOpen: () => false,
});

export interface AccordionV2Props extends HTMLAttributes<HTMLDivElement> {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  children?: ReactNode;
}

function AccordionV2Root(props: AccordionV2Props) {
  const { value, defaultValue, onValueChange, className, children, ...rest } = props;
  const [internal, setInternal] = useState<string[]>(defaultValue ?? []);
  const resolved = value ?? internal;
  const toggle = (item: string) => {
    const next = resolved.includes(item) ? resolved.filter((v) => v !== item) : [...resolved, item];
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };
  const isOpen = (item: string) => resolved.includes(item);
  return (
    <RootContext.Provider value={{ openValues: resolved, toggle, isOpen }}>
      <div {...rest} data-component="accordion-v2" className={className}>
        {children}
      </div>
    </RootContext.Provider>
  );
}

export interface AccordionV2ItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

const ItemContext = createContext<{ value: string; disabled: boolean }>({ value: "", disabled: false });

function AccordionV2Item(props: AccordionV2ItemProps) {
  const { value, disabled, className, children, ...rest } = props;
  const { isOpen } = useContext(RootContext);
  const expanded = isOpen(value);
  return (
    <ItemContext.Provider value={{ value, disabled: disabled ?? false }}>
      <div
        {...rest}
        data-component="accordion-v2-item"
        data-expanded={expanded ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        className={className}
      >
        {children}
      </div>
    </ItemContext.Provider>
  );
}

function AccordionV2Header(props: HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return <div {...rest} data-slot="accordion-v2-header" className={className} />;
}

export interface AccordionV2TriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  hideChevron?: boolean;
}

function AccordionV2Trigger(props: AccordionV2TriggerProps) {
  const { hideChevron, className, children, onClick, ...rest } = props;
  const { toggle } = useContext(RootContext);
  const item = useContext(ItemContext);
  const { isOpen } = useContext(RootContext);
  const expanded = isOpen(item.value);
  if (item.disabled) {
    return (
      <button type="button" disabled data-component="accordion-v2-trigger" data-disabled="" className={className}>
        <span data-slot="accordion-v2-trigger-content">{children}</span>
        {hideChevron ? null : <ChevronDown />}
      </button>
    );
  }
  return (
    <button
      type="button"
      {...rest}
      aria-expanded={expanded}
      data-component="accordion-v2-trigger"
      data-expanded={expanded ? "" : undefined}
      className={className}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        toggle(item.value);
      }}
    >
      <span data-slot="accordion-v2-trigger-content">{children}</span>
      {hideChevron ? null : <ChevronDown />}
    </button>
  );
}

function AccordionV2Content(props: HTMLAttributes<HTMLDivElement>) {
  const { className, children, ...rest } = props;
  const { isOpen } = useContext(RootContext);
  const item = useContext(ItemContext);
  const expanded = isOpen(item.value);
  if (!expanded) return null;
  return (
    <div {...rest} data-component="accordion-v2-content" data-expanded="" className={className}>
      <div data-slot="accordion-v2-content-inner">{children}</div>
    </div>
  );
}

function ChevronDown() {
  return (
    <svg
      data-slot="accordion-v2-chevron"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M4 5.5L7 8.5L10 5.5" stroke="currentColor" />
    </svg>
  );
}

export const AccordionV2 = Object.assign(AccordionV2Root, {
  Item: AccordionV2Item,
  Header: AccordionV2Header,
  Trigger: AccordionV2Trigger,
  Content: AccordionV2Content,
});
