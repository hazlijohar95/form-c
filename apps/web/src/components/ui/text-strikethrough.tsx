import { useEffect, useRef, useState } from "react";
import { useSpring } from "./motion-spring";
import "./text-strikethrough.css";

export interface TextStrikethroughProps {
  /** Whether the strikethrough is active (line drawn across). */
  active: boolean;
  /** The text to display. Rendered twice internally (base + decoration overlay). */
  text: string;
  /** Spring visual duration in seconds. Default 0.35. */
  visualDuration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function TextStrikethrough(props: TextStrikethroughProps): JSX.Element {
  const progress = useSpring(() => (props.active ? 1 : 0), () => ({
    visualDuration: props.visualDuration ?? 0.35,
    bounce: 0,
  }));
  const baseRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const [sizes, setSizes] = useState({ textWidth: 0, containerWidth: 0 });

  useEffect(() => {
    const measure = (): void => {
      setSizes({
        textWidth: baseRef.current?.scrollWidth ?? 0,
        containerWidth: containerRef.current?.offsetWidth ?? 0,
      });
    };
    measure();
    const target = containerRef.current;
    if (target === null || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(target);
    return () => ro.disconnect();
  }, [props.text]);

  const { textWidth, containerWidth } = sizes;
  const revealedPx = textWidth > 0 ? progress * textWidth : 0;

  let overlayClip = `inset(0 ${(1 - progress) * 100}% 0 0)`;
  if (containerWidth > 0 && textWidth > 0) {
    const remaining = Math.max(0, containerWidth - revealedPx);
    overlayClip = `inset(0 ${remaining}px 0 0)`;
  }
  const baseClip = revealedPx <= 0.5 ? "none" : `inset(0 0 0 ${revealedPx}px)`;

  return (
    <span
      data-component="text-strikethrough"
      className={props.className}
      style={{ display: "grid", ...props.style }}
      ref={containerRef}
    >
      <span ref={baseRef} style={{ gridArea: "1 / 1", clipPath: baseClip }}>
        {props.text}
      </span>
      <span
        aria-hidden="true"
        data-slot="text-strikethrough-line"
        style={{
          gridArea: "1 / 1",
          textDecoration: "line-through",
          pointerEvents: "none",
          clipPath: overlayClip,
        }}
      >
        {props.text}
      </span>
    </span>
  );
}
