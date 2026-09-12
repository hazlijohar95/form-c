import { useEffect } from "react";
import "./image-preview.css";

export interface ImagePreviewProps {
  src: string;
  alt?: string;
  open?: boolean;
  closeLabel?: string;
  onClose?: () => void;
}

export function ImagePreview(props: ImagePreviewProps): JSX.Element | null {
  const open = props.open ?? true;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") props.onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, props]);

  if (!open) return null;

  return (
    <div data-component="image-preview" role="dialog" aria-modal="true" aria-label={props.alt ?? "Image preview"}>
      <div data-slot="image-preview-container">
        <div data-slot="image-preview-content">
          <div data-slot="image-preview-header">
            <button
              type="button"
              data-slot="image-preview-close"
              aria-label={props.closeLabel ?? "Close"}
              onClick={props.onClose}
            >
              ✕
            </button>
          </div>
          <div data-slot="image-preview-body">
            <img src={props.src} alt={props.alt ?? "Image preview"} data-slot="image-preview-image" />
          </div>
        </div>
      </div>
    </div>
  );
}
