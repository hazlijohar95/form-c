import "./segmented-control-v2.css";
import {
  createContext,
  useContext,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";

type OnChange = (value: string | null) => void;

interface SegmentedControlContextValue {
  selected: string | null;
  groupDisabled: boolean;
  select: (value: string) => void;
  clearIfAllowed: (value: string) => void;
  focusNext: (from: HTMLButtonElement, direction: 1 | -1) => void;
}

const SegmentedControlContext = createContext<SegmentedControlContextValue | null>(null);

function useSegmentedControlContext(): SegmentedControlContextValue {
  const ctx = useContext(SegmentedControlContext);
  if (!ctx) throw new Error("SegmentedControlItemV2 must be used inside SegmentedControlV2");
  return ctx;
}

export interface SegmentedControlV2Props
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Selected value when controlled (including `null` when empty). Omit key for uncontrolled. */
  value?: string | null;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  onChange?: OnChange;
  /** When true, clicking the active segment clears selection (`onChange(null)`). Default false. */
  allowDeselect?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}

export function SegmentedControlV2(props: SegmentedControlV2Props): JSX.Element {
  const {
    children,
    value,
    defaultValue,
    onChange,
    allowDeselect,
    disabled,
    className,
    ...rest
  } = props;
  const controlled = Object.hasOwn(props as object, "value");
  const [internal, setInternal] = useState<string | null>(defaultValue ?? null);
  const selected = controlled ? (value ?? null) : internal;

  const setSelected = (next: string | null): void => {
    if (!controlled) setInternal(next);
    onChange?.(next);
  };

  const select = (next: string): void => {
    setSelected(next);
  };

  const clearIfAllowed = (val: string): void => {
    if (!allowDeselect || selected !== val) return;
    setSelected(null);
  };

  const focusNext = (from: HTMLButtonElement, direction: 1 | -1): void => {
    const root = from.closest(`[data-slot="segmented-control-v2"]`);
    if (!root) return;
    const buttons = Array.from(
      root.querySelectorAll<HTMLButtonElement>(`button[data-slot="segmented-control-v2-item"]`),
    ).filter((b) => !b.disabled);
    const i = buttons.indexOf(from);
    const next = buttons[i + direction];
    next?.focus();
  };

  return (
    <SegmentedControlContext.Provider
      value={{ selected, groupDisabled: disabled ?? false, select, clearIfAllowed, focusNext }}
    >
      <div
        {...rest}
        role="group"
        data-component="segmented-control-v2"
        data-slot="segmented-control-v2"
        data-disabled={disabled ? "" : undefined}
        className={className}
      >
        {children}
      </div>
    </SegmentedControlContext.Provider>
  );
}

export interface SegmentedControlItemV2Props
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children"> {
  value: string;
  children: ReactNode;
}

export function SegmentedControlItemV2(props: SegmentedControlItemV2Props): JSX.Element {
  const { children, value, disabled, onClick, onKeyDown, className, ...rest } = props;
  const ctx = useSegmentedControlContext();
  const pressed = ctx.selected === value;
  const isDisabled = ctx.groupDisabled || (disabled ?? false);

  return (
    <button
      {...rest}
      type="button"
      data-slot="segmented-control-v2-item"
      data-pressed={pressed ? "" : undefined}
      aria-pressed={pressed}
      disabled={isDisabled}
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || isDisabled) return;
        if (pressed) ctx.clearIfAllowed(value);
        else ctx.select(value);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented || isDisabled) return;
        const t = e.currentTarget;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          ctx.focusNext(t, 1);
          return;
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          ctx.focusNext(t, -1);
          return;
        }
        if (e.key === "Home") {
          e.preventDefault();
          const root = t.closest(`[data-slot="segmented-control-v2"]`);
          const first = root?.querySelector<HTMLButtonElement>(
            `button[data-slot="segmented-control-v2-item"]:not(:disabled)`,
          );
          first?.focus();
          return;
        }
        if (e.key === "End") {
          e.preventDefault();
          const root = t.closest(`[data-slot="segmented-control-v2"]`);
          const buttons = root?.querySelectorAll<HTMLButtonElement>(
            `button[data-slot="segmented-control-v2-item"]:not(:disabled)`,
          );
          const last = buttons?.[buttons.length - 1];
          last?.focus();
        }
      }}
    >
      <span data-slot="segmented-control-v2-item-label">{children}</span>
    </button>
  );
}
