import "./field-v2.css";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
} from "react";

interface FieldContextValue {
  controlId: string;
  labelId: string;
  prefixId: string;
  suffixId: string;
  invalid: boolean;
  registerPrefix: () => void;
  unregisterPrefix: () => void;
  registerSuffix: () => void;
  unregisterSuffix: () => void;
}

const FieldContext = createContext<FieldContextValue | null>(null);

function useField(): FieldContextValue {
  const ctx = useContext(FieldContext);
  if (!ctx) throw new Error("Field subcomponents must be used within <FieldV2>");
  return ctx;
}

const CONTROL_SELECTOR = [
  "[data-slot='text-input-v2-input']",
  "[data-slot='textarea-v2-textarea']",
  "[data-slot='inline-input-v2-input']",
].join(", ");

export interface FieldV2Props extends HTMLAttributes<HTMLDivElement> {
  invalid?: boolean;
  children?: ReactNode;
}

function FieldV2Root(props: FieldV2Props): JSX.Element {
  const { invalid, children, ...rest } = props;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const controlId = `field-control-${uid}`;
  const labelId = `field-label-${uid}`;
  const prefixId = `field-prefix-${uid}`;
  const suffixId = `field-suffix-${uid}`;
  const [prefixCount, setPrefixCount] = useState(0);
  const [suffixCount, setSuffixCount] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const control = root.querySelector(CONTROL_SELECTOR) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null;
    if (!control) return;
    const shell = control.closest(
      "[data-component='text-input-v2'], [data-component='textarea-v2'], [data-component='inline-input-v2']",
    ) as HTMLElement | null;
    control.id = controlId;
    control.setAttribute("aria-labelledby", labelId);
    const ids: string[] = [];
    if (prefixCount > 0) ids.push(prefixId);
    if (suffixCount > 0) ids.push(suffixId);
    if (ids.length > 0) control.setAttribute("aria-describedby", ids.join(" "));
    else control.removeAttribute("aria-describedby");
    if (invalid) {
      control.setAttribute("aria-invalid", "true");
      shell?.setAttribute("data-invalid", "");
    } else {
      control.removeAttribute("aria-invalid");
      shell?.removeAttribute("data-invalid");
    }
  }, [controlId, labelId, prefixId, suffixId, prefixCount, suffixCount, invalid]);

  return (
    <FieldContext.Provider
      value={{
        controlId,
        labelId,
        prefixId,
        suffixId,
        invalid: invalid ?? false,
        registerPrefix: () => setPrefixCount((n) => n + 1),
        unregisterPrefix: () => setPrefixCount((n) => Math.max(0, n - 1)),
        registerSuffix: () => setSuffixCount((n) => n + 1),
        unregisterSuffix: () => setSuffixCount((n) => Math.max(0, n - 1)),
      }}
    >
      <div {...rest} ref={rootRef} data-component="field-v2" data-invalid={invalid ? "" : undefined}>
        {children}
      </div>
    </FieldContext.Provider>
  );
}

function FieldLabelInfoIcon(): JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13 13H3V3H13V13ZM6.46777 6.81641V7.81641H7.5791V11.3721H8.5791V6.81641H6.46777ZM7.30078 4.62891V5.62891H8.85645V4.62891H7.30078Z"
        fill="currentColor"
      />
    </svg>
  );
}

export interface FieldLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** When set, shows the info icon with a tooltip containing this text. */
  tooltip?: string;
  children?: ReactNode;
}

function FieldLabel(props: FieldLabelProps): JSX.Element {
  const { children, tooltip, ...rest } = props;
  const field = useField();
  return (
    <label {...rest} id={field.labelId} htmlFor={field.controlId} data-slot="field-v2-label">
      <span data-slot="field-v2-label-text">{children}</span>
      {tooltip ? (
        <button
          type="button"
          data-slot="field-v2-label-info"
          aria-label={tooltip}
          title={tooltip}
          onClick={(e) => e.stopPropagation()}
        >
          <FieldLabelInfoIcon />
        </button>
      ) : null}
    </label>
  );
}

function FieldPrefix(props: HTMLAttributes<HTMLDivElement>): JSX.Element {
  const { children, ...rest } = props;
  const field = useField();
  const register = useRef(field.registerPrefix);
  const unregister = useRef(field.unregisterPrefix);
  register.current = field.registerPrefix;
  unregister.current = field.unregisterPrefix;
  useEffect(() => {
    register.current();
    const u = unregister.current;
    return () => u();
  }, []);
  return (
    <div {...rest} id={field.prefixId} data-slot="field-v2-prefix">
      {children}
    </div>
  );
}

function FieldSuffix(props: HTMLAttributes<HTMLDivElement>): JSX.Element {
  const { children, ...rest } = props;
  const field = useField();
  const register = useRef(field.registerSuffix);
  const unregister = useRef(field.unregisterSuffix);
  register.current = field.registerSuffix;
  unregister.current = field.unregisterSuffix;
  useEffect(() => {
    register.current();
    const u = unregister.current;
    return () => u();
  }, []);
  return (
    <div {...rest} id={field.suffixId} data-slot="field-v2-suffix">
      {children}
    </div>
  );
}

/** Optional layout wrapper around the control. */
function FieldControl(props: HTMLAttributes<HTMLDivElement>): JSX.Element {
  const { children, ...rest } = props;
  return (
    <div {...rest} data-slot="field-v2-control">
      {children}
    </div>
  );
}

export const FieldV2 = Object.assign(FieldV2Root, {
  Label: FieldLabel,
  Prefix: FieldPrefix,
  Suffix: FieldSuffix,
  Control: FieldControl,
});

export const Field = FieldV2;
