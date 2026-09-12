import "./switch.css";
import { useId } from "react";

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
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
  onCheckedChange?: (checked: boolean) => void;
  children?: React.ReactNode;
}

export function Switch(props: SwitchProps): JSX.Element {
  const id = useId();
  const checkedProps = props.checked !== undefined ? { checked: props.checked } : { defaultChecked: props.defaultChecked };
  return (
    <label
      data-component="switch"
      data-checked={props.checked ?? props.defaultChecked ? "" : undefined}
      data-disabled={props.disabled ? "" : undefined}
      data-readonly={props.readOnly ? "" : undefined}
      data-invalid={props.invalid ? "" : undefined}
      className={props.className}
    >
      <input
        {...checkedProps}
        id={id}
        type="checkbox"
        role="switch"
        data-slot="switch-input"
        disabled={props.disabled}
        readOnly={props.readOnly}
        required={props.required}
        name={props.name}
        value={props.value}
        aria-invalid={props.invalid || undefined}
        onChange={(e) => props.onCheckedChange?.(e.target.checked)}
      />
      {props.children ? (
        <span data-slot="switch-label" className={props.hideLabel ? "sr-only" : undefined}>
          {props.children}
        </span>
      ) : null}
      {props.description ? <span data-slot="switch-description">{props.description}</span> : null}
      {props.error ? <span data-slot="switch-error">{props.error}</span> : null}
      <span data-slot="switch-control" aria-hidden="true">
        <span data-slot="switch-thumb" />
      </span>
    </label>
  );
}
