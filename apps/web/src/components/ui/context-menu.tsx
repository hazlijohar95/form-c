import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import "./context-menu.css";

interface MenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const MenuContext = createContext<MenuContextValue>({ open: false, setOpen: () => undefined });

function useMenu(): MenuContextValue {
  return useContext(MenuContext);
}

export interface ContextMenuProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

function ContextMenuRoot(props: ContextMenuProps): JSX.Element {
  const [uncontrolled, setUncontrolled] = useState(props.defaultOpen ?? false);
  const open = props.open ?? uncontrolled;
  const setOpen = useCallback(
    (next: boolean) => {
      props.onOpenChange?.(next);
      if (props.open === undefined) setUncontrolled(next);
    },
    [props],
  );
  return <MenuContext.Provider value={{ open, setOpen }}>{props.children}</MenuContext.Provider>;
}

export interface ContextMenuTriggerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function ContextMenuTrigger(props: ContextMenuTriggerProps): JSX.Element {
  const { children, onContextMenu, ...rest } = props;
  const { setOpen } = useMenu();
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  return (
    <div
      {...rest}
      data-slot="context-menu-trigger"
      onContextMenu={(e) => {
        onContextMenu?.(e);
        if (e.defaultPrevented) return;
        e.preventDefault();
        setPoint({ x: e.clientX, y: e.clientY });
        setOpen(true);
      }}
    >
      {children}
      <ContextMenuPoint point={point} />
    </div>
  );
}

function ContextMenuPoint(props: { point: { x: number; y: number } | null }): JSX.Element | null {
  if (!props.point) return null;
  return <span data-slot="context-menu-point" style={{ position: "fixed", left: props.point.x, top: props.point.y }} />;
}

function ContextMenuIcon(props: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <span data-slot="context-menu-icon" className={props.className}>
      {props.children}
    </span>
  );
}

function ContextMenuPortal(props: { children: ReactNode }): JSX.Element {
  return <>{props.children}</>;
}

export interface ContextMenuContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function ContextMenuContent(props: ContextMenuContentProps): JSX.Element | null {
  const { children, onKeyDown, ...rest } = props;
  const { open, setOpen } = useMenu();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    window.addEventListener("keydown", onKey, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, { capture: true });
      window.removeEventListener("keydown", onKey, { capture: true });
    };
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div
      role="menu"
      {...rest}
      ref={ref}
      data-component="context-menu-content"
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.key === "Escape") {
          e.preventDefault();
          setOpen(false);
        }
      }}
    >
      {children}
    </div>
  );
}

function ContextMenuArrow(props: { className?: string }): JSX.Element {
  return <span data-slot="context-menu-arrow" className={props.className} aria-hidden="true" />;
}

function ContextMenuSeparator(props: { className?: string }): JSX.Element {
  return <div role="separator" data-slot="context-menu-separator" className={props.className} />;
}

function ContextMenuGroup(props: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <div role="group" data-slot="context-menu-group" className={props.className}>
      {props.children}
    </div>
  );
}

function ContextMenuGroupLabel(props: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <div data-slot="context-menu-group-label" className={props.className}>
      {props.children}
    </div>
  );
}

export interface ContextMenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
  onSelect?: () => void;
}

function ContextMenuItem(props: ContextMenuItemProps): JSX.Element {
  const { onSelect, onClick, disabled, children, ...rest } = props;
  const { setOpen } = useMenu();
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      {...rest}
      data-slot="context-menu-item"
      data-disabled={disabled ? true : undefined}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        onSelect?.();
        setOpen(false);
      }}
    >
      {children}
    </button>
  );
}

function ContextMenuItemLabel(props: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <span data-slot="context-menu-item-label" className={props.className}>
      {props.children}
    </span>
  );
}

function ContextMenuItemDescription(props: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <span data-slot="context-menu-item-description" className={props.className}>
      {props.children}
    </span>
  );
}

function ContextMenuItemIndicator(props: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <span data-slot="context-menu-item-indicator" className={props.className}>
      {props.children}
    </span>
  );
}

const RadioContext = createContext<{ value?: string; onValueChange?: (v: string) => void }>({});

function ContextMenuRadioGroup(
  props: { value?: string; onValueChange?: (value: string) => void; children: ReactNode; className?: string },
): JSX.Element {
  return (
    <RadioContext.Provider value={{ value: props.value, onValueChange: props.onValueChange }}>
      <div role="group" data-slot="context-menu-radio-group" className={props.className}>
        {props.children}
      </div>
    </RadioContext.Provider>
  );
}

function ContextMenuRadioItem(
  props: { value: string; children: ReactNode; className?: string; disabled?: boolean },
): JSX.Element {
  const radio = useContext(RadioContext);
  const { setOpen } = useMenu();
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={radio.value === props.value}
      disabled={props.disabled}
      data-slot="context-menu-radio-item"
      data-disabled={props.disabled ? true : undefined}
      className={props.className}
      onClick={() => {
        radio.onValueChange?.(props.value);
        setOpen(false);
      }}
    >
      {props.children}
    </button>
  );
}

function ContextMenuCheckboxItem(
  props: { checked?: boolean; onCheckedChange?: (checked: boolean) => void; children: ReactNode; className?: string; disabled?: boolean },
): JSX.Element {
  const { setOpen } = useMenu();
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={props.checked ?? false}
      disabled={props.disabled}
      data-slot="context-menu-checkbox-item"
      data-disabled={props.disabled ? true : undefined}
      className={props.className}
      onClick={() => {
        props.onCheckedChange?.(!(props.checked ?? false));
        setOpen(false);
      }}
    >
      {props.children}
    </button>
  );
}

function ContextMenuSub(props: { children: ReactNode }): JSX.Element {
  return <>{props.children}</>;
}

function ContextMenuSubTrigger(props: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <button type="button" aria-haspopup="menu" data-slot="context-menu-sub-trigger" className={props.className}>
      {props.children}
    </button>
  );
}

function ContextMenuSubContent(props: { children: ReactNode; className?: string }): JSX.Element | null {
  const { open } = useMenu();
  if (!open) return null;
  return (
    <div role="menu" data-component="context-menu-sub-content" className={props.className}>
      {props.children}
    </div>
  );
}

export const ContextMenu = Object.assign(ContextMenuRoot, {
  Trigger: ContextMenuTrigger,
  Icon: ContextMenuIcon,
  Portal: ContextMenuPortal,
  Content: ContextMenuContent,
  Arrow: ContextMenuArrow,
  Separator: ContextMenuSeparator,
  Group: ContextMenuGroup,
  GroupLabel: ContextMenuGroupLabel,
  Item: ContextMenuItem,
  ItemLabel: ContextMenuItemLabel,
  ItemDescription: ContextMenuItemDescription,
  ItemIndicator: ContextMenuItemIndicator,
  RadioGroup: ContextMenuRadioGroup,
  RadioItem: ContextMenuRadioItem,
  CheckboxItem: ContextMenuCheckboxItem,
  Sub: ContextMenuSub,
  SubTrigger: ContextMenuSubTrigger,
  SubContent: ContextMenuSubContent,
});
