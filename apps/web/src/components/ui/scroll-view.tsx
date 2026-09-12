import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import "./scroll-view.css";

export type ScrollViewThumbVisibility = "hover" | "scroll";

export interface ScrollViewProps extends HTMLAttributes<HTMLDivElement> {
  viewportRef?: (el: HTMLDivElement) => void;
  orientation?: "vertical" | "horizontal";
  thumbVisibility?: ScrollViewThumbVisibility;
  children: ReactNode;
}

type ScrollKey = "page-down" | "page-up" | "home" | "end" | "up" | "down";

export function scrollKey(event: Pick<KeyboardEvent, "key" | "altKey" | "ctrlKey" | "metaKey" | "shiftKey">): ScrollKey | undefined {
  if (event.altKey || event.ctrlKey || event.metaKey) return undefined;
  if (event.shiftKey && event.key !== " ") return undefined;
  switch (event.key) {
    case "PageDown":
      return "page-down";
    case "PageUp":
      return "page-up";
    case "Home":
      return "home";
    case "End":
      return "end";
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    case " ":
      return event.shiftKey ? "page-up" : "page-down";
    default:
      return undefined;
  }
}

export function canScrollKey(element: HTMLElement, key: ScrollKey): boolean {
  const up = key === "up" || key === "page-up" || key === "home";
  if (up) return element.scrollTop > 0;
  return element.scrollTop + element.clientHeight < element.scrollHeight;
}

export function scrollKeyOwner(root: HTMLElement, target: EventTarget | null, key: ScrollKey): HTMLElement {
  const element = target instanceof Element ? target : undefined;
  const owner = element?.closest<HTMLElement>("[data-scrollable]");
  if (!owner || owner === root) return root;
  if (!root.contains(owner)) return owner;
  if (canScrollKey(owner, key)) return owner;
  return root;
}

export function isScrollKeyTarget(target: EventTarget | null, key: ScrollKey): boolean {
  const element = target instanceof HTMLElement ? target : undefined;
  if (!element) return true;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName) || element.isContentEditable) return false;
  if ((key === "page-up" || key === "page-down") && element.closest('button, a[href], [role="button"]')) return false;
  return true;
}

export function scrollTopFromThumbPointer(input: {
  pointer: number;
  viewportTop: number;
  grabOffset: number;
  clientHeight: number;
  scrollHeight: number;
  thumbHeight: number;
  scrollClientHeight?: number;
}): number {
  const padding = 8;
  const maxThumbTop = input.clientHeight - padding * 2 - input.thumbHeight;
  if (maxThumbTop <= 0) return 0;
  const thumbTop = Math.max(0, Math.min(input.pointer - input.viewportTop - padding - input.grabOffset, maxThumbTop));
  return (thumbTop / maxThumbTop) * Math.max(0, input.scrollHeight - (input.scrollClientHeight ?? input.clientHeight));
}

export function ScrollView(props: ScrollViewProps): JSX.Element {
  const { viewportRef, orientation, thumbVisibility, children, style, onScroll, onKeyDown, ...rest } = props;
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportEl = useRef<HTMLDivElement | null>(null);
  const thumbEl = useRef<HTMLDivElement | null>(null);
  const idleTimer = useRef<number | undefined>(undefined);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [thumb, setThumb] = useState({ height: 0, top: 0, visible: false });

  const updateThumb = (): void => {
    const viewport = viewportEl.current;
    if (!viewport) return;
    const { scrollTop, scrollHeight, clientHeight } = viewport;
    if (scrollHeight <= clientHeight || scrollHeight === 0) {
      setThumb({ height: 0, top: 0, visible: false });
      return;
    }
    const padding = 8;
    const trackHeight = clientHeight - padding * 2;
    const minThumbHeight = 32;
    const height = Math.max((clientHeight / scrollHeight) * trackHeight, minThumbHeight);
    const maxScrollTop = scrollHeight - clientHeight;
    const maxThumbTop = trackHeight - height;
    const top = padding + (maxScrollTop > 0 ? (scrollTop / maxScrollTop) * maxThumbTop : 0);
    setThumb({ height, top, visible: true });
  };

  useEffect(() => {
    updateThumb();
    if (viewportEl.current && viewportRef) viewportRef(viewportEl.current);
    window.addEventListener("resize", updateThumb);
    return () => {
      window.removeEventListener("resize", updateThumb);
      if (idleTimer.current !== undefined) window.clearTimeout(idleTimer.current);
    };
  }, [viewportRef]);

  const markScrolling = (): void => {
    setScrolling(true);
    if (idleTimer.current !== undefined) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setScrolling(false), 800);
  };

  const thumbVisible = dragging || scrolling || ((thumbVisibility ?? "hover") === "hover" && hovered);

  const onThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    const viewport = viewportEl.current;
    const thumbNode = thumbEl.current;
    if (!viewport || !thumbNode) return;
    setDragging(true);
    const grabOffset = e.clientY - thumbNode.getBoundingClientRect().top;
    const thumbHeight = thumb.height;
    const onMove = (ev: PointerEvent): void => {
      viewport.scrollTop = scrollTopFromThumbPointer({
        pointer: ev.clientY,
        viewportTop: viewport.getBoundingClientRect().top,
        grabOffset,
        clientHeight: viewport.clientHeight,
        scrollHeight: viewport.scrollHeight,
        thumbHeight,
      });
    };
    const done = (): void => {
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", done);
      window.removeEventListener("pointercancel", done);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", done);
    window.addEventListener("pointercancel", done);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    const active = document.activeElement;
    if (active && ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName)) return;
    const viewport = viewportEl.current;
    if (!viewport) return;
    const next = scrollKey(e.nativeEvent);
    if (!next) return;
    if (!isScrollKeyTarget(e.target, next)) return;
    if (scrollKeyOwner(viewport, e.target, next) !== viewport) return;
    const scrollAmount = viewport.clientHeight * 0.8;
    const lineAmount = 40;
    if (next === "page-down") {
      e.preventDefault();
      viewport.scrollBy({ top: scrollAmount, behavior: "smooth" });
      return;
    }
    if (next === "page-up") {
      e.preventDefault();
      viewport.scrollBy({ top: -scrollAmount, behavior: "smooth" });
      return;
    }
    if (next === "home") {
      e.preventDefault();
      viewport.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (next === "end") {
      e.preventDefault();
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
      return;
    }
    if (next === "up") {
      e.preventDefault();
      viewport.scrollBy({ top: -lineAmount, behavior: "smooth" });
      return;
    }
    e.preventDefault();
    viewport.scrollBy({ top: lineAmount, behavior: "smooth" });
  };

  const thumbStyle: CSSProperties = {
    height: `${thumb.height}px`,
    transform: `translateY(${thumb.top}px)`,
    zIndex: 100,
  };

  return (
    <div
      ref={rootRef}
      {...rest}
      className={["scroll-view", rest.className].filter(Boolean).join(" ")}
      style={style}
      data-orientation={orientation ?? "vertical"}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <div
        ref={viewportEl}
        className="scroll-view__viewport"
        data-scrollable
        tabIndex={0}
        role="region"
        aria-label="Scrollable content"
        onScroll={(e) => {
          updateThumb();
          markScrolling();
          onScroll?.(e);
        }}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
      {thumb.visible ? (
        <div
          ref={thumbEl}
          className="scroll-view__thumb"
          data-visible={thumbVisible}
          data-dragging={dragging}
          style={thumbStyle}
          onPointerDown={onThumbPointerDown}
        />
      ) : null}
    </div>
  );
}
