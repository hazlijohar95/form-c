import "./radio-group.css";
import type { ReactNode } from "react";

export type RadioGroupSize = "small" | "medium";

export interface RadioGroupProps<T> {
  options: T[];
  current?: T;
  defaultValue?: T;
  name?: string;
  disabled?: boolean;
  className?: string;
  size?: RadioGroupSize;
  fill?: boolean;
  pad?: "none" | "normal";
  getValue?: (item: T) => string;
  getLabel?: (item: T) => ReactNode;
  onSelect?: (value: T | undefined) => void;
}

export function RadioGroup<T>(props: RadioGroupProps<T>): JSX.Element {
  const toValue = (item: T): string => (props.getValue ? props.getValue(item) : String(item));
  const toLabel = (item: T): ReactNode => (props.getLabel ? props.getLabel(item) : String(item));
  const currentValue = props.current !== undefined ? toValue(props.current) : undefined;
  const defaultValue = props.defaultValue !== undefined ? toValue(props.defaultValue) : undefined;
  const groupName = props.name ?? "radio-group";

  return (
    <div
      data-component="radio-group"
      data-size={props.size ?? "medium"}
      data-fill={props.fill ? "" : undefined}
      data-pad={props.pad ?? "normal"}
      data-disabled={props.disabled ? "" : undefined}
      role="radiogroup"
      className={props.className}
    >
      <div role="presentation" data-slot="radio-group-wrapper">
        <div role="presentation" data-slot="radio-group-items">
          {props.options.map((option) => {
            const value = toValue(option);
            const isChecked = currentValue !== undefined ? value === currentValue : undefined;
            return (
              <label key={value} data-slot="radio-group-item" data-value={value}>
                <input
                  type="radio"
                  name={groupName}
                  value={value}
                  data-slot="radio-group-item-input"
                  data-checked={isChecked ? "" : undefined}
                  checked={isChecked}
                  defaultChecked={isChecked === undefined && defaultValue === value ? true : undefined}
                  disabled={props.disabled}
                  onChange={() => props.onSelect?.(option)}
                />
                <span data-slot="radio-group-item-label">
                  <span data-slot="radio-group-item-control">{toLabel(option)}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
