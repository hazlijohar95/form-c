import type { SVGProps } from "react";
import "./divider-v2.css";

export interface DividerV2Props extends SVGProps<HTMLDivElement> {
  className?: string;
}

export function DividerV2(props: DividerV2Props) {
  const { className, ...rest } = props;
  return (
    <div
      {...rest}
      role="separator"
      aria-orientation="horizontal"
      data-component="divider-v2"
      className={className}
    />
  );
}
