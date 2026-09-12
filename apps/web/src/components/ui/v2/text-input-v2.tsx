import "./text-input-v2.css";
import type { InputHTMLAttributes, MouseEvent as ReactMouseEvent, ReactNode } from "react";

export interface TextInputV2Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> {
  /** Icon or adornment shown before the field value. */
  leadingIcon?: ReactNode;
  /** Show the trailing copy action. */
  showCopyButton?: boolean;
  /** Show the trailing clear action. */
  showClearButton?: boolean;
  /** Accessible label for the copy button. */
  copyLabel?: string;
  /** Accessible label for the clear button. */
  clearLabel?: string;
  onCopyClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  onClearClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  /** Apply tabular numerals to the field value. */
  numeric?: boolean;
  /** Error styling for the field and value text. */
  invalid?: boolean;
  /** `base` is 28px tall; `large` is 32px tall. */
  appearance?: "base" | "large";
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
}

export function TextInputV2(props: TextInputV2Props): JSX.Element {
  const {
    className,
    leadingIcon,
    showCopyButton,
    showClearButton,
    copyLabel,
    clearLabel,
    onCopyClick,
    onClearClick,
    numeric,
    invalid,
    appearance,
    disabled,
    ...inputProps
  } = props;
  const showAction = showClearButton === true || showCopyButton === true;
  return (
    <div
      data-component="text-input-v2"
      data-disabled={disabled ? "" : undefined}
      data-invalid={invalid ? "" : undefined}
      data-numeric={numeric ? "" : undefined}
      data-appearance={appearance ?? "base"}
      data-leading-icon={leadingIcon ? "" : undefined}
      className={className}
    >
      <div data-slot="text-input-v2-value">
        {leadingIcon ? <span data-slot="text-input-v2-leading-icon">{leadingIcon}</span> : null}
        <input
          {...inputProps}
          type={inputProps.type ?? "text"}
          disabled={disabled}
          aria-invalid={invalid ? true : undefined}
          data-slot="text-input-v2-input"
        />
      </div>
      {showAction ? (
        <button
          type="button"
          data-slot="text-input-v2-icon-button"
          data-variant={showClearButton ? "clear" : "copy"}
          aria-label={showClearButton ? (clearLabel ?? "Clear") : (copyLabel ?? "Copy")}
          disabled={disabled}
          onMouseDown={(event) => {
            if (showClearButton !== true) return;
            event.preventDefault();
          }}
          onClick={(event) => {
            if (showClearButton === true) {
              onClearClick?.(event);
              return;
            }
            onCopyClick?.(event);
          }}
        >
          {showClearButton ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4.25 11.75L11.75 4.25M11.75 11.75L4.25 4.25" stroke="currentColor" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M4.14908 11.0081H1.76282V1.51758H9.1038V2.55588M14.2225 4.99681H6.75397V14.4873H14.2225V4.99681Z"
                stroke="currentColor"
              />
            </svg>
          )}
        </button>
      ) : null}
    </div>
  );
}
