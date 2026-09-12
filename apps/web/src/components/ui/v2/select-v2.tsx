import "./select-v2.css";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";

function groupOptions<T>(options: T[], groupBy?: (x: T) => string): { category: string; options: T[] }[] {
  if (!groupBy) return [{ category: "", options }];
  const map = new Map<string, T[]>();
  for (const opt of options) {
    const key = groupBy(opt);
    const arr = map.get(key);
    if (arr) arr.push(opt);
    else map.set(key, [opt]);
  }
  return [...map.entries()].map(([category, opts]) => ({ category, options: opts }));
}

function ChevronDown(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M11 9.5L8 6.5L5 9.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckSmall(): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M3.53564 8.17857L6.39279 11.75L12.4642 4.25"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface SelectV2Props<T>
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "defaultValue" | "onSelect"> {
  placeholder?: string;
  options: T[];
  /** Selected option (single selection). */
  current?: T;
  value?: (x: T) => string;
  label?: (x: T) => string;
  groupBy?: (x: T) => string;
  onSelect?: (value: T | null) => void;
  onHighlight?: (value: T | undefined) => void | (() => void);
  /** `base` / `large` match text-input-v2; `inline` is a compact settings-row trigger. */
  appearance?: "base" | "large" | "inline";
  invalid?: boolean;
  numeric?: boolean;
  children?: (item: T) => ReactNode;
  valueClass?: string;
  disabled?: boolean;
}

export function SelectV2<T>(props: SelectV2Props<T>): JSX.Element {
  const {
    className,
    placeholder,
    options,
    current,
    value,
    label,
    groupBy,
    onSelect,
    onHighlight,
    appearance,
    invalid,
    numeric,
    children,
    valueClass,
    disabled,
    ...rest
  } = props;
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);

  const keyFor = (item: T): string => (value ? value(item) : String(item as string));
  const labelFor = (item: T): string => (label ? label(item) : String(item as string));

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const grouped = groupOptions(options, groupBy);
  const selectedLabel = current != null ? labelFor(current) : "";
  const inline = (appearance ?? "base") === "inline";

  const move = (item: T | undefined): void => {
    if (!onHighlight) return;
    if (!item) {
      onHighlight(undefined);
      setHighlightKey(null);
      return;
    }
    const key = keyFor(item);
    if (highlightKey === key) return;
    onHighlight(item);
    setHighlightKey(key);
  };

  const pick = (item: T): void => {
    onSelect?.(item);
    setOpen(false);
  };

  return (
    <div ref={rootRef} {...rest} data-component="select-v2-root" className={className}>
      <button
        type="button"
        data-component="select-v2"
        data-appearance={appearance ?? "base"}
        data-invalid={invalid ? "" : undefined}
        data-numeric={numeric ? "" : undefined}
        data-expanded={open ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          if (disabled === true) return;
          setOpen((o) => !o);
        }}
      >
        <div data-slot="select-v2-value">
          <span
            data-slot="select-v2-value-text"
            data-placeholder-shown={current == null && placeholder ? "" : undefined}
            className={valueClass}
          >
            {current != null ? selectedLabel : (placeholder ?? "")}
          </span>
        </div>
        <span data-slot="select-v2-chevron" aria-hidden="true">
          <ChevronDown />
        </span>
      </button>
      {open && !inline ? (
        <div data-component="menu-v2-content" data-slot="select-v2-content" role="presentation">
          <ul data-slot="select-v2-listbox" role="listbox" id={listboxId}>
            {grouped.map((group) => (
              <li key={group.category || "__ungrouped"} role="presentation">
                {group.category ? (
                  <div data-slot="menu-v2-group-label">{group.category}</div>
                ) : null}
                {group.options.map((item) => {
                  const key = keyFor(item);
                  const selected = current != null && keyFor(current) === key;
                  return (
                    <li
                      key={key}
                      role="option"
                      aria-selected={selected}
                      data-component="menu-v2-item"
                      data-selected={selected ? "" : undefined}
                      data-highlighted={highlightKey === key ? "" : undefined}
                      tabIndex={-1}
                      onPointerEnter={() => move(item)}
                      onPointerMove={() => move(item)}
                      onFocus={() => move(item)}
                      onClick={() => pick(item)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.preventDefault();
                        pick(item);
                      }}
                    >
                      <span data-slot="menu-v2-item-content">
                        {children ? children(item) : labelFor(item)}
                      </span>
                      <span data-slot="menu-v2-item-indicator" aria-hidden="true">
                        <CheckSmall />
                      </span>
                    </li>
                  );
                })}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {open && inline ? (
        <div data-component="menu-v2-content" data-slot="select-v2-content" role="presentation">
          <ul data-slot="select-v2-listbox" role="listbox" id={listboxId}>
            {options.map((item) => {
              const key = keyFor(item);
              const selected = current != null && keyFor(current) === key;
              return (
                <li
                  key={key}
                  role="option"
                  aria-selected={selected}
                  data-component="menu-v2-item"
                  data-selected={selected ? "" : undefined}
                  tabIndex={-1}
                  onClick={() => pick(item)}
                >
                  <span data-slot="menu-v2-item-content">
                    {children ? children(item) : labelFor(item)}
                  </span>
                  <span data-slot="menu-v2-item-indicator" aria-hidden="true">
                    <CheckSmall />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
