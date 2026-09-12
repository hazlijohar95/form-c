import { useEffect, useState } from "react";
import "./text-shimmer.css";

export interface TextShimmerProps {
  text: string;
  className?: string;
  as?: "span" | "p" | "div" | "h1" | "h2" | "h3";
  active?: boolean;
  offset?: number;
}

const SWAP_MS = 220;

export function TextShimmer(props: TextShimmerProps): JSX.Element {
  const text = props.text ?? "";
  const active = props.active ?? true;
  const offset = props.offset ?? 0;
  const [run, setRun] = useState(active);
  const Tag = props.as ?? "span";

  useEffect(() => {
    if (active) {
      setRun(true);
      return;
    }
    const timer = window.setTimeout(() => setRun(false), SWAP_MS);
    return () => window.clearTimeout(timer);
  }, [active]);

  return (
    <Tag
      data-component="text-shimmer"
      data-active={active ? "true" : "false"}
      className={props.className}
      aria-label={text}
      style={
        {
          "--text-shimmer-swap": `${SWAP_MS}ms`,
          "--text-shimmer-index": `${offset}`,
        } as React.CSSProperties
      }
    >
      <span data-slot="text-shimmer-char">
        <span data-slot="text-shimmer-char-base" aria-hidden="true">
          {text}
        </span>
        <span data-slot="text-shimmer-char-shimmer" data-run={run ? "true" : "false"} aria-hidden="true">
          {text}
        </span>
      </span>
    </Tag>
  );
}
