import { useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import { CATEGORIES } from "../lib/types.js";
import { uid, removeById, updateById } from "../lib/lists.js";
import type { AssetLine, Engagement } from "../lib/types.js";

type Patch = (p: Partial<Engagement>) => void;

function rmError(v: string): string | undefined {
  const s = String(v).replace(/,/g, "").trim();
  if (s === "") return undefined;
  return /^\d+(\.\d{1,2})?$/.test(s) ? undefined : "RM 1,234.56";
}

const helper = createColumnHelper<AssetLine>();

// Asset schedule migrated to TanStack Table (rows) + TanStack Form
// (RM validation at the input Seam). Parent Engagement stays source
// of truth — form fields patch upward on change.
export function AssetTable(props: { assets: AssetLine[]; patch: Patch }): JSX.Element {
  const { assets, patch } = props;
  const set = (id: string, p: Partial<AssetLine>): void =>
    patch({ assets: updateById(assets, id, p) });

  const form = useForm({ defaultValues: { assets } });

  const columns = useMemo(
    () => [
      helper.accessor("description", {
        header: "Asset",
        cell: (ctx) => (
          <input
            value={ctx.getValue()}
            onChange={(e) => set(ctx.row.original.id, { description: e.target.value })}
            placeholder="Asset description"
            style={{ width: "100%" }}
          />
        ),
      }),
      helper.accessor("category", {
        header: "Category",
        cell: (ctx) => (
          <select
            value={ctx.getValue()}
            onChange={(e) =>
              set(ctx.row.original.id, { category: e.target.value as AssetLine["category"] })
            }
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        ),
      }),
      helper.accessor("costRM", {
        header: "Cost / QE (RM)",
        cell: (ctx) => {
          const idx = ctx.row.index;
          const id = ctx.row.original.id;
          return (
            <form.Field
              name={`assets[${idx}].costRM`}
              validators={{ onChange: ({ value }) => rmError(String(value)) }}
            >
              {(field) => (
                <div>
                  <input
                    className="num"
                    value={ctx.getValue()}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      set(id, { costRM: e.target.value });
                    }}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <div className="hint">{String(field.state.meta.errors[0])}</div>
                  )}
                </div>
              )}
            </form.Field>
          );
        },
      }),
      helper.display({
        id: "actions",
        header: "",
        cell: (ctx) => (
          <button
            className="btn ghost"
            onClick={() => patch({ assets: removeById(assets, ctx.row.original.id) })}
          >
            ×
          </button>
        ),
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assets]
  );

  const table = useReactTable({ data: assets, columns, getCoreRowModel: getCoreRowModel() });

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
      {assets.map((a) => (
        <div key={a.id} className="assetbox">
          <div className="row3">
            <div>
              <label className="f">Allowances to prior YA (RM)</label>
              <input
                className="num"
                value={a.allowancesBfRM}
                onChange={(e) => set(a.id, { allowancesBfRM: e.target.value })}
                disabled={a.isNew}
              />
            </div>
            <div>
              <label className="f">Months in use (blank=12)</label>
              <input
                className="num"
                value={a.monthsInUse}
                onChange={(e) => set(a.id, { monthsInUse: e.target.value })}
              />
            </div>
            <div>
              <label className="f">Disposal price (blank=held)</label>
              <input
                className="num"
                value={a.disposalPriceRM}
                onChange={(e) => set(a.id, { disposalPriceRM: e.target.value })}
              />
            </div>
          </div>
          <div className="row3">
            <div>
              <label className="f">Motor total cost (RM)</label>
              <input
                className="num"
                value={a.motorTotalCostRM}
                onChange={(e) => set(a.id, { motorTotalCostRM: e.target.value })}
                disabled={!a.isMotorNonCommercial}
              />
            </div>
            <div>
              <label className="f">Qualifying % (Para 66)</label>
              <input
                className="num"
                value={a.qualifyingPct}
                onChange={(e) => set(a.id, { qualifyingPct: e.target.value })}
                disabled={a.category !== "iba-3"}
              />
            </div>
          </div>
          <div className="checkcol">
            <label className="check">
              <input
                type="checkbox"
                checked={a.isNew}
                onChange={(e) => set(a.id, { isNew: e.target.checked })}
              />
              <span>New</span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={a.isHirePurchase}
                onChange={(e) => set(a.id, { isHirePurchase: e.target.checked })}
              />
              <span>Hire purchase</span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={a.isMotorNonCommercial}
                onChange={(e) => set(a.id, { isMotorNonCommercial: e.target.checked })}
              />
              <span>Non-commercial motor</span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={a.isCommercialVehicle}
                onChange={(e) => set(a.id, { isCommercialVehicle: e.target.checked })}
              />
              <span>Commercial (no cap)</span>
            </label>
          </div>
          {a.isHirePurchase && (
            <div className="row2">
              <div>
                <label className="f">HP capital paid THIS period (RM)</label>
                <input
                  className="num"
                  value={a.hpPaidPeriodRM}
                  onChange={(e) => set(a.id, { hpPaidPeriodRM: e.target.value })}
                />
              </div>
              <div>
                <label className="f">HP cumulative capital paid (RM)</label>
                <input
                  className="num"
                  value={a.hpPaidTotalRM}
                  onChange={(e) => set(a.id, { hpPaidTotalRM: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      ))}
      <button
        className="btn"
        onClick={() =>
          patch({
            assets: [
              ...assets,
              {
                id: uid(),
                description: "",
                category: "cat2-14",
                costRM: "0",
                allowancesBfRM: "0",
                isNew: true,
                isHirePurchase: false,
                hpPaidPeriodRM: "",
                hpPaidTotalRM: "",
                isMotorNonCommercial: false,
                motorTotalCostRM: "",
                isCommercialVehicle: false,
                monthsInUse: "",
                disposalPriceRM: "",
                qualifyingPct: "100",
              },
            ],
          })
        }
      >
        + Asset
      </button>
    </div>
  );
}
