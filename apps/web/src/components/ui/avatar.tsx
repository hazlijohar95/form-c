import "./avatar.css";
import type { CSSProperties, HTMLAttributes } from "react";

export type AvatarSize = "small" | "normal" | "large";

export interface AvatarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  fallback: string;
  src?: string;
  background?: string;
  foreground?: string;
  size?: AvatarSize;
}

function firstGrapheme(value: string): string {
  if (!value) return "";
  return Array.from(value)[0] ?? "";
}

export function Avatar(props: AvatarProps): JSX.Element {
  const { fallback, src, background, foreground, size, style, ...rest } = props;
  if (!src) {
    const merged = { ...(style as CSSProperties) } as CSSProperties & Record<string, string>;
    if (background) merged["--avatar-bg"] = background;
    if (foreground) merged["--avatar-fg"] = foreground;
    return (
      <div {...rest} data-component="avatar" data-size={size ?? "normal"} style={merged}>
        {firstGrapheme(fallback)}
      </div>
    );
  }
  return (
    <div {...rest} data-component="avatar" data-size={size ?? "normal"} data-has-image="" style={style}>
      <img src={src} draggable={false} data-slot="avatar-image" alt="" />
    </div>
  );
}
