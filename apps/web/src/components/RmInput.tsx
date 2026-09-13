import { useId } from "react";
import { useForm } from "@tanstack/react-form";

export type RmKind = "rm" | "signed" | "pct" | "int" | "year";

const KIND_HINT: Record<RmKind, string> = {
  rm: "Use RM format 1,234.56",
  signed: "Enter an amount like -12,000.50 (negative allowed)",
  pct: "Enter a number from 0 to 100, e.g. 12.5",
  int: "Enter a whole number, e.g. 12",
  year: "Enter a four-digit year, e.g. 2024",
};

/** Shared amount validator (Error at Seam): blank is untouched (valid),
 *  anything else must match the kind. Mirrors lib/rm parseRm for "rm". */
export function validateAmount(kind: RmKind, v: string): string | undefined {
  const s = String(v).replace(/,/g, "").trim();
  if (s === "") return undefined;
  switch (kind) {
    case "rm":
      return /^\d+(\.\d{1,2})?$/.test(s) ? undefined : KIND_HINT.rm;
    case "signed":
      return /^-?\d+(\.\d{1,2})?$/.test(s) ? undefined : KIND_HINT.signed;
    case "pct": {
      if (!/^\d+(\.\d+)?$/.test(s)) return KIND_HINT.pct;
      const n = Number(s);
      return n >= 0 && n <= 100 ? undefined : "Enter a number from 0 to 100";
    }
    case "int":
      return /^\d+$/.test(s) ? undefined : KIND_HINT.int;
    case "year": {
      if (!/^\d{4}$/.test(s)) return KIND_HINT.year;
      const n = Number(s);
      return n >= 1900 && n <= 2100 ? undefined : "Enter a year from 1900 to 2100";
    }
  }
}

export function rmError(v: string): string | undefined {
  return validateAmount("rm", v);
}

// TanStack Form validated input at the string→sen seam. Parent stays
// source of truth — validation displays inline, change patches upward.
// Accessible: label association (sr-only in compact table cells),
// aria-invalid/describedby, polite status error (not assertive: validation
// runs on every keystroke, and role=alert would interrupt typing).
export function RmInput(props: {
  value: string;
  on: (v: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
  kind?: RmKind;
  /** Hide the visual label (header/row context carries meaning); keeps an sr-only label. */
  compact?: boolean;
}): JSX.Element {
  const kind = props.kind ?? "rm";
  const form = useForm({ defaultValues: { v: props.value } });
  const id = useId();
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  const label = props.label ?? "RM";
  return (
    <form.Field
      name="v"
      validators={{ onChange: ({ value }) => validateAmount(kind, String(value)) }}
    >
      {(field) => {
        const err = field.state.meta.errors[0];
        return (
          <div className="rm-wrap">
            <label className={props.compact ? "f sr-only" : "f"} htmlFor={id}>
              {label}
            </label>
            <input
              id={id}
              className="num"
              value={props.value}
              placeholder={props.placeholder}
              disabled={props.disabled}
              inputMode={kind === "int" || kind === "year" ? "numeric" : "decimal"}
              autoComplete="off"
              aria-invalid={err ? true : undefined}
              aria-describedby={err ? errId : props.hint ? hintId : undefined}
              onChange={(e) => {
                field.handleChange(e.target.value);
                props.on(e.target.value);
              }}
              onBlur={field.handleBlur}
            />
            {props.hint && !err && (
              <div className="field-hint" id={hintId}>
                {props.hint}
              </div>
            )}
            {err ? (
              <div className="field-err" id={errId} role="status">
                {String(err)}
              </div>
            ) : null}
          </div>
        );
      }}
    </form.Field>
  );
}
