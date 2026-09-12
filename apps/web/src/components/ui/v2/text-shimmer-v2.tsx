import { useEffect, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import "./text-shimmer-v2.css";

export interface TextShimmerV2Props {
  text: string;
  className?: string;
  as?: ElementType;
  active?: boolean;
  offset?: number;
}

const SWAP_MS = 220;

export function TextShimmerV2(props: TextShimmerV2Props) {
  const { text, className, as, active, offset } = props;
  const Tag = (as ?? "span") as ElementType;
  const isActive = active ?? true;
  const index = offset ?? 0;
  const [run, setRun] = useState<boolean>(isActive);

  useEffect(() => {
    if (isActive) {
      setRun(true);
      return;
    }
    const timer = setTimeout(() => setRun(false), SWAP_MS);
    return () => clearTimeout(timer);
  }, [isActive]);

  return (
    <Tag
      data-component="text-shimmer-v2"
      data-active={isActive ? "true" : "false"}
      className={className}
      aria-label={text ?? ""}
      style={{ "--_swap": `${SWAP_MS}ms`, "--_index": `${index}` } as CSSProperties}
    >
      <span data-slot="text-shimmer-v2-char">
        <span data-slot="text-shimmer-v2-base" aria-hidden="true">
          {text satisfies ReactNode}
        </span>
        <span data-slot="text-shimmer-v2-shimmer" data-run={run ? "true" : "false"} aria-hidden="true">
          {text satisfies ReactNode}
        </span>
      </span>
    </Tag>
  );
}
