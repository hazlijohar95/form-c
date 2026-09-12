import { useEffect, useRef, useState, type ReactNode } from "react";
import "./hover-card.css";

export interface HoverCardProps {
  trigger: ReactNode;
  className?: string;
  openDelay?: number;
  closeDelay?: number;
  children: ReactNode;
}

export function HoverCard(props: HoverCardProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const t = timer.current;
    return () => {
      if (t !== undefined) window.clearTimeout(t);
    };
  }, []);

  const arm = (next: boolean): void => {
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    const delay = next ? (props.openDelay ?? 200) : (props.closeDelay ?? 150);
    timer.current = window.setTimeout(() => setOpen(next), delay);
  };

  return (
    <div data-component="hover-card" style={{ position: "relative", display: "inline-flex", minWidth: 0 }}>
      <div
        data-slot="hover-card-trigger"
        tabIndex={-1}
        onPointerEnter={() => arm(true)}
        onPointerLeave={() => arm(false)}
        onFocus={() => arm(true)}
        onBlur={() => arm(false)}
      >
        {props.trigger}
      </div>
      {open ? (
        <div
          data-component="hover-card-content"
          className={props.className}
          onPointerEnter={() => arm(true)}
          onPointerLeave={() => arm(false)}
        >
          <div data-slot="hover-card-body">{props.children}</div>
        </div>
      ) : null}
    </div>
  );
}
