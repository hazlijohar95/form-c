import "./diff-changes-v2.css";

export interface DiffChangesCount {
  additions: number;
  deletions: number;
}

export function DiffChanges(props: { className?: string; changes: DiffChangesCount | DiffChangesCount[] }) {
  const { className, changes } = props;
  const list = Array.isArray(changes) ? changes : [changes];
  const additions = list.reduce((acc, diff) => acc + (diff.additions ?? 0), 0);
  const deletions = list.reduce((acc, diff) => acc + (diff.deletions ?? 0), 0);
  const total = additions + deletions;

  if (total <= 0) return null;

  return (
    <div data-component="diff-changes" className={className}>
      <span data-slot="diff-changes-additions">{`+${additions}`}</span>
      <span data-slot="diff-changes-deletions">{`-${deletions}`}</span>
    </div>
  );
}
