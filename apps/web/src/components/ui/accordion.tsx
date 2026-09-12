import { createContext, useCallback, useContext, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import "./accordion.css";

interface AccordionContextValue {
  isExpanded: (value: string) => boolean;
  toggle: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue>({
  isExpanded: () => false,
  toggle: () => undefined,
});

const ItemContext = createContext<string>("");

export interface AccordionProps {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  multiple?: boolean;
  collapsible?: boolean;
  className?: string;
  children: ReactNode;
}

function AccordionRoot(props: AccordionProps): JSX.Element {
  const uncontrolled = props.defaultValue ?? [];
  const current = props.value ?? uncontrolled;

  const toggle = useCallback(
    (item: string) => {
      const expanded = current.includes(item);
      let next: string[];
      if (expanded) {
        if (!props.collapsible && current.length <= 1) return;
        next = current.filter((v) => v !== item);
      } else if (props.multiple) {
        next = [...current, item];
      } else {
        next = [item];
      }
      props.onValueChange?.(next);
    },
    [current, props],
  );

  const isExpanded = useCallback((item: string) => current.includes(item), [current]);

  return (
    <AccordionContext.Provider value={{ isExpanded, toggle }}>
      <div data-component="accordion" className={props.className}>
        {props.children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  children: ReactNode;
}

function AccordionItem(props: AccordionItemProps): JSX.Element {
  const { value, children, ...rest } = props;
  const { isExpanded } = useContext(AccordionContext);
  const expanded = isExpanded(value);
  return (
    <ItemContext.Provider value={value}>
      <div {...rest} data-slot="accordion-item" data-value={value} data-expanded={expanded ? true : undefined}>
        {children}
      </div>
    </ItemContext.Provider>
  );
}

export interface AccordionHeaderProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

function AccordionHeader(props: AccordionHeaderProps): JSX.Element {
  const { children, ...rest } = props;
  return (
    <h3 data-slot="accordion-header" {...rest}>
      {children}
    </h3>
  );
}

export interface AccordionTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

function AccordionTrigger(props: AccordionTriggerProps): JSX.Element {
  const { children, onClick, ...rest } = props;
  const value = useContext(ItemContext);
  const { isExpanded, toggle } = useContext(AccordionContext);
  const expanded = isExpanded(value);
  return (
    <button
      type="button"
      aria-expanded={expanded}
      {...rest}
      data-slot="accordion-trigger"
      data-expanded={expanded ? true : undefined}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        toggle(value);
      }}
    >
      {children}
    </button>
  );
}

export interface AccordionContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function AccordionContent(props: AccordionContentProps): JSX.Element | null {
  const { children, ...rest } = props;
  const value = useContext(ItemContext);
  const { isExpanded } = useContext(AccordionContext);
  if (!isExpanded(value)) return null;
  return (
    <div {...rest} data-slot="accordion-content" data-expanded>
      {children}
    </div>
  );
}

export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Header: AccordionHeader,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
});
