import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import "./popover.css";
import { IconButton } from "./icon-button";

export interface PopoverProps {
  trigger?: ReactNode;
  triggerProps?: HTMLAttributes<HTMLDivElement>;
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  portal?: boolean;
  children: ReactNode;
}

export function Popover(props: PopoverProps): JSX.Element {
  const [uncontrolled, setUncontrolled] = useState(props.defaultOpen ?? false);
  const open = props.open ?? uncontrolled;
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const setOpen = (next: boolean): void => {
    props.onOpenChange?.(next);
    if (props.open === undefined) setUncontrolled(next);
  };

  useEffect(() => {
    if (!open) return;
    const inside = (node: Node | null): boolean => {
      if (!node) return false;
      const content = contentRef.current;
      if (content && content.contains(node)) return true;
      const trigger = triggerRef.current;
      if (trigger && trigger.contains(node)) return true;
      return false;
    };
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    };
    const onPointerDown = (e: PointerEvent): void => {
      if (e.target instanceof Node && inside(e.target)) return;
      setOpen(false);
    };
    const onFocusIn = (e: FocusEvent): void => {
      if (e.target instanceof Node && inside(e.target)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    window.addEventListener("focusin", onFocusIn, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("pointerdown", onPointerDown, { capture: true });
      window.removeEventListener("focusin", onFocusIn, { capture: true });
    };
  }, [open, props]);

  return (
    <div data-component="popover" style={{ position: "relative", display: "inline-flex" }}>
      <div
        ref={triggerRef}
        data-slot="popover-trigger"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-haspopup="dialog"
        {...props.triggerProps}
        onClick={(e) => {
          props.triggerProps?.onClick?.(e);
          if (e.defaultPrevented) return;
          setOpen(!open);
        }}
        onKeyDown={(e) => {
          props.triggerProps?.onKeyDown?.(e);
          if (e.defaultPrevented) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          }
        }}
      >
        {props.trigger}
      </div>
      {open ? (
        <div
          ref={contentRef}
          role="dialog"
          aria-modal={props.modal ?? false}
          data-component="popover-content"
          className={props.className}
        >
          {props.title ? (
            <div data-slot="popover-header">
              <h2 data-slot="popover-title">{props.title}</h2>
              <IconButton
                data-slot="popover-close-button"
                icon="close"
                variant="ghost"
                aria-label="Close"
                onClick={() => setOpen(false)}
              />
            </div>
          ) : null}
          {props.description ? <p data-slot="popover-description">{props.description}</p> : null}
          <div data-slot="popover-body">{props.children}</div>
        </div>
      ) : null}
    </div>
  );
}
