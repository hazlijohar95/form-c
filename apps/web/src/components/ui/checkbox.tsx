import "./checkbox.css";
import { useId } from "react";

export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  className?: string;
  hideLabel?: boolean;
  description?: string;
  error?: string;
  icon?: React.ReactNode;
  onCheckedChange?: (checked: boolean) => void;
  children?: React.ReactNode;
}

function CheckGlyph(): JSX.Element {
  return (
    <svg viewBox="0 0 12 12" fill="none" width="10" height="10" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M3 7.17905L5.02703 8.85135L9 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function Checkbox(props: CheckboxProps): JSX.Element {
  const id = useId();
  const isChecked = props.checked ?? props.defaultChecked ?? false;
  const checkedProps = props.checked !== undefined ? { checked: props.checked } : { defaultChecked: props.defaultChecked };
  return (
    <label
      data-component="checkbox"
      data-checked={isChecked ? "" : undefined}
      data-indeterminate={props.indeterminate ? "" : undefined}
      data-disabled={props.disabled ? "" : undefined}
      data-readonly={props.readOnly ? "" : undefined}
      data-invalid={props.invalid ? "" : undefined}
      className={props.className}
    >
      <input
        {...checkedProps}
        ref={(el) => {
          if (el) el.indeterminate = props.indeterminate ?? false;
        }}
        id={id}
        type="checkbox"
        data-slot="checkbox-checkbox-input"
        disabled={props.disabled}
        readOnly={props.readOnly}
        required={props.required}
        name={props.name}
        value={props.value}
        aria-invalid={props.invalid || undefined}
        onChange={(e) => props.onCheckedChange?.(e.target.checked)}
      />
      <span data-slot="checkbox-checkbox-control" aria-hidden="true">
        <span data-slot="checkbox-checkbox-indicator">{props.icon ?? <CheckGlyph />}</span>
      </span>
      <span data-slot="checkbox-checkbox-content">
        {props.children ? (
          <span data-slot="checkbox-checkbox-label" className={props.hideLabel ? "sr-only" : undefined}>
            {props.children}
          </span>
        ) : null}
        {props.description ? <span data-slot="checkbox-checkbox-description">{props.description}</span> : null}
        {props.error ? <span data-slot="checkbox-checkbox-error">{props.error}</span> : null}
      </span>
    </label>
  );
}
