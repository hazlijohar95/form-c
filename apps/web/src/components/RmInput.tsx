import { useForm } from "@tanstack/react-form";

function rmError(v: string): string | undefined {
  const s = String(v).replace(/,/g, "").trim();
  if (s === "") return undefined;
  return /^\d+(\.\d{1,2})?$/.test(s) ? undefined : "RM 1,234.56";
}

// TanStack Form RM input at the string→sen Seam. Parent stays source
// of truth — validation displays inline, change patches upward.
export function RmInput(props: {
  value: string;
  on: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}): JSX.Element {
  const form = useForm({ defaultValues: { v: props.value } });
  return (
    <form.Field
      name="v"
      validators={{ onChange: ({ value }) => rmError(String(value)) }}
    >
      {(field) => (
        <div style={{ flex: 1 }}>
          <input
            className="num"
            value={props.value}
            placeholder={props.placeholder}
            disabled={props.disabled}
            onChange={(e) => {
              field.handleChange(e.target.value);
              props.on(e.target.value);
            }}
            onBlur={field.handleBlur}
            style={{ width: "100%" }}
          />
          {field.state.meta.errors.length > 0 && (
            <div className="hint">{String(field.state.meta.errors[0])}</div>
          )}
        </div>
      )}
    </form.Field>
  );
}
