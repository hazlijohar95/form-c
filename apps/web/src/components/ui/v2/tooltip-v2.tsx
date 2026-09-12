import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import "./tooltip-v2.css";

export interface TooltipV2Props extends HTMLAttributes<HTMLDivElement> {
  value: ReactNode;
  contentClassName?: string;
  contentStyle?: CSSProperties;
  inactive?: boolean;
  forceOpen?: boolean;
  placement?: "top" | "bottom" | "left" | "right";
  children?: ReactNode;
}

const OPEN_DELAY_MS = 400;

export function TooltipV2(props: TooltipV2Props) {
  const { value, contentClassName, contentStyle, inactive, forceOpen, placement, children, className, ...rest } = props;
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [open, setOpen] = useState(false);

  const clearTimer = useCallback(() => {
    if (timer.current === undefined) return;
    clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  if (inactive) return <>{children}</>;

  const show = () => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
  };
  const hide = () => {
    clearTimer();
    setOpen(false);
  };
  const visible = forceOpen === true || open;

  return (
    <div
      {...rest}
      ref={triggerRef}
      data-component="tooltip-v2-trigger"
      className={className}
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible ? (
        <div
          role="tooltip"
          data-component="tooltip-v2"
          data-placement={placement}
          data-force-open={forceOpen}
          className={contentClassName}
          style={contentStyle}
        >
          {value}
        </div>
      ) : null}
    </div>
  );
}
