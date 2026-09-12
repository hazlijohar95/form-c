import { useEffect, useRef, useState } from "react";
import "./animated-number.css";

const TRACK = Array.from({ length: 30 }, (_, index) => index % 10);
const DURATION_MS = 600;

function normalize(value: number): number {
  return ((value % 10) + 10) % 10;
}

function spin(from: number, to: number, direction: 1 | -1): number {
  if (from === to) return 0;
  if (direction > 0) return (to - from + 10) % 10;
  return -((from - to + 10) % 10);
}

function Digit(props: { value: number; direction: 1 | -1 }): JSX.Element {
  const [step, setStep] = useState(props.value + 10);
  const [animating, setAnimating] = useState(false);
  const last = useRef(props.value);

  useEffect(() => {
    const delta = spin(last.current, props.value, props.direction);
    last.current = props.value;
    if (!delta) {
      setAnimating(false);
      setStep(props.value + 10);
      return;
    }
    setAnimating(true);
    setStep((v) => v + delta);
  }, [props.value, props.direction]);

  return (
    <span data-slot="animated-number-digit">
      <span
        data-slot="animated-number-strip"
        data-animating={animating ? "true" : "false"}
        onTransitionEnd={() => {
          setAnimating(false);
          setStep((v) => normalize(v) + 10);
        }}
        style={
          {
            "--animated-number-offset": `${step}`,
            "--animated-number-duration": `var(--tool-motion-odometer-ms, ${DURATION_MS}ms)`,
          } as React.CSSProperties
        }
      >
        {TRACK.map((v, i) => (
          <span key={i} data-slot="animated-number-cell">
            {v}
          </span>
        ))}
      </span>
    </span>
  );
}

export function AnimatedNumber(props: { value: number; className?: string }): JSX.Element {
  const target = Number.isFinite(props.value) ? Math.max(0, Math.round(props.value)) : 0;
  const [state, setState] = useState({ value: target, direction: 1 as 1 | -1 });

  useEffect(() => {
    setState((s) => {
      if (target === s.value) return s;
      return { direction: target > s.value ? 1 : -1, value: target };
    });
  }, [target]);

  const label = state.value.toString();
  const digits = Array.from(label, (char) => {
    const code = char.charCodeAt(0) - 48;
    if (code < 0 || code > 9) return 0;
    return code;
  }).reverse();

  return (
    <span data-component="animated-number" className={props.className} aria-label={label}>
      <span
        data-slot="animated-number-value"
        style={{ "--animated-number-width": `${digits.length}ch` } as React.CSSProperties}
      >
        {digits.map((d, i) => (
          <Digit key={`${digits.length}-${i}`} value={d} direction={state.direction} />
        ))}
      </span>
    </span>
  );
}
