import { useEffect, useRef, type ReactNode } from "react";
import "./dialog.css";
import { IconButton } from "./icon-button";

export interface DialogProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  size?: "normal" | "large" | "x-large";
  className?: string;
  fit?: boolean;
  transition?: boolean;
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
}

export function Dialog(props: DialogProps): JSX.Element | null {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!props.open) return;
    const el = ref.current;
    if (!el) return;
    const autofocus = el.querySelector("[autofocus]") as HTMLElement | null;
    if (autofocus) autofocus.focus();
  }, [props.open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (props.open && !el.open) el.showModal();
    if (!props.open && el.open) el.close();
  }, [props.open]);

  if (!props.open) return null;

  const showHeader = props.title !== undefined || props.action !== undefined;

  return (
    <>
      <div data-component="dialog-overlay" aria-hidden="true" />
      <div
        data-component="dialog"
        data-fit={props.fit ? true : undefined}
        data-size={props.size ?? "normal"}
        data-transition={props.transition ? true : undefined}
      >
        <div data-slot="dialog-container">
          <dialog
            ref={ref}
            data-slot="dialog-content"
            className={props.className}
            onCancel={(e) => {
              e.preventDefault();
              props.onClose?.();
            }}
            onClick={(e) => {
              if (e.target === ref.current) props.onClose?.();
            }}
          >
            {showHeader ? (
              <div data-slot="dialog-header">
                {props.title ? <h2 data-slot="dialog-title">{props.title}</h2> : <span />}
                {props.action ?? (
                  <IconButton
                    data-slot="dialog-close-button"
                    icon="close"
                    variant="ghost"
                    aria-label="Close"
                    onClick={() => props.onClose?.()}
                  />
                )}
              </div>
            ) : null}
            {props.description ? <p data-slot="dialog-description">{props.description}</p> : null}
            <div data-slot="dialog-body">{props.children}</div>
          </dialog>
        </div>
      </div>
    </>
  );
}
