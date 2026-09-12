import "./dock-surface.css";

export interface DockTrayProps extends React.HTMLAttributes<HTMLDivElement> {
  attach?: "none" | "top";
}

export function DockShell(props: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  const { children, className, ...rest } = props;
  return (
    <div {...rest} data-dock-surface="shell" className={className}>
      {children}
    </div>
  );
}

export function DockShellForm(props: React.FormHTMLAttributes<HTMLFormElement>): JSX.Element {
  const { children, className, ...rest } = props;
  return (
    <form {...rest} data-dock-surface="shell" className={className}>
      {children}
    </form>
  );
}

export function DockTray(props: DockTrayProps): JSX.Element {
  const { attach, children, className, ...rest } = props;
  return (
    <div {...rest} data-dock-surface="tray" data-dock-attach={attach ?? "none"} className={className}>
      {children}
    </div>
  );
}
