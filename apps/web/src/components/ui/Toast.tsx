export interface Toast {
  id: string;
  title: string;
  detail?: string;
  err?: boolean;
}

export function pushToast(set: React.Dispatch<React.SetStateAction<Toast[]>>, t: Omit<Toast, "id">): void {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  set((prev) => [...prev.slice(-3), { ...t, id }]);
  if (!t.err) {
    window.setTimeout(() => {
      set((prev) => prev.filter((x) => x.id !== id));
    }, 4200);
  }
}

export function Toasts(props: { items: Toast[]; onDismiss: (id: string) => void }): JSX.Element {
  const info = props.items.filter((t) => !t.err);
  const errs = props.items.filter((t) => t.err);
  return (
    <div className="toasts no-print">
      <div role="status" aria-live="polite" aria-atomic="false">
        {info.map((t) => (
          <div key={t.id} className="toast">
            <div className="tt">{t.title}</div>
            {t.detail && <div className="td">{t.detail}</div>}
            <button type="button" className="toast-x" aria-label={`Dismiss: ${t.title}`} onClick={() => props.onDismiss(t.id)}>
              <span aria-hidden="true">×</span>
            </button>
          </div>
        ))}
      </div>
      <div role="alert">
        {errs.map((t) => (
          <div key={t.id} className="toast err">
            <div className="tt">{t.title}</div>
            {t.detail && <div className="td">{t.detail}</div>}
            <button type="button" className="toast-x" aria-label={`Dismiss error: ${t.title}`} onClick={() => props.onDismiss(t.id)}>
              <span aria-hidden="true">×</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
