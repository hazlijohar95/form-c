import {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type SVGProps,
  type TextareaHTMLAttributes,
} from "react";
import "./line-comment-v2.css";

/** Horizontal "more" glyph for the display-card overflow control. */
export function LineCommentV2OverflowIcon(props: SVGProps<SVGSVGElement>) {
  const { width, height, ["aria-hidden"]: ariaHidden, ...rest } = props;
  return (
    <svg
      {...rest}
      width={width ?? 16}
      height={height ?? 16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={ariaHidden ?? "true"}
    >
      <path d="M2.5 7.5H3.5V8.5H2.5V7.5Z" stroke="currentColor" />
      <path d="M7.5 7.5H8.5V8.5H7.5V7.5Z" stroke="currentColor" />
      <path d="M12.5 7.5H13.5V8.5H12.5V7.5Z" stroke="currentColor" />
    </svg>
  );
}

export interface LineCommentV2Props extends HTMLAttributes<HTMLDivElement> {
  /** Main comment body (text or rich content). */
  comment: ReactNode;
  /** Line / selection context (e.g. "Comment on line 40"). */
  selection: ReactNode;
  /** Typically an overflow menu trigger. */
  actions?: ReactNode;
}

export function LineCommentV2(props: LineCommentV2Props) {
  const { comment, selection, actions, className, ...rest } = props;
  return (
    <div {...rest} data-component="line-comment-v2" data-variant="display" className={className}>
      <div data-slot="line-comment-v2-shell">
        <div data-slot="line-comment-v2-column">
          <div data-slot="line-comment-v2-text">{comment}</div>
          <div data-slot="line-comment-v2-meta">{selection}</div>
        </div>
        {actions === undefined || actions === null ? null : (
          <div data-slot="line-comment-v2-tools">{actions}</div>
        )}
      </div>
    </div>
  );
}

export type LineCommentEditorV2Mention = {
  items: (query: string) => string[] | Promise<string[]>;
};

export interface LineCommentEditorV2Props extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onInput" | "onSubmit"> {
  /** Visible field label above the textarea (default: "Comment"). */
  heading?: ReactNode;
  value: string;
  onInput: (value: string) => void;
  onCancel: () => void;
  onSubmit: (value: string) => void;
  selection: ReactNode;
  placeholder?: string;
  rows?: number;
  cancelLabel?: string;
  submitLabel?: string;
  autofocus?: boolean;
  mention?: LineCommentEditorV2Mention;
}

function pathFilename(path: string) {
  const index = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  if (index === -1) return path;
  return path.slice(index + 1);
}

function pathDirectory(path: string) {
  const index = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  if (index === -1) return "";
  return path.slice(0, index + 1);
}

interface MentionQuery {
  query: string;
  start: number;
  end: number;
}

function readMentionQuery(textarea: HTMLTextAreaElement | null): MentionQuery | undefined {
  if (!textarea) return undefined;
  if (textarea.selectionStart !== textarea.selectionEnd) return undefined;
  const end = textarea.selectionStart ?? 0;
  const match = textarea.value.slice(0, end).match(/@(\S*)$/);
  if (!match) return undefined;
  return { query: match[1] ?? "", start: end - match[0].length, end };
}

export function LineCommentEditorV2(props: LineCommentEditorV2Props) {
  const {
    heading,
    value,
    onInput,
    onCancel,
    onSubmit,
    selection,
    placeholder,
    rows,
    cancelLabel,
    submitLabel,
    autofocus,
    mention,
    className,
    ...rest
  } = props;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionItems, setMentionItems] = useState<string[]>([]);
  const [activePath, setActivePath] = useState<string | undefined>(undefined);
  const mentionSeq = useRef(0);

  const canSubmit = value.trim().length > 0;

  const closeMention = () => {
    setMentionOpen(false);
    setMentionItems([]);
    setActivePath(undefined);
  };

  const syncMention = (query: MentionQuery | undefined, loader: LineCommentEditorV2Mention | undefined) => {
    if (!query || !loader) {
      closeMention();
      return;
    }
    const seq = mentionSeq.current + 1;
    mentionSeq.current = seq;
    void Promise.resolve(loader.items(query.query)).then((paths) => {
      if (mentionSeq.current !== seq) return;
      if (paths.length === 0) {
        closeMention();
        return;
      }
      setMentionItems(paths.slice(0, 10));
      setActivePath((prev) => (prev && paths.includes(prev) ? prev : paths[0]));
      setMentionOpen(true);
    });
  };

  const refreshMention = () => {
    if (!mention) {
      closeMention();
      return;
    }
    if (mentionOpen === false && mentionItems.length === 0) {
      const query = readMentionQuery(textareaRef.current);
      syncMention(query, mention);
      return;
    }
    const query = readMentionQuery(textareaRef.current);
    syncMention(query, mention);
  };

  const selectMention = (path: string | undefined) => {
    if (!path) return;
    const textarea = textareaRef.current;
    const query = readMentionQuery(textarea);
    if (!textarea || !query) return;
    const next = `${textarea.value.slice(0, query.start)}@${path} ${textarea.value.slice(query.end)}`;
    const cursor = query.start + path.length + 2;
    onInput(next);
    closeMention();
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const selectActiveMention = () => {
    if (mentionItems.length === 0) return;
    const active = activePath && mentionItems.includes(activePath) ? activePath : mentionItems[0];
    selectMention(active);
  };

  const submit = () => {
    const v = value.trim();
    if (!v) return;
    onSubmit(v);
  };

  useEffect(() => {
    if (autofocus === false) return;
    const frame = requestAnimationFrame(() => textareaRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [autofocus]);

  const onTextareaKeyDown: TextareaHTMLAttributes<HTMLTextAreaElement>["onKeyDown"] = (event) => {
    event.stopPropagation();
    if (event.nativeEvent.isComposing) return;

    if (mentionOpen && mentionItems.length > 0) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMention();
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        selectActiveMention();
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setActivePath((prev) => {
          const index = mentionItems.indexOf(prev ?? "");
          if (event.key === "ArrowDown") return mentionItems[(index + 1) % mentionItems.length];
          return mentionItems[(index - 1 + mentionItems.length) % mentionItems.length];
        });
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        selectActiveMention();
        return;
      }
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.currentTarget.blur();
      onCancel();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div {...rest} data-component="line-comment-v2" data-variant="editor" className={className}>
      <div data-slot="line-comment-v2-shell">
        <div data-slot="line-comment-v2-field">
          <div data-slot="line-comment-v2-label">{heading ?? "Comment"}</div>
          <textarea
            ref={textareaRef}
            data-slot="line-comment-v2-textarea"
            rows={rows ?? 3}
            placeholder={placeholder ?? "Add a comment…"}
            value={value}
            onChange={(event) => {
              onInput(event.currentTarget.value);
              refreshMention();
            }}
            onClick={() => refreshMention()}
            onSelect={() => refreshMention()}
            onKeyDown={onTextareaKeyDown}
          />
          {mentionOpen && mentionItems.length > 0 ? (
            <div data-slot="line-comment-v2-mention-list" role="listbox">
              {mentionItems.map((path) => {
                const directory = path.endsWith("/") ? path : pathDirectory(path);
                const name = path.endsWith("/") ? "" : pathFilename(path);
                return (
                  <button
                    key={path}
                    type="button"
                    role="option"
                    aria-selected={activePath === path}
                    data-slot="line-comment-v2-mention-item"
                    data-active={activePath === path ? "" : undefined}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActivePath(path)}
                    onClick={() => selectMention(path)}
                  >
                    <div data-slot="line-comment-v2-mention-path">
                      <span data-slot="line-comment-v2-mention-dir">{directory}</span>
                      {name ? <span data-slot="line-comment-v2-mention-file">{name}</span> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <div data-slot="line-comment-v2-footer">
          <div data-slot="line-comment-v2-footer-meta">{selection}</div>
          <div data-slot="line-comment-v2-footer-actions">
            <button type="button" data-component="button-v2" data-variant="neutral" data-size="normal" onClick={() => onCancel()}>
              {cancelLabel ?? "Cancel"}
            </button>
            <button
              type="button"
              data-component="button-v2"
              data-variant="contrast"
              data-size="normal"
              disabled={!canSubmit}
              onClick={submit}
            >
              {submitLabel ?? "Comment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
