import { createContext, useContext, useState, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import "./collapsible.css";
import { Icon } from "./icon";

const Ctx = createContext<{ open: boolean; setOpen: (open: boolean) => void }>({
  open: false,
  setOpen: () => undefined,
});

export interface CollapsibleProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  variant?: "normal" | "ghost";
  children: ReactNode;
}

function CollapsibleRoot(props: CollapsibleProps): JSX.Element {
  const [uncontrolled, setUncontrolled] = useState(props.defaultOpen ?? false);
  const open = props.open ?? uncontrolled;
  const setOpen = (next: boolean): void => {
    props.onOpenChange?.(next);
    if (props.open === undefined) setUncontrolled(next);
  };
  return (
    <div
      data-component="collapsible"
      data-variant={props.variant ?? "normal"}
      data-expanded={open ? true : undefined}
      className={props.className}
    >
      <CollapsibleContext open={open} setOpen={setOpen}>
        {props.children}
      </CollapsibleContext>
    </div>
  );
}

function CollapsibleContext(props: { open: boolean; setOpen: (open: boolean) => void; children: ReactNode }): JSX.Element {
  return <Ctx.Provider value={{ open: props.open, setOpen: props.setOpen }}>{props.children}</Ctx.Provider>;
}

export interface CollapsibleTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

function CollapsibleTrigger(props: CollapsibleTriggerProps): JSX.Element {
  const { children, onClick, ...rest } = props;
  const { open, setOpen } = useContext(Ctx);
  return (
    <button
      type="button"
      aria-expanded={open}
      {...rest}
      data-slot="collapsible-trigger"
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        setOpen(!open);
      }}
    >
      {children}
    </button>
  );
}

export interface CollapsibleContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function CollapsibleContent(props: CollapsibleContentProps): JSX.Element | null {
  const { children, ...rest } = props;
  const { open } = useContext(Ctx);
  if (!open) return null;
  return (
    <div {...rest} data-slot="collapsible-content" data-expanded>
      {children}
    </div>
  );
}

function CollapsibleArrow(props?: HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div data-slot="collapsible-arrow" {...(props ?? {})}>
      <span data-slot="collapsible-arrow-icon">
        <Icon name="chevron-down" size="small" />
      </span>
    </div>
  );
}

export const Collapsible = Object.assign(CollapsibleRoot, {
  Arrow: CollapsibleArrow,
  Trigger: CollapsibleTrigger,
  Content: CollapsibleContent,
});
