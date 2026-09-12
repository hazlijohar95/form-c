import "./button-v2.css";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonV2Size = "small" | "normal" | "large";
export type ButtonV2Variant =
  | "neutral"
  | "danger"
  | "warning"
  | "outline"
  | "contrast"
  | "ghost"
  | "ghost-muted"
  | "loading";

export interface ButtonV2Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  size?: ButtonV2Size;
  variant?: ButtonV2Variant;
  icon?: ReactNode;
  children?: ReactNode;
}

export function ButtonV2(props: ButtonV2Props): JSX.Element {
  const { size, variant, icon, children, type, ...rest } = props;
  return (
    <button
      {...rest}
      type={type ?? "button"}
      data-component="button-v2"
      data-size={size ?? "normal"}
      data-variant={variant ?? "neutral"}
      data-icon={icon ? "" : undefined}
    >
      {icon ? (
        <span data-slot="button-v2-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}
