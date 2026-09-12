import "./radio-v2.css";
import {
  createContext,
  useContext,
  useId,
  type HTMLAttributes,
  type ReactNode,
} from "react";

interface RadioGroupContextValue {
  name: string;
  value: string | null;
  disabled: boolean;
  select: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

function useRadioGroup(): RadioGroupContextValue {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) throw new Error("RadioItemV2 must be used inside RadioGroupV2");
  return ctx;
}

export interface RadioGroupV2Props extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "defaultValue"> {
  label?: ReactNode;
  description?: ReactNode;
  hideLabel?: boolean;
  value?: string | null;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  error?: ReactNode;
  name?: string;
  children?: ReactNode;
}

export function RadioGroupV2(props: RadioGroupV2Props): JSX.Element {
  const {
    label,
    description,
    hideLabel,
    value,
    defaultValue,
    onValueChange,
    disabled,
    invalid,
    error,
    name,
    children,
    ...rest
  } = props;
  const autoName = useId();
  const groupName = name ?? `radio-v2-${autoName.replace(/[^a-zA-Z0-9]/g, "")}`;
  const controlled = Object.hasOwn(props as object, "value");
  // Uncontrolled state is tracked via native radio inputs; only mirror controlled value.
  const current = controlled ? (value ?? null) : null;
  const select = (next: string): void => {
    onValueChange?.(next);
  };
  return (
    <RadioGroupContext.Provider
      value={{ name: groupName, value: current, disabled: disabled ?? false, select }}
    >
      <div
        {...rest}
        role="radiogroup"
        data-component="radio-v2"
        data-disabled={disabled ? "" : undefined}
        data-invalid={invalid || error ? "" : undefined}
      >
        {label ? (
          <div data-slot="radio-v2-label" className={hideLabel === true ? "sr-only" : undefined}>
            {label}
          </div>
        ) : null}
        {description ? <div data-slot="radio-v2-description">{description}</div> : null}
        <div data-slot="radio-v2-items">{children}</div>
        {error ? <div data-slot="radio-v2-error">{error}</div> : null}
      </div>
    </RadioGroupContext.Provider>
  );
}

export interface RadioItemV2Props extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  hideLabel?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
}

export function RadioItemV2(props: RadioItemV2Props): JSX.Element {
  const { value, label, description, hideLabel, checked, defaultChecked, disabled, ...rest } = props;
  const group = useRadioGroup();
  const autoId = useId();
  const inputId = `radio-v2-item-${autoId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const itemDisabled = disabled ?? group.disabled;
  const itemChecked = checked ?? (group.value !== null ? group.value === value : undefined);
  return (
    <div
      {...rest}
      data-slot="radio-v2-item"
      data-checked={itemChecked ? "" : undefined}
      data-disabled={itemDisabled ? "" : undefined}
    >
      <input
        id={inputId}
        type="radio"
        name={group.name}
        value={value}
        data-slot="radio-v2-item-input"
        checked={itemChecked}
        defaultChecked={checked === undefined ? defaultChecked : undefined}
        disabled={itemDisabled}
        onChange={() => group.select(value)}
      />
      <div data-slot="radio-v2-item-control-stack" aria-hidden="true">
        <div data-slot="radio-v2-item-control">
          <span data-slot="radio-v2-item-indicator" />
        </div>
      </div>
      <label
        data-slot="radio-v2-item-label"
        htmlFor={inputId}
        className={hideLabel === true ? "sr-only" : undefined}
      >
        <div data-slot="radio-v2-item-text">
          <span data-slot="radio-v2-item-label-text">{label}</span>
          {description ? (
            <span data-slot="radio-v2-item-description">{description}</span>
          ) : null}
        </div>
      </label>
    </div>
  );
}
