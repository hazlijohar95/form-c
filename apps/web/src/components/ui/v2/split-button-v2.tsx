import "./split-button-v2.css";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export interface SplitButtonV2Props extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function SplitButtonV2(props: SplitButtonV2Props): JSX.Element {
  const { children, className, ...rest } = props;
  return (
    <div {...rest} data-component="split-button-v2" className={className}>
      {children}
    </div>
  );
}

export interface SplitButtonV2ActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
}

export function SplitButtonV2Action(props: SplitButtonV2ActionProps): JSX.Element {
  const { children, type, className, ...rest } = props;
  return (
    <button
      {...rest}
      type={type ?? "button"}
      data-component="split-button-v2-action"
      className={className}
    >
      {children}
    </button>
  );
}

export interface SplitButtonV2MenuTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
}

export function SplitButtonV2MenuTrigger(props: SplitButtonV2MenuTriggerProps): JSX.Element {
  const { children, type, className, ...rest } = props;
  return (
    <button
      {...rest}
      type={type ?? "button"}
      data-component="split-button-v2-menu-trigger"
      className={className}
    >
      {children ?? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M5 6.5L8 9.5L11 6.5" stroke="currentColor" />
        </svg>
      )}
    </button>
  );
}
