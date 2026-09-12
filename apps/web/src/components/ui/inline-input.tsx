import { useEffect, useRef } from "react";
import "./inline-input.css";

export interface InlineInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  width?: string;
}

export function InlineInput(props: InlineInputProps): JSX.Element {
  const { width, style, ...others } = props;
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof style !== "string") return;
    const el = ref.current;
    if (el === null) return;
    el.style.cssText = width === undefined ? style : `${style};width:${width}`;
  }, [style, width]);

  if (typeof style === "string") {
    return <input ref={ref} data-component="inline-input" {...others} />;
  }
  if (width === undefined) {
    return <input data-component="inline-input" style={style} {...others} />;
  }
  if (style === undefined) {
    return <input data-component="inline-input" style={{ width }} {...others} />;
  }
  return <input data-component="inline-input" style={{ ...style, width }} {...others} />;
}
