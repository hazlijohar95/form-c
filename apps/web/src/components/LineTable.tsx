import { useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

export interface LineRow {
  id: string;
}

const helper = createColumnHelper<LineRow>();

export interface LineColumn<T extends LineRow> {
  header: string;
  cell: (row: T, update: (p: Partial<T>) => void) => JSX.Element;
}

// Shared TanStack Table shell for all linerow editors. Callers declare
// columns; add/remove + table chrome live here.
// Accessible: labelled remove buttons, scroll container, guided empty state.
export function LineTable<T extends LineRow>(props: {
  data: T[];
  columns: LineColumn<T>[];
  onUpdate: (id: string, p: Partial<T>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  addLabel: string;
  describe?: (row: T) => string;
  emptyTitle?: string;
  emptyHint?: string;
}): JSX.Element {
  const { data, columns, onUpdate, onRemove, onAdd, addLabel } = props;
  const describe = props.describe ?? (() => "row");
  const emptyTitle = props.emptyTitle ?? "Nothing here yet";
  const emptyHint = props.emptyHint ?? "Add the first line to get started.";
  const cols = useMemo(
    () => [
      ...columns.map((c, i) =>
        helper.display({
          id: `col-${i}`,
          header: c.header,
          cell: (ctx) => {
            const row = ctx.row.original as T;
            return c.cell(row, (p) => onUpdate(row.id, p));
          },
        })
      ),
      helper.display({
        id: "actions",
        header: "Remove",
        cell: (ctx) => {
          const row = ctx.row.original as T;
          return (
            <button
              type="button"
              className="btn btn-xs ghost danger"
              onClick={() => onRemove(row.id)}
              aria-label={`Remove ${describe(row)}`}
              title={`Remove ${describe(row)}`}
            >
              <span aria-hidden="true">×</span>
            </button>
          );
        },
      }),
    ],
    [columns, onUpdate, onRemove, props]
  );
  const table = useReactTable({ data, columns: cols, getCoreRowModel: getCoreRowModel() });
  if (data.length === 0)
    return (
      <div className="empty">
        <div className="t">{emptyTitle}</div>
        <div className="d">{emptyHint}</div>
        <div>
          <button type="button" className="btn" onClick={onAdd}>
            {addLabel}
          </button>
        </div>
      </div>
    );
  return (
    <div>
      <div className="tscroll">
        <table className="w">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} scope="col">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn add-action" onClick={onAdd}>
        {addLabel}
      </button>
    </div>
  );
}
