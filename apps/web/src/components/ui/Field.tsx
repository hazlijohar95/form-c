import { useId } from "react";

export function Field(props: {
  label: string;
  value: string;
  on: (v: string) => void;
  mono?: boolean;
  hint?: string;
  type?: string;
  required?: boolean;
}): JSX.Element {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div>
      <label className="f" htmlFor={id}>
        {props.label} {props.required && <span className="req" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        type={props.type ?? "text"}
        className={props.mono ? "num" : ""}
        value={props.value}
        required={props.required}
        autoComplete="off"
        aria-describedby={props.hint ? hintId : undefined}
        onChange={(e) => props.on(e.target.value)}
      />
      {props.hint && (
        <div className="field-hint" id={hintId}>
          {props.hint}
        </div>
      )}
    </div>
  );
}
