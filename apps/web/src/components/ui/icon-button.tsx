import type { ButtonHTMLAttributes } from "react";
import "./icon-button.css";
import { Icon, type IconName, type IconSize } from "./icon";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  size?: "small" | "normal" | "large";
  iconSize?: IconSize;
  variant?: "primary" | "secondary" | "ghost";
}

export function IconButton(props: IconButtonProps): JSX.Element {
  const { icon, size, iconSize, variant, type, ...rest } = props;
  return (
    <button
      type={type ?? "button"}
      {...rest}
      data-component="icon-button"
      data-icon={icon}
      data-size={size ?? "normal"}
      data-variant={variant ?? "secondary"}
    >
      <Icon name={icon} size={iconSize ?? (size === "large" ? "normal" : "small")} />
    </button>
  );
}
