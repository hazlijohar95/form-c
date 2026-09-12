import "./tag.css";
import type { HTMLAttributes, ReactNode } from "react";

export type TagSize = "normal" | "large";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  size?: TagSize;
  children?: ReactNode;
}

export function Tag(props: TagProps): JSX.Element {
  const { size, children, ...rest } = props;
  return (
    <span {...rest} data-component="tag" data-size={size ?? "normal"}>
      {children}
    </span>
  );
}
