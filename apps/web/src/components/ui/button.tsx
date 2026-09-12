import "./button.css";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonSize = "small" | "normal" | "large";
export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  size?: ButtonSize;
  variant?: ButtonVariant;
  icon?: ReactNode;
  children?: ReactNode;
}

export function Button(props: ButtonProps): JSX.Element {
  const { size, variant, icon, children, className, type, ...rest } = props;
  return (
    <button
      {...rest}
      type={type ?? "button"}
      data-component="button"
      data-size={size ?? "normal"}
      data-variant={variant ?? "secondary"}
      data-icon={icon ? "" : undefined}
      className={className}
    >
      {icon ? <span data-slot="icon-svg" aria-hidden="true">{icon}</span> : null}
      {children}
    </button>
  );
}
