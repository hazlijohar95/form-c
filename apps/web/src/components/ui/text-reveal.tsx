import { useEffect, useRef, useState } from "react";
import "./text-reveal.css";

function px(value: number | string | undefined, fallback: number): string {
  if (typeof value === "number") return `${value}px`;
  if (typeof value === "string") return value;
  return `${fallback}px`;
}

function ms(value: number | string | undefined, fallback: number): string {
  if (typeof value === "number") return `${value}ms`;
  if (typeof value === "string") return value;
  return `${fallback}ms`;
}

function pct(value: number | undefined, fallback: number): string {
  return `${value ?? fallback}%`;
}

export interface TextRevealProps {
  text?: string;
  className?: string;
  duration?: number | string;
  /** Gradient edge softness as a percentage of the mask (0 = hard wipe, 17 = soft). */
  edge?: number;
  /** Optional small vertical travel for entering text (px). Default 0. */
  travel?: number | string;
  spring?: string;
  springSoft?: string;
  growOnly?: boolean;
  truncate?: boolean;
}

export function TextReveal(props: TextRevealProps): JSX.Element {
  const [cur, setCur] = useState(props.text);
  const [old, setOld] = useState<string | undefined>(undefined);
  const [width, setWidth] = useState("auto");
  const [ready, setReady] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const inRef = useRef<HTMLSpanElement>(null);
  const outRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const frame = useRef<number | undefined>(undefined);
  const prevText = useRef(props.text);
  const growOnly = props.growOnly ?? true;

  useEffect(() => {
    const next = props.text;
    const prev = prevText.current;
    prevText.current = next;
    if (next === prev) return;

    const widen = (pxValue: number): void => {
      if (pxValue <= 0) return;
      setWidth((w) => {
        if (growOnly) {
          const prevNum = Number.parseFloat(w);
          if (Number.isFinite(prevNum) && pxValue <= prevNum) return w;
        }
        return `${pxValue}px`;
      });
    };

    if (typeof next === "string" && typeof prev === "string" && next.startsWith(prev)) {
      setCur(next);
      widen(inRef.current?.scrollWidth ?? 0);
      return;
    }

    setSwapping(true);
    setOld(prev);
    setCur(next);

    if (typeof requestAnimationFrame !== "function") {
      widen(Math.max(inRef.current?.scrollWidth ?? 0, outRef.current?.scrollWidth ?? 0));
      void rootRef.current?.offsetHeight;
      setSwapping(false);
      return;
    }
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const inW = inRef.current?.scrollWidth ?? 0;
      const outW = outRef.current?.scrollWidth ?? 0;
      const target = Math.max(inW, outW);
      if (target > 0) {
        setWidth((w) => {
          if (growOnly) {
            const prevNum = Number.parseFloat(w);
            if (Number.isFinite(prevNum) && target <= prevNum) return w;
          }
          return `${target}px`;
        });
      }
      void rootRef.current?.offsetHeight;
      setSwapping(false);
      frame.current = undefined;
    });

    return () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    };
  }, [props.text, growOnly]);

  useEffect(() => {
    const w = inRef.current?.scrollWidth ?? 0;
    if (w > 0) setWidth(`${w}px`);
    if (typeof requestAnimationFrame !== "function") {
      setReady(true);
      return;
    }
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    if (!fonts) {
      requestAnimationFrame(() => setReady(true));
      return;
    }
    let live = true;
    void fonts.ready.finally(() => {
      if (!live) return;
      const fw = inRef.current?.scrollWidth ?? 0;
      if (fw > 0) setWidth(`${fw}px`);
      requestAnimationFrame(() => {
        if (live) setReady(true);
      });
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <span
      ref={rootRef}
      data-component="text-reveal"
      data-ready={ready ? "true" : "false"}
      data-swapping={swapping ? "true" : "false"}
      data-truncate={props.truncate ? "true" : "false"}
      className={props.className}
      aria-label={props.text ?? ""}
      style={
        {
          "--text-reveal-duration": ms(props.duration, 450),
          "--text-reveal-edge": pct(props.edge, 17),
          "--text-reveal-travel": px(props.travel, 0),
          "--text-reveal-spring": props.spring ?? "cubic-bezier(0.34, 1.08, 0.64, 1)",
          "--text-reveal-spring-soft": props.springSoft ?? "cubic-bezier(0.34, 1, 0.64, 1)",
        } as React.CSSProperties
      }
    >
      <span data-slot="text-reveal-track" style={{ width: props.truncate ? "100%" : width }}>
        <span data-slot="text-reveal-entering" ref={inRef}>
          {cur ?? " "}
        </span>
        <span data-slot="text-reveal-leaving" ref={outRef}>
          {old ?? " "}
        </span>
      </span>
    </span>
  );
}
