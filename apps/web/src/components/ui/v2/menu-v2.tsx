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
import { createPortal } from "react-dom";
import "./menu-v2.css";

interface MenuV2RootContext {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const RootContext = createContext<MenuV2RootContext>({ open: false, setOpen: () => undefined });

export interface MenuV2RootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

function MenuV2Root(props: MenuV2RootProps) {
  const { open, defaultOpen, onOpenChange, children } = props;
  const [internal, setInternal] = useState<boolean>(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const resolved = isControlled ? (open as boolean) : internal;
  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternal(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );
  return <RootContext.Provider value={{ open: resolved, setOpen }}>{children}</RootContext.Provider>;
}

function MenuV2Trigger(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onClick, children, ...rest } = props;
  const { open, setOpen } = useContext(RootContext);
  return (
    <button
      type="button"
      {...rest}
      aria-haspopup="menu"
      aria-expanded={open}
      data-slot="menu-v2-trigger"
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        setOpen(!open);
      }}
    >
      {children}
    </button>
  );
}

function MenuV2Portal(props: { children?: ReactNode }) {
  return <>{props.children}</>;
}

interface MenuV2ContentProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

function useDismiss(onDismiss: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    const onPointer = (event: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      if (event.target instanceof Node && el.contains(event.target)) return;
      onDismiss();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [onDismiss]);
  return ref;
}

function MenuV2Content(props: MenuV2ContentProps) {
  const { className, children, ...rest } = props;
  const { open, setOpen } = useContext(RootContext);
  const close = useCallback(() => setOpen(false), [setOpen]);
  const ref = useDismiss(close);
  if (!open) return null;
  return createPortal(
    <div
      {...rest}
      ref={ref}
      role="menu"
      data-component="menu-v2-content"
      className={className}
    >
      {children}
    </div>,
    document.body,
  );
}

interface ItemBodyProps {
  shortcut?: ReactNode;
  badge?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
}

function ItemBody(props: ItemBodyProps) {
  return (
    <>
      <span data-slot="menu-v2-item-content">{props.children}</span>
      {props.shortcut === undefined || props.shortcut === null ? null : (
        <span data-slot="menu-v2-item-shortcut">{props.shortcut}</span>
      )}
      {props.badge === undefined || props.badge === null ? null : (
        <span data-slot="menu-v2-item-badge">{props.badge}</span>
      )}
      {props.trailing}
    </>
  );
}

export interface MenuV2ItemProps extends HTMLAttributes<HTMLDivElement> {
  shortcut?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
  onSelect?: () => void;
}

function MenuV2Item(props: MenuV2ItemProps) {
  const { className, children, shortcut, badge, disabled, onSelect, onClick, ...rest } = props;
  const { setOpen } = useContext(RootContext);
  if (disabled) {
    return (
      <div {...rest} role="menuitem" aria-disabled="true" data-component="menu-v2-item" data-disabled="" className={className}>
        <ItemBody shortcut={shortcut} badge={badge}>
          {children}
        </ItemBody>
      </div>
    );
  }
  return (
    <div
      {...rest}
      role="menuitem"
      tabIndex={-1}
      data-component="menu-v2-item"
      className={className}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        onSelect?.();
        setOpen(false);
      }}
    >
      <ItemBody shortcut={shortcut} badge={badge}>
        {children}
      </ItemBody>
    </div>
  );
}

export interface MenuV2CheckboxItemProps extends HTMLAttributes<HTMLDivElement> {
  shortcut?: ReactNode;
  badge?: ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function MenuV2CheckboxItem(props: MenuV2CheckboxItemProps) {
  const { className, children, shortcut, badge, checked, onCheckedChange, onClick, ...rest } = props;
  return (
    <div
      {...rest}
      role="menuitemcheckbox"
      aria-checked={checked ?? false}
      tabIndex={-1}
      data-component="menu-v2-item"
      data-checked={checked ? "" : undefined}
      className={className}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        onCheckedChange?.(!(checked ?? false));
      }}
    >
      <ItemBody
        shortcut={shortcut}
        badge={badge}
        trailing={
          <span data-slot="menu-v2-item-indicator" data-checked={checked ? "" : undefined}>
            <CheckMark />
          </span>
        }
      >
        {children}
      </ItemBody>
    </div>
  );
}

interface RadioGroupContext {
  value?: string;
  onValueChange?: (value: string) => void;
}

const GroupContext = createContext<RadioGroupContext>({});

function MenuV2RadioGroup(props: HTMLAttributes<HTMLDivElement> & RadioGroupContext) {
  const { value, onValueChange, children, ...rest } = props;
  return (
    <GroupContext.Provider value={{ value, onValueChange }}>
      <div {...rest} role="group">
        {children}
      </div>
    </GroupContext.Provider>
  );
}

export interface MenuV2RadioItemProps extends HTMLAttributes<HTMLDivElement> {
  shortcut?: ReactNode;
  badge?: ReactNode;
  value: string;
}

function MenuV2RadioItem(props: MenuV2RadioItemProps) {
  const { className, children, shortcut, badge, value, onClick, ...rest } = props;
  const group = useContext(GroupContext);
  const checked = group.value === value;
  return (
    <div
      {...rest}
      role="menuitemradio"
      aria-checked={checked}
      tabIndex={-1}
      data-component="menu-v2-item"
      data-checked={checked ? "" : undefined}
      className={className}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        group.onValueChange?.(value);
      }}
    >
      <ItemBody
        shortcut={shortcut}
        badge={badge}
        trailing={
          <span data-slot="menu-v2-item-indicator" data-checked={checked ? "" : undefined}>
            <CheckMark />
          </span>
        }
      >
        {children}
      </ItemBody>
    </div>
  );
}

export interface MenuV2SubTriggerProps extends HTMLAttributes<HTMLDivElement> {
  shortcut?: ReactNode;
  badge?: ReactNode;
}

function MenuV2SubTrigger(props: MenuV2SubTriggerProps) {
  const { className, children, shortcut, badge, ...rest } = props;
  return (
    <div {...rest} role="menuitem" aria-haspopup="menu" tabIndex={-1} data-component="menu-v2-item" className={className}>
      <ItemBody shortcut={shortcut} badge={badge} trailing={<ChevronRight />}>
        {children}
      </ItemBody>
    </div>
  );
}

function MenuV2SubContent(props: HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return <div {...rest} role="menu" data-component="menu-v2-content" className={className} />;
}

function MenuV2GroupLabel(props: HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return <div {...rest} data-slot="menu-v2-group-label" className={className} />;
}

function MenuV2Separator(props: HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return <div {...rest} role="separator" data-slot="menu-v2-separator" className={className} />;
}

function MenuV2Group(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} role="group" />;
}

function MenuV2Sub(props: { children?: ReactNode }) {
  return <div data-slot="menu-v2-sub">{props.children}</div>;
}

function MenuV2ContextRoot(props: MenuV2RootProps) {
  return <MenuV2Root {...props} />;
}

function MenuV2ContextTrigger(props: HTMLAttributes<HTMLDivElement>) {
  const { onContextMenu, children, ...rest } = props;
  const { setOpen } = useContext(RootContext);
  return (
    <div
      {...rest}
      data-slot="menu-v2-context-trigger"
      onContextMenu={(event) => {
        onContextMenu?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        setOpen(true);
      }}
    >
      {children}
    </div>
  );
}

function MenuV2ContextContent(props: MenuV2ContentProps) {
  const { className, children, ...rest } = props;
  const { open, setOpen } = useContext(RootContext);
  const close = useCallback(() => setOpen(false), [setOpen]);
  const ref = useDismiss(close);
  if (!open) return null;
  return createPortal(
    <div {...rest} ref={ref} role="menu" data-component="menu-v2-content" className={className}>
      {children}
    </div>,
    document.body,
  );
}

function CheckMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M3.53564 8.17857L6.39279 11.75L12.4642 4.25"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      data-slot="menu-v2-item-chevron"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M6 4L10 8L6 12V4Z" fill="currentColor" />
    </svg>
  );
}

const MenuV2Context = Object.assign(MenuV2ContextRoot, {
  Trigger: MenuV2ContextTrigger,
  Portal: MenuV2Portal,
  Content: MenuV2ContextContent,
});

export const MenuV2 = Object.assign(MenuV2Root, {
  Trigger: MenuV2Trigger,
  Portal: MenuV2Portal,
  Content: MenuV2Content,
  Item: MenuV2Item,
  CheckboxItem: MenuV2CheckboxItem,
  RadioGroup: MenuV2RadioGroup,
  RadioItem: MenuV2RadioItem,
  Group: MenuV2Group,
  GroupLabel: MenuV2GroupLabel,
  Separator: MenuV2Separator,
  Sub: MenuV2Sub,
  SubTrigger: MenuV2SubTrigger,
  SubContent: MenuV2SubContent,
  Context: MenuV2Context,
});
