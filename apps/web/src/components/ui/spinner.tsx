import "./spinner.css";
import type { SVGAttributes } from "react";

export interface SpinnerProps extends SVGAttributes<SVGSVGElement> {
  label?: string;
}

const OUTER = new Set([1, 2, 4, 7, 8, 11, 13, 14]);
const CORNER = new Set([0, 3, 12, 15]);
const DELAYS = [0, 0.4, 0.9, 0, 0.2, 0.7, 1.1, 0.5, 0.1, 0.8, 1.3, 0.3, 0, 1, 0.6, 0];
const DURATIONS = [1.2, 1.6, 1.1, 1, 1.4, 1.8, 1.3, 1.5, 1.2, 1.7, 1.4, 1.6, 1, 1.3, 1.5, 1];

export function Spinner(props: SpinnerProps): JSX.Element {
  const { label, ...rest } = props;
  return (
    <svg
      {...rest}
      viewBox="0 0 15 15"
      data-component="spinner"
      fill="currentColor"
      role={label ? "status" : undefined}
      aria-label={label}
    >
      {Array.from({ length: 16 }, (_, i) => {
        const corner = CORNER.has(i);
        if (corner) return <rect key={i} x={(i % 4) * 4} y={Math.floor(i / 4) * 4} width="3" height="3" rx="1" opacity={0} />;
        return (
          <rect
            key={i}
            x={(i % 4) * 4}
            y={Math.floor(i / 4) * 4}
            width="3"
            height="3"
            rx="1"
            style={{
              animation: `${OUTER.has(i) ? "pulse-opacity-dim" : "pulse-opacity"} ${DURATIONS[i]}s ease-in-out infinite`,
              animationFillMode: "both",
              animationDelay: `${DELAYS[i]}s`,
            }}
          />
        );
      })}
    </svg>
  );
}
