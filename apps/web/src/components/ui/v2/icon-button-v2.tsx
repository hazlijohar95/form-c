import "./icon-button-v2.css";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type IconButtonV2Size = "small" | "normal" | "large";
export type IconButtonV2Variant = "neutral" | "contrast" | "ghost" | "ghost-muted";
export type IconButtonV2State = "rest" | "hover" | "pressed";

export interface IconButtonV2Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon?: ReactNode;
  size?: IconButtonV2Size;
  variant?: IconButtonV2Variant;
  state?: IconButtonV2State;
  children?: ReactNode;
}

export function IconButtonV2(props: IconButtonV2Props): JSX.Element {
  const { icon, size, variant, state, children, type, ...rest } = props;
  return (
    <button
      {...rest}
      type={type ?? "button"}
      data-component="icon-button-v2"
      data-size={size ?? "normal"}
      data-variant={variant ?? "neutral"}
      data-state={state}
    >
      {icon ? (
        <span data-slot="icon-button-v2-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}
