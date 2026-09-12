import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import "./toast-v2.css";

export interface ToastV2Action {
  label: string;
  variant?: "primary" | "secondary";
  onClick: "dismiss" | (() => void);
}

export interface ToastV2Options {
  title?: string;
  description?: string;
  icon?: ReactNode;
  variant?: "default" | "success" | "error" | "loading";
  duration?: number;
  persistent?: boolean;
  actions?: ToastV2Action[];
}

interface ToastRecord {
  id: number;
  custom?: (props: { toastId: number }) => ReactNode;
  options: ToastV2Options;
  duration?: number;
  persistent?: boolean;
}

type Listener = (toasts: ToastRecord[]) => void;

let toastV2Id = 0;
let toastRecords: ToastRecord[] = [];
const toastListeners = new Set<Listener>();
const activeToastV2ByKey = new Map<string, ToastRecord>();
const activeToastV2ById = new Map<number, ToastRecord>();

function notifyToastV2() {
  const snapshot = [...toastRecords];
  toastListeners.forEach((listener) => listener(snapshot));
}

function removeToastV2(id: number) {
  toastRecords = toastRecords.filter((toast) => toast.id !== id);
  notifyToastV2();
}

export const toasterV2 = {
  show(render: (props: { toastId: number }) => ReactNode, options?: { duration?: number; persistent?: boolean }) {
    const toastId = --toastV2Id;
    toastRecords = [...toastRecords, { id: toastId, custom: render, options: {}, duration: options?.duration, persistent: options?.persistent }];
    notifyToastV2();
    return toastId;
  },
  dismiss(toastId?: number) {
    if (toastId === undefined) {
      activeToastV2ByKey.clear();
      activeToastV2ById.clear();
      toastRecords = [];
      notifyToastV2();
      return;
    }
    releaseToastV2(activeToastV2ById.get(toastId));
    removeToastV2(toastId);
  },
};

export interface ToastV2RegionProps extends HTMLAttributes<HTMLDivElement> {
  duration?: number;
}

export function ToastV2Region(props: ToastV2RegionProps) {
  const { className, duration, children, ...rest } = props;
  const [toasts, setToasts] = useState<ToastRecord[]>(() => [...toastRecords]);

  useEffect(() => {
    const listener: Listener = (next) => setToasts(next);
    toastListeners.add(listener);
    setToasts([...toastRecords]);
    return () => {
      toastListeners.delete(listener);
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div {...rest} className={["toast-v2-region", className].filter(Boolean).join(" ")} role="region" aria-live="polite">
      {children}
      {toasts.map((toast) => (
        <ToastV2Item key={toast.id} record={toast} defaultDuration={duration} />
      ))}
    </div>,
    document.body,
  );
}

function ToastV2Item(props: { record: ToastRecord; defaultDuration?: number }) {
  const { record, defaultDuration } = props;
  const duration = record.options.duration ?? record.duration ?? defaultDuration ?? 5000;
  const persistent = record.options.persistent ?? record.persistent ?? false;

  useEffect(() => {
    if (persistent) return;
    if (!Number.isFinite(duration)) return;
    const timer = setTimeout(() => {
      releaseToastV2(record);
      removeToastV2(record.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, persistent, record]);

  if (record.custom) {
    return (
      <div className="toast-v2" data-testid={`toast-v2-${record.id}`}>
        <ToastV2Root toastId={record.id}>{record.custom({ toastId: record.id })}</ToastV2Root>
      </div>
    );
  }

  const variant = record.options.variant ?? "default";
  return (
    <div className={`toast-v2 toast-v2--${variant}`} data-testid={`toast-v2-${record.id}`} role="status">
      <ToastV2Root toastId={record.id}>
        {record.options.icon === undefined || record.options.icon === null ? null : (
          <ToastV2Icon>{record.options.icon}</ToastV2Icon>
        )}
        <ToastV2Content>
          {record.options.title ? <ToastV2Title>{record.options.title}</ToastV2Title> : null}
          {record.options.description ? <ToastV2Description>{record.options.description}</ToastV2Description> : null}
        </ToastV2Content>
        <ToastV2CloseButton />
        {record.options.actions && record.options.actions.length > 0 ? (
          <ToastV2Actions>
            {record.options.actions.map((action) => (
              <button
                key={action.label}
                type="button"
                data-component="button-v2"
                data-variant={action.variant === "secondary" ? "ghost" : "neutral"}
                data-size="small"
                data-action-variant={action.variant ?? "primary"}
                onClick={() => {
                  if (typeof action.onClick === "function") action.onClick();
                  toasterV2.dismiss(record.id);
                }}
              >
                {action.label}
              </button>
            ))}
          </ToastV2Actions>
        ) : null}
      </ToastV2Root>
    </div>
  );
}

const ToastV2Context = createContext<number | undefined>(undefined);

export interface ToastV2RootProps {
  toastId: number;
  children?: ReactNode;
}

function ToastV2Root(props: ToastV2RootProps) {
  return <ToastV2Context.Provider value={props.toastId}>{props.children}</ToastV2Context.Provider>;
}

function ToastV2Icon(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} data-slot="toast-v2-icon" />;
}

function ToastV2Content(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} data-slot="toast-v2-content" />;
}

function ToastV2Title(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} data-slot="toast-v2-title" />;
}

function ToastV2Description(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} data-slot="toast-v2-description" />;
}

function ToastV2Actions(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} data-slot="toast-v2-actions" />;
}

export interface ToastV2CloseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
}

function ToastV2CloseButton(props: ToastV2CloseButtonProps) {
  const { children, onClick, ...rest } = props;
  const toastId = useContext(ToastV2Context);
  return (
    <button type="button" {...rest} data-slot="toast-v2-close-button" aria-label="Dismiss" onClick={(event) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      if (toastId !== undefined) toasterV2.dismiss(toastId);
    }}>
      {children ?? <CloseIcon />}
    </button>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4.25 11.75L11.75 4.25" stroke="currentColor" />
      <path d="M11.75 11.75L4.25 4.25" stroke="currentColor" />
    </svg>
  );
}

export const ToastV2 = Object.assign(ToastV2Root, {
  Region: ToastV2Region,
  Icon: ToastV2Icon,
  Content: ToastV2Content,
  Title: ToastV2Title,
  Description: ToastV2Description,
  Actions: ToastV2Actions,
  CloseButton: ToastV2CloseButton,
});

function toastV2Key(opts: ToastV2Options): string {
  return JSON.stringify({
    title: opts.title,
    description: opts.description,
    variant: opts.variant,
    duration: opts.duration,
    persistent: opts.persistent,
    actions: opts.actions?.map((action) => [action.label, action.variant]),
  });
}

export function showToastV2(options: ToastV2Options | string) {
  const opts: ToastV2Options = typeof options === "string" ? { description: options } : options;
  const key = toastV2Key(opts);
  const active = activeToastV2ByKey.get(key);

  if (active) {
    const isFront = toastRecords.length > 0 && toastRecords[toastRecords.length - 1]?.id === active.id;
    active.options = opts;
    notifyToastV2();
    if (isFront) pulseToastV2(active.id);
    return active.id;
  }

  const entry: ToastRecord = { id: --toastV2Id, options: opts };
  activeToastV2ByKey.set(key, entry);
  activeToastV2ById.set(entry.id, entry);
  toastRecords = [...toastRecords, entry];
  notifyToastV2();
  return entry.id;
}

function pulseToastV2(toastId: number) {
  if (typeof document === "undefined" || typeof requestAnimationFrame === "undefined") return;
  requestAnimationFrame(() => {
    const element = document.querySelector<HTMLElement>(`[data-testid="toast-v2-${toastId}"]`);
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    element.animate([{ scale: 1 }, { scale: 1.025 }, { scale: 1 }], { duration: 160, easing: "ease-out" });
  });
}

function releaseToastV2(entry: ToastRecord | undefined) {
  if (!entry) return;
  for (const [key, value] of activeToastV2ByKey) {
    if (value === entry) activeToastV2ByKey.delete(key);
  }
  if (activeToastV2ById.get(entry.id) === entry) activeToastV2ById.delete(entry.id);
}

export interface ToastV2PromiseOptions<T, U = unknown> {
  loading?: ReactNode;
  success?: (data: T) => ReactNode;
  error?: (error: U) => ReactNode;
}
