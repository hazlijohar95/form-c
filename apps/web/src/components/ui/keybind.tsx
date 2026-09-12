import type { ReactNode } from "react";
import "./keybind.css";

export interface KeybindProps {
  className?: string;
  children: ReactNode;
}

export function Keybind(props: KeybindProps): JSX.Element {
  return (
    <span data-component="keybind" className={props.className}>
      {props.children}
    </span>
  );
}
