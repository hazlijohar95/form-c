import type { HTMLAttributes, ReactNode } from "react";
import "./keybind-v2.css";

export interface KeybindV2Props extends HTMLAttributes<HTMLDivElement> {
  keys: string[];
  variant?: "neutral" | "ghost";
}

export function KeybindV2(props: KeybindV2Props) {
  const { keys, variant, className, ...rest } = props;
  if (keys.length === 0) return null;
  return (
    <div {...rest} data-component="keybind-v2" data-variant={variant || "neutral"} className={className}>
      {keys.map((key) => (
        <div key={key} data-slot="keybind-v2-key">
          <span data-slot="keybind-v2-label">{key}</span>
        </div>
      ))}
    </div>
  );
}
