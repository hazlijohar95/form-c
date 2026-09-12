import "./progress-circle.css";
import type { SVGAttributes } from "react";

export interface ProgressCircleProps extends Omit<SVGAttributes<SVGSVGElement>, "children"> {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressCircle(props: ProgressCircleProps): JSX.Element {
  const { percentage, size, strokeWidth, ...rest } = props;
  const px = size ?? 16;
  const sw = strokeWidth ?? 3;
  const viewBoxSize = 16;
  const center = viewBoxSize / 2;
  const radius = center - sw / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage || 0));
  const offset = circumference * (1 - clamped / 100);
  return (
    <svg
      {...rest}
      width={px}
      height={px}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      fill="none"
      data-component="progress-circle"
    >
      <circle cx={center} cy={center} r={radius} data-slot="progress-circle-background" strokeWidth={sw} />
      <circle cx={center} cy={center} r={radius} data-slot="progress-circle-background-overlay" strokeWidth={sw} />
      <circle
        cx={center}
        cy={center}
        r={radius}
        data-slot="progress-circle-progress"
        strokeWidth={sw}
        strokeDasharray={circumference.toString()}
        strokeDashoffset={offset}
      />
    </svg>
  );
}
