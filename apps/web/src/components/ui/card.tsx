import "./card.css";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export type CardVariant = "normal" | "error" | "warning" | "success" | "info";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children?: ReactNode;
}

function accentFor(variant: CardVariant): string | undefined {
  if (variant === "error") return "var(--critical)";
  if (variant === "warning") return "var(--warning)";
  if (variant === "success") return "var(--success)";
  if (variant === "info") return "var(--interactive)";
  return undefined;
}

export function Card(props: CardProps): JSX.Element {
  const { variant, style, children, ...rest } = props;
  const v = variant ?? "normal";
  const accent = accentFor(v);
  if (!accent) return <div {...rest} data-component="card" data-variant={v}>{children}</div>;
  const merged: CSSProperties = { ...(style as CSSProperties), ["--card-accent" as string]: accent };
  return <div {...rest} data-component="card" data-variant={v} style={merged}>{children}</div>;
}

export function CardTitle(props: HTMLAttributes<HTMLDivElement>): JSX.Element {
  const { children, ...rest } = props;
  return <div {...rest} data-slot="card-title">{children}</div>;
}

export function CardDescription(props: HTMLAttributes<HTMLDivElement>): JSX.Element {
  const { children, ...rest } = props;
  return <div {...rest} data-slot="card-description">{children}</div>;
}

export function CardActions(props: HTMLAttributes<HTMLDivElement>): JSX.Element {
  const { children, ...rest } = props;
  return <div {...rest} data-slot="card-actions">{children}</div>;
}
