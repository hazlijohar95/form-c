import "./checkbox-v2.css";
import { useId, type InputHTMLAttributes, type ReactNode } from "react";

export interface CheckboxV2Props
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> {
  label: ReactNode;
  description?: ReactNode;
  hideLabel?: boolean;
  invalid?: boolean;
  error?: ReactNode;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function CheckboxV2(props: CheckboxV2Props): JSX.Element {
  const {
    label,
    description,
    hideLabel,
    invalid,
    error,
    indeterminate,
    checked,
    defaultChecked,
    disabled,
    onCheckedChange,
    onChange,
    id,
    ...rest
  } = props;
  const autoId = useId();
  const inputId = id ?? `checkbox-v2-${autoId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const controlled = Object.hasOwn(props as object, "checked");
  const isChecked = controlled ? (checked ?? false) : undefined;
  return (
    <div
      data-slot="checkbox-v2"
      data-checked={checked ? "" : undefined}
      data-indeterminate={indeterminate ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-invalid={invalid || error ? "" : undefined}
    >
      <div data-slot="checkbox-v2-row">
        <input
          {...rest}
          id={inputId}
          type="checkbox"
          data-slot="checkbox-v2-input"
          ref={(el) => {
            if (el && typeof indeterminate === "boolean") el.indeterminate = indeterminate;
          }}
          checked={isChecked}
          defaultChecked={controlled ? undefined : defaultChecked}
          disabled={disabled}
          aria-invalid={invalid || error ? true : undefined}
          onChange={(e) => {
            onCheckedChange?.(e.target.checked);
            onChange?.(e);
          }}
        />
        <div data-slot="checkbox-v2-control-stack" aria-hidden="true">
          <div data-slot="checkbox-v2-control">
            <span data-slot="checkbox-v2-indicator">
              <svg
                className="checkbox-v2-icon checkbox-v2-icon--check"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3.53564 8.17857L6.39279 11.75L12.4642 4.25"
                  stroke="#FAFAFA"
                  strokeWidth="1"
                />
              </svg>
              <svg
                className="checkbox-v2-icon checkbox-v2-icon--minus"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M12.75 8H3.25" stroke="#FAFAFA" strokeLinejoin="round" strokeWidth="1" />
              </svg>
            </span>
          </div>
        </div>
        <label
          data-slot="checkbox-v2-label"
          htmlFor={inputId}
          className={hideLabel === true ? "sr-only" : undefined}
        >
          <div data-slot="checkbox-v2-text">
            <span data-slot="checkbox-v2-label-text">{label}</span>
            {description ? (
              <span data-slot="checkbox-v2-description">{description}</span>
            ) : null}
          </div>
        </label>
      </div>
      {error ? <div data-slot="checkbox-v2-error">{error}</div> : null}
    </div>
  );
}
