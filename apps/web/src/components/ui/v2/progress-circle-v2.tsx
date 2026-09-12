import type { SVGProps } from "react";
import "./progress-circle-v2.css";

export interface ProgressCircleV2Props extends Pick<SVGProps<SVGSVGElement>, "className" | "style"> {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressCircleV2(props: ProgressCircleV2Props) {
  const { percentage, size, strokeWidth, className, ...rest } = props;
  const resolvedSize = size ?? 14;
  const resolvedStroke = strokeWidth ?? 1.5;
  const viewBoxSize = 14;
  const center = viewBoxSize / 2;
  const radius = center - resolvedStroke / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percentage || 0));
  const offset = circumference * (1 - clamped / 100);

  return (
    <svg
      {...rest}
      width={resolvedSize}
      height={resolvedSize}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      fill="none"
      data-component="progress-circle-v2"
      className={className}
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        data-slot="progress-circle-v2-background"
        strokeWidth={resolvedStroke}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        data-slot="progress-circle-v2-progress"
        strokeWidth={resolvedStroke}
        strokeDasharray={circumference.toString()}
        strokeDashoffset={offset}
      />
    </svg>
  );
}
