import "./badge-v2.css";
import type { HTMLAttributes, ReactNode } from "react";

export type TagVariant = "neutral" | "accent";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  children?: ReactNode;
}

export function Tag(props: TagProps): JSX.Element {
  const { variant, children, ...rest } = props;
  return (
    <span {...rest} data-component="tag" data-variant={variant ?? "neutral"}>
      {children}
    </span>
  );
}
