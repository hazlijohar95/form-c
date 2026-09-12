import "./progress.css";

export interface ProgressProps {
  value?: number;
  max?: number;
  indeterminate?: boolean;
  className?: string;
  hideLabel?: boolean;
  showValueLabel?: boolean;
  children?: React.ReactNode;
}

export function Progress(props: ProgressProps): JSX.Element {
  const max = props.max ?? 100;
  const value = props.value ?? 0;
  const pct = props.indeterminate ? undefined : Math.max(0, Math.min(100, (value / max) * 100));
  if (!props.children && !props.showValueLabel) {
    return (
      <div
        data-component="progress"
        data-indeterminate={props.indeterminate ? "" : undefined}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={props.indeterminate ? undefined : value}
        className={props.className}
      >
        <div data-slot="progress-track">
          <div data-slot="progress-fill" style={pct !== undefined ? { width: `${pct}%` } : undefined} />
        </div>
      </div>
    );
  }
  return (
    <div
      data-component="progress"
      data-indeterminate={props.indeterminate ? "" : undefined}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={props.indeterminate ? undefined : value}
      className={props.className}
    >
      <div data-slot="progress-header">
        {props.children ? (
          <span data-slot="progress-label" className={props.hideLabel ? "sr-only" : undefined}>
            {props.children}
          </span>
        ) : null}
        {props.showValueLabel && !props.indeterminate ? (
          <span data-slot="progress-value-label">{`${Math.round(pct ?? 0)}%`}</span>
        ) : null}
      </div>
      <div data-slot="progress-track">
        <div data-slot="progress-fill" style={pct !== undefined ? { width: `${pct}%` } : undefined} />
      </div>
    </div>
  );
}
