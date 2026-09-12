import "./textarea-v2.css";
import type { TextareaHTMLAttributes } from "react";

export interface TextareaV2Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Error styling for the field and value text. */
  invalid?: boolean;
}

export function TextareaV2(props: TextareaV2Props): JSX.Element {
  const { className, invalid, disabled, rows, ...textareaProps } = props;
  return (
    <div
      data-component="textarea-v2"
      data-disabled={disabled ? "" : undefined}
      data-invalid={invalid ? "" : undefined}
      className={className}
    >
      <textarea
        {...textareaProps}
        rows={rows ?? 3}
        disabled={disabled}
        aria-invalid={invalid ? true : undefined}
        data-slot="textarea-v2-textarea"
      />
    </div>
  );
}
