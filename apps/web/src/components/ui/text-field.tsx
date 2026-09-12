import { useId, useState } from "react";
import { copyText } from "../../lib/clipboard.js";
import "./text-field.css";

export interface TextFieldProps {
  label?: string;
  hideLabel?: boolean;
  description?: string;
  error?: string;
  variant?: "normal" | "ghost";
  copyable?: boolean;
  copyKind?: "clipboard" | "link";
  multiline?: boolean;
  name?: string;
  defaultValue?: string;
  value?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  className?: string;
  onChange?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function TextField(props: TextFieldProps): JSX.Element {
  const id = useId();
  const descId = `${id}-desc`;
  const errId = `${id}-err`;
  const [copied, setCopied] = useState(false);
  const variant = props.variant ?? "normal";
  const invalid = props.error !== undefined && props.error !== "";

  if (variant === "ghost") {
    return (
      <div data-component="input" data-variant="ghost">
        {props.multiline ? (
          <textarea
            id={id}
            data-slot="input-input"
            className={props.className}
            name={props.name}
            defaultValue={props.defaultValue}
            value={props.value}
            placeholder={props.placeholder}
            disabled={props.disabled}
            readOnly={props.readOnly}
            required={props.required}
            aria-label={props.label}
            aria-invalid={invalid || undefined}
            onChange={(e) => props.onChange?.(e.target.value)}
            onKeyDown={props.onKeyDown}
          />
        ) : (
          <input
            id={id}
            data-slot="input-input"
            className={props.className}
            type={props.type ?? "text"}
            name={props.name}
            defaultValue={props.defaultValue}
            value={props.value}
            placeholder={props.placeholder}
            disabled={props.disabled}
            readOnly={props.readOnly}
            required={props.required}
            aria-label={props.label}
            aria-invalid={invalid || undefined}
            onChange={(e) => props.onChange?.(e.target.value)}
            onKeyDown={props.onKeyDown}
          />
        )}
      </div>
    );
  }

  const copyLabel = copied ? "Copied" : props.copyKind === "link" ? "Copy link" : "Copy to clipboard";

  function handleCopy(): void {
    const value = props.value ?? props.defaultValue ?? "";
    void copyText(value).then((ok) => {
      if (!ok) return;
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }

  const describedBy = [props.description ? descId : null, invalid ? errId : null]
    .filter((x): x is string => x !== null)
    .join(" ");

  return (
    <div data-component="input" data-variant="normal">
      {props.label && (
        <label data-slot="input-label" className={props.hideLabel ? "sr-only" : undefined} htmlFor={id}>
          {props.label}
        </label>
      )}
      <div data-slot="input-wrapper">
        {props.multiline ? (
          <textarea
            id={id}
            data-slot="input-input"
            className={props.className}
            name={props.name}
            defaultValue={props.defaultValue}
            value={props.value}
            placeholder={props.placeholder}
            disabled={props.disabled}
            readOnly={props.readOnly}
            required={props.required}
            data-invalid={invalid || undefined}
            data-readonly={props.readOnly || undefined}
            aria-describedby={describedBy || undefined}
            onChange={(e) => props.onChange?.(e.target.value)}
            onKeyDown={props.onKeyDown}
          />
        ) : (
          <input
            id={id}
            data-slot="input-input"
            className={props.className}
            type={props.type ?? "text"}
            name={props.name}
            defaultValue={props.defaultValue}
            value={props.value}
            placeholder={props.placeholder}
            disabled={props.disabled}
            readOnly={props.readOnly || props.copyable || undefined}
            required={props.required}
            data-invalid={invalid || undefined}
            data-readonly={props.readOnly || props.copyable || undefined}
            aria-describedby={describedBy || undefined}
            onClick={props.copyable ? handleCopy : undefined}
            onChange={(e) => props.onChange?.(e.target.value)}
            onKeyDown={props.onKeyDown}
          />
        )}
        {props.copyable && (
          <button
            type="button"
            data-slot="input-copy-button"
            aria-label={copyLabel}
            title={copyLabel}
            tabIndex={-1}
            onClick={handleCopy}
          >
            {copied ? "✓" : props.copyKind === "link" ? "🔗" : "⧉"}
          </button>
        )}
      </div>
      {props.description && <div data-slot="input-description" id={descId}>{props.description}</div>}
      {invalid && (
        <div data-slot="input-error" id={errId} role="alert">
          {props.error}
        </div>
      )}
    </div>
  );
}
