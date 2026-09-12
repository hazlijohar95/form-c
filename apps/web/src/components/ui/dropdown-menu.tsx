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
import "./dropdown-menu.css";

interface MenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const MenuContext = createContext<MenuContextValue>({ open: false, setOpen: () => undefined });

function useMenu(): MenuContextValue {
  return useContext(MenuContext);
}

export interface DropdownMenuProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

function DropdownMenuRoot(props: DropdownMenuProps): JSX.Element {
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

export interface DropdownMenuTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

function DropdownMenuTrigger(props: DropdownMenuTriggerProps): JSX.Element {
  const { children, onClick, ...rest } = props;
  const { open, setOpen } = useMenu();
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      {...rest}
      data-slot="dropdown-menu-trigger"
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        setOpen(!open);
      }}
    >
      {children}
    </button>
  );
}

function DropdownMenuIcon(props: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <span data-slot="dropdown-menu-icon" className={props.className}>
      {props.children}
    </span>
  );
}

function DropdownMenuPortal(props: { children: ReactNode }): JSX.Element {
  return <>{props.children}</>;
}

export interface DropdownMenuContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function DropdownMenuContent(props: DropdownMenuContentProps): JSX.Element | null {
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
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => window.removeEventListener("pointerdown", onPointerDown, { capture: true });
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div
      role="menu"
      {...rest}
      ref={ref}
      data-component="dropdown-menu-content"
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

function DropdownMenuArrow(props: { className?: string }): JSX.Element {
  return <span data-slot="dropdown-menu-arrow" className={props.className} aria-hidden="true" />;
}

function DropdownMenuSeparator(props: { className?: string }): JSX.Element {
  return <div role="separator" data-slot="dropdown-menu-separator" className={props.className} />;
}

function DropdownMenuGroup(props: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <div role="group" data-slot="dropdown-menu-group" className={props.className}>
      {props.children}
    </div>
  );
}

function DropdownMenuGroupLabel(props: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <div data-slot="dropdown-menu-group-label" className={props.className}>
      {props.children}
    </div>
  );
}

export interface DropdownMenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
  onSelect?: () => void;
}

function DropdownMenuItem(props: DropdownMenuItemProps): JSX.Element {
  const { onSelect, onClick, disabled, children, ...rest } = props;
  const { setOpen } = useMenu();
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      {...rest}
      data-slot="dropdown-menu-item"
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

function DropdownMenuItemLabel(props: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <span data-slot="dropdown-menu-item-label" className={props.className}>
      {props.children}
    </span>
  );
}

function DropdownMenuItemDescription(props: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <span data-slot="dropdown-menu-item-description" className={props.className}>
      {props.children}
    </span>
  );
}

function DropdownMenuItemIndicator(props: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <span data-slot="dropdown-menu-item-indicator" className={props.className}>
      {props.children}
    </span>
  );
}

export interface DropdownMenuRadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

const RadioContext = createContext<{ value?: string; onValueChange?: (v: string) => void }>({});

function DropdownMenuRadioGroup(props: DropdownMenuRadioGroupProps): JSX.Element {
  return (
    <RadioContext.Provider value={{ value: props.value, onValueChange: props.onValueChange }}>
      <div role="group" data-slot="dropdown-menu-radio-group" className={props.className}>
        {props.children}
      </div>
    </RadioContext.Provider>
  );
}

function DropdownMenuRadioItem(
  props: { value: string; children: ReactNode; className?: string; disabled?: boolean },
): JSX.Element {
  const radio = useContext(RadioContext);
  const { setOpen } = useMenu();
  const checked = radio.value === props.value;
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      disabled={props.disabled}
      data-slot="dropdown-menu-radio-item"
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

function DropdownMenuCheckboxItem(
  props: { checked?: boolean; onCheckedChange?: (checked: boolean) => void; children: ReactNode; className?: string; disabled?: boolean },
): JSX.Element {
  const { setOpen } = useMenu();
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={props.checked ?? false}
      disabled={props.disabled}
      data-slot="dropdown-menu-checkbox-item"
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

function DropdownMenuSub(props: { children: ReactNode }): JSX.Element {
  return <>{props.children}</>;
}

function DropdownMenuSubTrigger(props: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <button type="button" aria-haspopup="menu" data-slot="dropdown-menu-sub-trigger" className={props.className}>
      {props.children}
    </button>
  );
}

function DropdownMenuSubContent(props: { children: ReactNode; className?: string }): JSX.Element | null {
  const { open } = useMenu();
  if (!open) return null;
  return (
    <div role="menu" data-component="dropdown-menu-sub-content" className={props.className}>
      {props.children}
    </div>
  );
}

export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Trigger: DropdownMenuTrigger,
  Icon: DropdownMenuIcon,
  Portal: DropdownMenuPortal,
  Content: DropdownMenuContent,
  Arrow: DropdownMenuArrow,
  Separator: DropdownMenuSeparator,
  Group: DropdownMenuGroup,
  GroupLabel: DropdownMenuGroupLabel,
  Item: DropdownMenuItem,
  ItemLabel: DropdownMenuItemLabel,
  ItemDescription: DropdownMenuItemDescription,
  ItemIndicator: DropdownMenuItemIndicator,
  RadioGroup: DropdownMenuRadioGroup,
  RadioItem: DropdownMenuRadioItem,
  CheckboxItem: DropdownMenuCheckboxItem,
  Sub: DropdownMenuSub,
  SubTrigger: DropdownMenuSubTrigger,
  SubContent: DropdownMenuSubContent,
});
