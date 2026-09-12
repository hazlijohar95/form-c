import type { SVGProps } from "react";
import "./loader-v2.css";

export interface LoaderV2Props extends SVGProps<SVGSVGElement> {
  width?: number | string;
  height?: number | string;
}

export function LoaderV2(props: LoaderV2Props) {
  const { className, width, height, ["aria-hidden"]: ariaHidden, ...rest } = props;
  return (
    <svg
      {...rest}
      className={className}
      width={width ?? 16}
      height={height ?? 16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-component="loader-v2"
      aria-hidden={ariaHidden ?? "true"}
    >
      <circle cx="8" cy="8" r="6" data-slot="loader-v2-background" strokeWidth="2" />
      <circle
        cx="8"
        cy="8"
        r="6"
        data-slot="loader-v2-progress"
        pathLength={100}
        strokeWidth="2"
        strokeDasharray="33 67"
      />
    </svg>
  );
}
