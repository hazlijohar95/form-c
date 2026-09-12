import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import "./select.css";
import { Icon } from "./icon";

export interface SelectProps<T> {
  placeholder?: string;
  options: T[];
  current?: T;
  value?: (item: T) => string;
  label?: (item: T) => string;
  groupBy?: (item: T) => string;
  valueClass?: string;
  onSelect?: (value: T | undefined) => void;
  onHighlight?: (value: T | undefined) => (() => void) | void;
  className?: string;
  triggerVariant?: "settings";
  disabled?: boolean;
  children?: (item: T | undefined) => ReactNode;
}

interface Group<T> {
  category: string;
  options: T[];
}

export function Select<T>(props: SelectProps<T>): JSX.Element {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | void>(undefined);
  const keyRef = useRef<string | undefined>(undefined);

  const keyFor = (item: T): string => (props.value ? props.value(item) : String(item));
  const labelFor = (item: T): string => (props.label ? props.label(item) : String(item));

  const groups = useMemo<Group<T>[]>(() => {
    const map = new Map<string, T[]>();
    for (const item of props.options) {
      const category = props.groupBy ? props.groupBy(item) : "";
      const list = map.get(category);
      if (list) list.push(item);
      else map.set(category, [item]);
    }
    return [...map.entries()].map(([category, options]) => ({ category, options }));
  }, [props.options, props.groupBy]);

  const stop = (): void => {
    cleanupRef.current?.();
    cleanupRef.current = undefined;
    keyRef.current = undefined;
  };

  const move = (item: T | undefined): void => {
    if (!props.onHighlight) return;
    if (!item) {
      stop();
      return;
    }
    const key = keyFor(item);
    if (keyRef.current === key) return;
    cleanupRef.current?.();
    cleanupRef.current = props.onHighlight(item);
    keyRef.current = key;
  };

  useEffect(() => {
    return () => stop();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent): void => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setOpen(false);
      stop();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        setOpen(false);
        stop();
      }
    };
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    window.addEventListener("keydown", onKey, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, { capture: true });
      window.removeEventListener("keydown", onKey, { capture: true });
    };
  }, [open]);

  const currentLabel = (): ReactNode => {
    if (!props.current) return props.placeholder ?? "";
    if (props.children) return props.children(props.current);
    return labelFor(props.current);
  };

  const choose = (item: T): void => {
    props.onSelect?.(item);
    stop();
    setHighlight(null);
    setOpen(false);
  };

  return (
    <div ref={rootRef} data-component="select" data-trigger-style={props.triggerVariant} className={props.className}>
      <button
        type="button"
        disabled={props.disabled}
        data-slot="select-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span data-slot="select-select-trigger-value" className={props.valueClass}>
          {currentLabel()}
        </span>
        <span data-slot="select-select-trigger-icon">
          <Icon name={props.triggerVariant === "settings" ? "selector" : "chevron-down"} size="small" />
        </span>
      </button>
      {open ? (
        <div data-component="select-content" data-trigger-style={props.triggerVariant} role="presentation">
          <div data-slot="select-select-content-list" role="listbox">
            {groups.map((group) => (
              <div key={group.category} role="presentation">
                {group.category ? <div data-slot="select-section">{group.category}</div> : null}
                {group.options.map((item) => {
                  const key = keyFor(item);
                  return (
                    <div
                      key={key}
                      role="option"
                      aria-selected={props.current !== undefined && keyFor(props.current) === key}
                      tabIndex={-1}
                      data-slot="select-select-item"
                      data-highlighted={highlight === key ? true : undefined}
                      onPointerEnter={() => {
                        setHighlight(key);
                        move(item);
                      }}
                      onFocus={() => {
                        setHighlight(key);
                        move(item);
                      }}
                      onClick={() => choose(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          choose(item);
                        }
                      }}
                    >
                      <span data-slot="select-select-item-label">
                        {props.children ? props.children(item) : labelFor(item)}
                      </span>
                      {props.current !== undefined && keyFor(props.current) === key ? (
                        <span data-slot="select-select-item-indicator">
                          <Icon name="check-small" size="small" />
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
