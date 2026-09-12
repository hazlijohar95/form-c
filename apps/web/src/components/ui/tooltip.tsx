import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import "./tooltip.css";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  value: ReactNode;
  className?: string;
  contentClass?: string;
  contentStyle?: CSSProperties;
  inactive?: boolean;
  forceOpen?: boolean;
  placement?: TooltipPlacement;
  openDelay?: number;
  children: ReactNode;
}

export interface TooltipKeybindProps extends Omit<TooltipProps, "value"> {
  title: string;
  keybind: string;
}

export function TooltipKeybind(props: TooltipKeybindProps): JSX.Element {
  const { title, keybind, ...rest } = props;
  return (
    <Tooltip
      {...rest}
      value={
        <div data-slot="tooltip-keybind">
          <span>{title}</span>
          <span data-slot="tooltip-keybind-key">{keybind}</span>
        </div>
      }
    />
  );
}

export function Tooltip(props: TooltipProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const t = timer.current;
    return () => {
      if (t !== undefined) window.clearTimeout(t);
    };
  }, []);

  if (props.inactive) return <>{props.children}</>;

  const show = (): void => {
    if (props.forceOpen) return;
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), props.openDelay ?? 400);
  };

  const hide = (): void => {
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    setOpen(false);
  };

  const visible = props.forceOpen === true || open;

  return (
    <div
      data-component="tooltip-trigger"
      className={props.className}
      style={{ position: "relative", display: "inline-flex" }}
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {props.children}
      {visible ? (
        <div
          role="tooltip"
          data-component="tooltip"
          data-placement={props.placement ?? "top"}
          data-force-open={props.forceOpen}
          className={props.contentClass}
          style={props.contentStyle}
        >
          {props.value}
        </div>
      ) : null}
    </div>
  );
}
