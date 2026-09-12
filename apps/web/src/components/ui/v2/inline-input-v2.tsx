import "./inline-input-v2.css";
import {
  useRef,
  type CSSProperties,
  type InputHTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";

export interface InlineInputV2Props
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "prefix" | "children"> {
  /** Inline label shown before the field (prefix segment). */
  prefix: ReactNode;
  /** Fixed width for the prefix segment (px number or CSS length). Omit for fit-content. */
  labelWidth?: number | string;
  /** Show the trailing copy action. */
  showCopyButton?: boolean;
  /** Accessible label for the copy button. */
  copyLabel?: string;
  onCopyClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  /** Apply tabular numerals to the prefix and field value. */
  numeric?: boolean;
  /** Error styling for the field and value text. */
  invalid?: boolean;
  /** `base` is 28px tall; `large` is 32px tall. */
  appearance?: "base" | "large";
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
}

export function InlineInputV2(props: InlineInputV2Props): JSX.Element {
  const {
    className,
    style,
    prefix,
    labelWidth,
    showCopyButton,
    copyLabel,
    onCopyClick,
    numeric,
    invalid,
    appearance,
    disabled,
    ...inputProps
  } = props;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cssVars: CSSProperties = { ...(style as CSSProperties) };
  if (labelWidth != null) {
    (cssVars as Record<string, string>)["--inline-input-v2-label-width"] =
      typeof labelWidth === "number" ? `${labelWidth}px` : labelWidth;
  }
  return (
    <div
      data-component="inline-input-v2"
      data-disabled={disabled ? "" : undefined}
      data-invalid={invalid ? "" : undefined}
      data-numeric={numeric ? "" : undefined}
      data-appearance={appearance ?? "base"}
      data-label-width={labelWidth != null ? "" : undefined}
      className={className}
      style={cssVars}
    >
      <div
        data-slot="inline-input-v2-prefix"
        onMouseDown={(event) => {
          if (disabled === true || event.button !== 0) return;
          // Keep focus on the input without using a native <label>, so external labels still work.
          event.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <span data-slot="inline-input-v2-prefix-text">{prefix}</span>
      </div>
      <div data-slot="inline-input-v2-divider" aria-hidden="true" />
      <div data-slot="inline-input-v2-field">
        <div data-slot="inline-input-v2-value">
          <input
            {...inputProps}
            ref={inputRef}
            type={inputProps.type ?? "text"}
            disabled={disabled}
            aria-invalid={invalid ? true : undefined}
            data-slot="inline-input-v2-input"
          />
        </div>
        {showCopyButton === true ? (
          <button
            type="button"
            data-slot="inline-input-v2-icon-button"
            aria-label={copyLabel ?? "Copy"}
            disabled={disabled}
            onClick={onCopyClick}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M4.14908 11.0081H1.76282V1.51758H9.1038V2.55588M14.2225 4.99681H6.75397V14.4873H14.2225V4.99681Z"
                stroke="currentColor"
              />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}
