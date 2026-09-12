import "./project-avatar-v2.css";
import type { HTMLAttributes } from "react";

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

export const PROJECT_AVATAR_VARIANTS = [
  "orange",
  "yellow",
  "cyan",
  "green",
  "red",
  "pink",
  "blue",
  "purple",
  "gray",
] as const;

export type ProjectAvatarVariant = (typeof PROJECT_AVATAR_VARIANTS)[number];

// "outline" is a neutral, muted style (e.g. recently closed projects) and is not part of the color rotation.
export type ProjectAvatarStyle = ProjectAvatarVariant | "outline";

export interface ProjectAvatarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  fallback: string;
  src?: string;
  variant?: ProjectAvatarStyle;
  unread?: boolean;
}

export function ProjectAvatar(props: ProjectAvatarProps): JSX.Element {
  const { fallback, src, variant, unread, ...rest } = props;
  return (
    <div {...rest} data-component="project-avatar-v2" data-unread={unread ? "" : undefined}>
      <div
        data-slot="project-avatar-surface"
        data-variant={variant ?? "gray"}
        data-has-image={src ? "" : undefined}
      >
        {src ? (
          <img src={src} draggable={false} data-slot="project-avatar-image" alt="" />
        ) : (
          first(fallback)
        )}
      </div>
      {unread ? <span data-slot="project-avatar-unread-dot" aria-hidden="true" /> : null}
    </div>
  );
}
