import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import "./list.css";
import { Icon, type IconName } from "./icon";
import { IconButton } from "./icon-button";

export interface ListSearchProps {
  placeholder?: string;
  autofocus?: boolean;
  hideIcon?: boolean;
  className?: string;
  action?: ReactNode;
}

export interface ListAddProps {
  className?: string;
  render: () => ReactNode;
}

export interface ListGroup<T> {
  category: string;
  items: T[];
}

export interface ListProps<T> {
  items: T[];
  keyOf: (item: T) => string;
  render: (item: T) => ReactNode;
  className?: string;
  emptyMessage?: ReactNode;
  loading?: boolean;
  loadingMessage?: ReactNode;
  filterText?: string;
  filterBy?: (item: T, query: string) => boolean;
  groupBy?: (item: T) => string;
  groupHeader?: (group: ListGroup<T>) => ReactNode;
  current?: T | null;
  activeIcon?: IconName;
  divider?: boolean;
  search?: ListSearchProps | boolean;
  itemWrapper?: (item: T, node: ReactNode) => ReactNode;
  onSelect?: (item: T, index: number) => void;
  onMove?: (item: T | undefined) => void;
  onFilter?: (value: string) => void;
  onKeyEvent?: (event: KeyboardEvent, item: T | undefined) => void;
  add?: ListAddProps;
}

export interface ListRef {
  onKeyDown: (e: KeyboardEvent) => void;
  setFilter: (value: string) => void;
}

function defaultFilterBy<T>(item: T, query: string): boolean {
  return String(item).toLowerCase().includes(query.toLowerCase());
}

function ListInner<T>(props: ListProps<T>, forwarded: ForwardedRef<ListRef>): JSX.Element {
  const [internalFilter, setInternalFilter] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const query = props.filterText ?? internalFilter;

  useEffect(() => {
    if (props.filterText !== undefined) setInternalFilter(props.filterText);
  }, [props.filterText]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return props.items;
    const by = props.filterBy ?? defaultFilterBy;
    return props.items.filter((item) => by(item, q));
  }, [props.items, props.filterBy, query]);

  const groups = useMemo<ListGroup<T>[]>(() => {
    if (!props.groupBy) return filtered.length > 0 ? [{ category: "", items: filtered }] : [];
    const map = new Map<string, T[]>();
    for (const item of filtered) {
      const category = props.groupBy(item);
      const list = map.get(category);
      if (list) list.push(item);
      else map.set(category, [item]);
    }
    return [...map.entries()].map(([category, items]) => ({ category, items }));
  }, [filtered, props.groupBy]);

  const activeItem = useMemo(
    () => filtered.find((item) => props.keyOf(item) === activeKey),
    [filtered, activeKey, props],
  );

  useEffect(() => {
    props.onMove?.(activeItem);
  }, [activeItem, props]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [query]);

  const applyFilter = (value: string): void => {
    setInternalFilter(value);
    props.onFilter?.(value);
  };

  const select = (item: T, index: number): void => {
    props.onSelect?.(item, index);
  };

  const move = (delta: 1 | -1): void => {
    if (filtered.length === 0) return;
    const index = filtered.findIndex((item) => props.keyOf(item) === activeKey);
    const next = index < 0 ? (delta === 1 ? 0 : filtered.length - 1) : (index + delta + filtered.length) % filtered.length;
    const item = filtered[next];
    if (item) setActiveKey(props.keyOf(item));
  };

  const handleKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape") return;
    const index = filtered.findIndex((item) => props.keyOf(item) === activeKey);
    const selected = index >= 0 ? filtered[index] : undefined;
    props.onKeyEvent?.(e, selected);
    if (e.defaultPrevented) return;
    if (e.key === "Enter" && selected) {
      e.preventDefault();
      select(selected, index);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    }
  };

  useImperativeHandle(forwarded, () => ({
    onKeyDown: handleKey,
    setFilter: applyFilter,
  }));

  const searchProps: ListSearchProps = typeof props.search === "object" ? props.search : {};
  const showSearch = props.search !== undefined && props.search !== false;

  const emptyContent = (): ReactNode => {
    if (props.loading) return props.loadingMessage ?? "Loading…";
    if (props.emptyMessage) return props.emptyMessage;
    if (!query) return "No items";
    return (
      <>
        <span>No results for </span>
        <span data-slot="list-filter">&quot;{query}&quot;</span>
      </>
    );
  };

  const renderAdd = (): ReactNode => {
    if (!props.add) return null;
    return <div data-slot="list-item-add" className={props.add.className}>{props.add.render()}</div>;
  };

  return (
    <div data-component="list" className={props.className}>
      {showSearch ? (
        <div data-slot="list-search-wrapper">
          <div
            data-slot="list-search"
            className={searchProps.className}
            onPointerDown={(e) => {
              const container = e.currentTarget;
              const node = container.querySelector("input");
              (node ?? inputRef.current)?.focus();
              e.stopPropagation();
            }}
          >
            <div data-slot="list-search-container">
              {searchProps.hideIcon ? null : <Icon name="magnifying-glass" />}
              <input
                ref={inputRef}
                data-slot="list-search-input"
                type="text"
                autoFocus={searchProps.autofocus}
                value={query}
                onChange={(e) => applyFilter(e.target.value)}
                onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => handleKey(e.nativeEvent)}
                placeholder={searchProps.placeholder}
                spellCheck={false}
                autoCorrect="off"
                autoComplete="off"
                autoCapitalize="off"
              />
            </div>
            {query ? (
              <IconButton
                icon="circle-x"
                variant="ghost"
                aria-label="Clear filter"
                onClick={() => {
                  applyFilter("");
                  window.setTimeout(() => inputRef.current?.focus(), 0);
                }}
              />
            ) : null}
          </div>
          {searchProps.action}
        </div>
      ) : null}
      <div ref={scrollRef} data-slot="list-scroll">
        {filtered.length === 0 && !props.add ? (
          <div data-slot="list-empty-state">
            <div data-slot="list-message">{emptyContent()}</div>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.category} data-slot="list-group">
              {group.category ? (
                <div data-slot="list-header">{props.groupHeader?.(group) ?? group.category}</div>
              ) : null}
              <div data-slot="list-items">
                {group.items.map((item) => {
                  const key = props.keyOf(item);
                  const index = filtered.indexOf(item);
                  const isCurrent = props.current !== undefined && props.current !== null && item === props.current;
                  const node = (
                    <button
                      key={key}
                      type="button"
                      data-slot="list-item"
                      data-key={key}
                      data-active={key === activeKey}
                      data-selected={isCurrent}
                      onClick={() => select(item, index)}
                      onMouseMove={(e) => {
                        if (e.movementX === 0 && e.movementY === 0) return;
                        setActiveKey(key);
                      }}
                    >
                      {props.render(item)}
                      {isCurrent ? (
                        <span data-slot="list-item-selected-icon">
                          <Icon name="check-small" />
                        </span>
                      ) : null}
                      {props.activeIcon ? (
                        <span data-slot="list-item-active-icon">
                          <Icon name={props.activeIcon} />
                        </span>
                      ) : null}
                      {props.divider ? <span data-slot="list-item-divider" /> : null}
                    </button>
                  );
                  if (props.itemWrapper) return <span key={key}>{props.itemWrapper(item, node)}</span>;
                  return node;
                })}
                {props.add ? renderAdd() : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export const List = forwardRef(ListInner) as <T>(
  props: ListProps<T> & { ref?: Ref<ListRef> },
) => JSX.Element;
