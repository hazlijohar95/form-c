import "./resize-handle.css";

export interface ResizeHandleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onResize"> {
  direction: "horizontal" | "vertical";
  edge?: "start" | "end";
  size: number;
  min: number;
  max: number;
  onResize: (size: number) => void;
  onCollapse?: () => void;
  /** Called while dragging when size crosses `collapseThreshold`. */
  onCollapseChange?: (collapsed: boolean) => void;
  collapseThreshold?: number;
}

export function ResizeHandle(props: ResizeHandleProps): JSX.Element {
  const {
    direction,
    edge,
    size,
    min,
    max,
    onResize,
    onCollapse,
    onCollapseChange,
    collapseThreshold,
    ...rest
  } = props;
  const resolvedEdge = edge ?? (direction === "vertical" ? "start" : "end");

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>): void {
    if (e.detail > 1) return;
    e.preventDefault();
    const start = direction === "horizontal" ? e.clientX : e.clientY;
    const target = e.currentTarget;
    const rtl =
      direction === "horizontal" && getComputedStyle(target).direction === "rtl";
    const startSize = size;
    const threshold = collapseThreshold ?? 0;
    let collapsed = false;

    document.body.style.userSelect = "none";
    document.body.style.overflow = "hidden";

    const onMouseMove = (moveEvent: MouseEvent): void => {
      const pos = direction === "horizontal" ? moveEvent.clientX : moveEvent.clientY;
      let delta: number;
      if (direction === "vertical") {
        delta = resolvedEdge === "end" ? pos - start : start - pos;
      } else {
        delta = resolvedEdge === "start" !== rtl ? start - pos : pos - start;
      }
      const current = startSize + delta;
      const nextCollapsed = threshold > 0 && current < threshold;
      if (nextCollapsed !== collapsed) {
        collapsed = nextCollapsed;
        onCollapseChange?.(collapsed);
      }
      onResize(Math.min(max, Math.max(min, current)));
    };

    const onMouseUp = (): void => {
      document.body.style.userSelect = "";
      document.body.style.overflow = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      if (collapsed) {
        onCollapse?.();
        return;
      }
      onCollapseChange?.(false);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  return (
    <div
      {...rest}
      data-component="resize-handle"
      data-direction={direction}
      data-edge={resolvedEdge}
      onMouseDown={handleMouseDown}
    />
  );
}
