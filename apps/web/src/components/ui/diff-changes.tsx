import { useMemo } from "react";
import "./diff-changes.css";

export interface DiffCount {
  additions: number;
  deletions: number;
}

export interface DiffChangesProps {
  className?: string;
  changes: DiffCount | DiffCount[];
  variant?: "default" | "bars";
}

const ADD_COLOR = "var(--icon-diff-add-base, var(--success))";
const DELETE_COLOR = "var(--icon-diff-delete-base, var(--critical))";
const NEUTRAL_COLOR = "var(--icon-weak-base, var(--text-weaker))";
const TOTAL_BLOCKS = 5;

export function DiffChanges(props: DiffChangesProps): JSX.Element | null {
  const variant = props.variant ?? "default";

  const { additions, deletions, blocks } = useMemo(() => {
    const list = Array.isArray(props.changes) ? props.changes : [props.changes];
    const adds = list.reduce((acc, d) => acc + (d.additions ?? 0), 0);
    const dels = list.reduce((acc, d) => acc + (d.deletions ?? 0), 0);
    const total = adds + dels;

    let added = 0;
    let deleted = 0;
    let neutral = TOTAL_BLOCKS;

    if (total > 0) {
      if (total < 5) {
        added = adds > 0 ? 1 : 0;
        deleted = dels > 0 ? 1 : 0;
        neutral = TOTAL_BLOCKS - added - deleted;
      } else {
        const ratio = adds > dels ? adds / dels : dels / adds;
        let colored = TOTAL_BLOCKS;
        if (total < 20 || ratio < 4) colored = TOTAL_BLOCKS - 1;
        const addedRaw = (adds / total) * colored;
        const deletedRaw = (dels / total) * colored;
        added = adds > 0 ? Math.max(1, Math.round(addedRaw)) : 0;
        deleted = dels > 0 ? Math.max(1, Math.round(deletedRaw)) : 0;
        if (adds > 0 && adds <= 5) added = Math.min(added, 1);
        if (adds > 5 && adds <= 10) added = Math.min(added, 2);
        if (dels > 0 && dels <= 5) deleted = Math.min(deleted, 1);
        if (dels > 5 && dels <= 10) deleted = Math.min(deleted, 2);
        if (added + deleted > colored) {
          if (addedRaw > deletedRaw) added = colored - deleted;
          else deleted = colored - added;
        }
        neutral = Math.max(0, TOTAL_BLOCKS - added - deleted);
      }
    }

    const visible = [
      ...Array<string>(added).fill(ADD_COLOR),
      ...Array<string>(deleted).fill(DELETE_COLOR),
      ...Array<string>(neutral).fill(NEUTRAL_COLOR),
    ].slice(0, 5);
    return { additions: adds, deletions: dels, blocks: visible };
  }, [props.changes]);

  const total = additions + deletions;
  if (variant === "default" && total <= 0) return null;

  if (variant === "bars") {
    return (
      <div data-component="diff-changes" data-variant="bars" className={props.className}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 14" fill="none" aria-hidden="true">
          <g>
            {blocks.map((color, i) => (
              <rect key={i} x={i * 4} width="2" height="14" rx="1" fill={color} />
            ))}
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div data-component="diff-changes" data-variant="default" className={props.className}>
      <span data-slot="diff-changes-additions">{`+${additions}`}</span>
      <span data-slot="diff-changes-deletions">{`-${deletions}`}</span>
    </div>
  );
}
