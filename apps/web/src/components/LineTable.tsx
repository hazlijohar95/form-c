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
export function LineTable<T extends LineRow>(props: {
  data: T[];
  columns: LineColumn<T>[];
  onUpdate: (id: string, p: Partial<T>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  addLabel: string;
}): JSX.Element {
  const { data, columns, onUpdate, onRemove, onAdd, addLabel } = props;
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
        header: "",
        cell: (ctx) => (
          <button
            className="btn ghost"
            onClick={() => onRemove((ctx.row.original as T).id)}
          >
            ×
          </button>
        ),
      }),
    ],
    [columns, onUpdate, onRemove]
  );
  const table = useReactTable({ data, columns: cols, getCoreRowModel: getCoreRowModel() });
  if (data.length === 0)
    return (
      <div>
        <button className="btn" onClick={onAdd}>
          {addLabel}
        </button>
      </div>
    );
  return (
    <div>
      <table className="w">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} style={{ textAlign: "left" }}>
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
      <button className="btn" onClick={onAdd} style={{ marginTop: 4 }}>
        {addLabel}
      </button>
    </div>
  );
}
