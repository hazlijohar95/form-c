import { useEffect, useState } from "react";
import "./typewriter.css";

export interface TypewriterProps {
  text?: string;
  className?: string;
  as?: "p" | "span" | "div";
}

export function Typewriter(props: TypewriterProps): JSX.Element {
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(false);
  const [cursor, setCursor] = useState(true);
  const Tag = props.as ?? "p";

  useEffect(() => {
    const text = props.text;
    if (!text) return;
    let i = 0;
    const timeouts: number[] = [];
    setTyping(true);
    setDisplayed("");
    setCursor(true);

    const getTypingDelay = (): number => {
      const random = Math.random();
      if (random < 0.05) return 150 + Math.random() * 100;
      if (random < 0.15) return 80 + Math.random() * 60;
      return 30 + Math.random() * 50;
    };

    const type = (): void => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
        timeouts.push(window.setTimeout(type, getTypingDelay()));
        return;
      }
      setTyping(false);
      timeouts.push(window.setTimeout(() => setCursor(false), 2000));
    };

    timeouts.push(window.setTimeout(type, 200));
    return () => {
      for (const t of timeouts) window.clearTimeout(t);
    };
  }, [props.text]);

  return (
    <Tag className={props.className} data-component="typewriter">
      {displayed}
      {cursor && <span className={typing ? undefined : "blinking-cursor"}>│</span>}
    </Tag>
  );
}
