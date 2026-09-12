import "./switch-v2.css";
import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  invalid?: boolean;
  error?: ReactNode;
  hideLabel?: boolean;
  children?: ReactNode;
}

export function Switch(props: SwitchProps): JSX.Element {
  const {
    checked,
    defaultChecked,
    onCheckedChange,
    disabled,
    invalid,
    error,
    hideLabel,
    children,
    className,
    onClick,
    ...rest
  } = props;
  const controlled = Object.hasOwn(props as object, "checked");
  const [internal, setInternal] = useState(defaultChecked ?? false);
  const showChecked = controlled ? (checked ?? false) : internal;
  return (
    <span
      data-component="switch"
      data-checked={showChecked ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-invalid={invalid || error ? "" : undefined}
      className={className}
    >
      <button
        {...rest}
        type="button"
        role="switch"
        aria-checked={showChecked}
        data-slot="switch-input"
        disabled={disabled}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented || disabled === true) return;
          if (!controlled) setInternal(!showChecked);
          onCheckedChange?.(!showChecked);
        }}
      />
      {children ? (
        <span data-slot="switch-label" className={hideLabel === true ? "sr-only" : undefined}>
          {children}
        </span>
      ) : null}
      <span data-slot="switch-control" aria-hidden="true">
        <span data-slot="switch-thumb" />
      </span>
      {error ? <span data-slot="switch-error">{error}</span> : null}
    </span>
  );
}
