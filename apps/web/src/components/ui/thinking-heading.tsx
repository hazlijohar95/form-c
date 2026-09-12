import { TextReveal } from "./text-reveal";
import { TextShimmer } from "./text-shimmer";
import "./thinking-heading.css";

export interface ThinkingHeadingProps {
  /** Secondary animated heading beside "Thinking". */
  text?: string;
  active?: boolean;
  className?: string;
  duration?: number | string;
  travel?: number | string;
  edge?: number;
  spring?: string;
  springSoft?: string;
}

export function ThinkingHeading(props: ThinkingHeadingProps): JSX.Element {
  const active = props.active ?? true;
  return (
    <span data-component="thinking-heading" className={props.className}>
      <TextShimmer text="Thinking" active={active} />
      <span data-slot="thinking-heading-detail">
        <TextReveal
          text={props.text}
          duration={props.duration ?? 550}
          travel={props.travel ?? 25}
          edge={props.edge ?? 17}
          spring={props.spring}
          springSoft={props.springSoft}
          growOnly
        />
      </span>
    </span>
  );
}
