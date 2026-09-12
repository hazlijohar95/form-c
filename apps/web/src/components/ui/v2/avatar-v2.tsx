import "./avatar-v2.css";
import type { CSSProperties, HTMLAttributes } from "react";

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : undefined;

function first(value: string): string {
  if (!value) return "";
  if (!segmenter) return Array.from(value)[0] ?? "";
  const next = segmenter.segment(value)[Symbol.iterator]().next().value as
    | { segment: string }
    | undefined;
  return next?.segment ?? Array.from(value)[0] ?? "";
}

export type AvatarSize = "small" | "normal" | "large";
export type AvatarKind = "user" | "org";

export interface AvatarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  fallback: string;
  src?: string;
  background?: string;
  foreground?: string;
  size?: AvatarSize;
  kind?: AvatarKind;
}

export function Avatar(props: AvatarProps): JSX.Element {
  const { fallback, src, background, foreground, size, kind, style, ...rest } = props;
  const cssVars: CSSProperties = { ...(style as CSSProperties) };
  if (!src && background) (cssVars as Record<string, string>)["--avatar-bg"] = background;
  if (!src && foreground) (cssVars as Record<string, string>)["--avatar-fg"] = foreground;
  return (
    <div
      {...rest}
      data-component="avatar-v2"
      data-size={size ?? "large"}
      data-kind={kind ?? "user"}
      data-has-image={src ? "" : undefined}
      style={cssVars}
    >
      {src ? <img src={src} draggable={false} data-slot="avatar-image" alt="" /> : first(fallback)}
    </div>
  );
}
