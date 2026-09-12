import type { HTMLAttributes, ReactNode } from "react";
import "./dialog-v2.css";

export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  size?: "normal" | "large" | "x-large";
  variant?: "default" | "settings";
  containerClassName?: string;
  fit?: boolean;
  children?: ReactNode;
}

export interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {
  closeLabel?: string;
  hideClose?: boolean;
  onClose?: () => void;
  children?: ReactNode;
}

export interface DialogTitleGroupProps {
  title?: ReactNode;
  description: ReactNode;
}

export function DialogFooter(props: HTMLAttributes<HTMLDivElement>) {
  const { children, ...rest } = props;
  return (
    <div {...rest} data-slot="dialog-footer">
      {children}
    </div>
  );
}

export function DialogBody(props: HTMLAttributes<HTMLDivElement>) {
  const { className, children, ...rest } = props;
  return (
    <div {...rest} data-slot="dialog-body" className={className}>
      {children}
    </div>
  );
}

export function DialogTitle(props: HTMLAttributes<HTMLHeadingElement>) {
  const { children, ...rest } = props;
  return (
    <h2 {...rest} data-slot="dialog-header-title">
      {children}
    </h2>
  );
}

export function DialogTitleGroup(props: DialogTitleGroupProps) {
  const { title, description } = props;
  return (
    <div data-slot="dialog-title-group">
      {title === undefined || title === null ? null : <h2 data-slot="dialog-title">{title}</h2>}
      <p data-slot="dialog-description">{description}</p>
    </div>
  );
}

export function DialogHeader(props: DialogHeaderProps) {
  const { closeLabel, hideClose, onClose, children, ...rest } = props;
  const hidden = hideClose === true;
  return (
    <div {...rest} data-slot="dialog-header" data-hide-close={hidden ? "" : undefined}>
      {children}
      {hidden ? null : (
        <button
          type="button"
          data-slot="dialog-close-button"
          aria-label={closeLabel ?? "Close"}
          onClick={onClose}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12.4446 3.55469L3.55566 12.4436M3.55566 3.55469L12.4446 12.4436"
              stroke="currentColor"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export function Dialog(props: DialogProps) {
  const { size, variant, className, containerClassName, fit, children, ...rest } = props;

  return (
    <div
      {...rest}
      data-component="dialog-v2"
      data-variant={variant === "settings" ? "settings" : undefined}
      data-fit={fit ? true : undefined}
      data-size={size || "normal"}
    >
      <div data-slot="dialog-container" className={containerClassName}>
        <div data-slot="dialog-content" className={className}>
          {children}
        </div>
      </div>
    </div>
  );
}

export const DialogV2 = Dialog;
