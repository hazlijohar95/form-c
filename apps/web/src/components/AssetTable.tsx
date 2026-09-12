import { useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { RmInput } from "./RmInput.js";
import { CATEGORIES } from "../lib/types.js";
import { uid, removeById, updateById } from "../lib/lists.js";
import type { AssetLine, Engagement } from "../lib/types.js";

type Patch = (p: Partial<Engagement>) => void;

const helper = createColumnHelper<AssetLine>();

// Asset schedule: TanStack Table rows + validated RmInput cells.
// Parent Engagement stays source of truth — fields patch upward.
export function blankAssetLine(): AssetLine {
  return {
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
  };
}

// `onAssets` scopes the table to a nested asset list (e.g. a Form B
// business unit). Without it the table patches top-level eng.assets —
// existing Company usage is unchanged.
export function AssetTable(props: { assets: AssetLine[]; patch: Patch; onAssets?: (next: AssetLine[]) => void }): JSX.Element {
  const { assets, patch, onAssets } = props;
  const set = (id: string, p: Partial<AssetLine>): void => {
    const next = updateById(assets, id, p);
    if (onAssets) onAssets(next);
    else patch({ assets: next });
  };
  function remove(id: string): void {
    const next = removeById(assets, id);
    if (onAssets) onAssets(next);
    else patch({ assets: next });
  }
  function add(): void {
    const next = [...assets, blankAssetLine()];
    if (onAssets) onAssets(next);
    else patch({ assets: next });
  }

  const columns = useMemo(
    () => [
      helper.accessor("description", {
        header: "Asset",
        cell: (ctx) => (
          <input
            value={ctx.getValue()}
            onChange={(e) => set(ctx.row.original.id, { description: e.target.value })}
            aria-label="Asset description"
          />
        ),
      }),
      helper.accessor("category", {
        header: "Category",
        cell: (ctx) => (
          <select
            aria-label={`Category for ${ctx.row.original.description || "asset"}`}
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
          const id = ctx.row.original.id;
          return (
            <RmInput
              label={`Cost / QE for ${ctx.row.original.description || "asset"} (RM)`}
              compact
              value={ctx.getValue()}
              placeholder="0.00"
              on={(v) => set(id, { costRM: v })}
            />
          );
        },
      }),
      helper.display({
        id: "actions",
        header: "",
        cell: (ctx) => (
          <button
            type="button"
            className="btn btn-xs ghost danger"
            onClick={() => remove(ctx.row.original.id)}
            aria-label={`Remove asset ${ctx.row.original.description || "(unnamed)"}`}
          >
            <span aria-hidden="true">×</span>
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
      {assets.map((a) => (
        <div key={a.id} className="assetbox">
          <div className="row3">
            <RmInput
              label={`Allowances to prior YA (RM)${a.isNew ? " — disabled for new assets" : ""}`}
              value={a.allowancesBfRM}
              on={(v) => set(a.id, { allowancesBfRM: v })}
              placeholder="0.00"
              disabled={a.isNew}
            />
            <RmInput
              label="Months in use"
              hint="Blank = 12"
              kind="int"
              value={a.monthsInUse}
              on={(v) => set(a.id, { monthsInUse: v })}
              placeholder="12"
            />
            <RmInput
              label="Disposal price (RM)"
              hint="Blank = still held"
              value={a.disposalPriceRM}
              on={(v) => set(a.id, { disposalPriceRM: v })}
              placeholder="0.00"
            />
          </div>
          <div className="row3">
            <RmInput
              label={`Motor total cost (RM)${!a.isMotorNonCommercial ? " — enable “Non-commercial motor” to edit" : ""}`}
              value={a.motorTotalCostRM}
              on={(v) => set(a.id, { motorTotalCostRM: v })}
              placeholder="0.00"
              disabled={!a.isMotorNonCommercial}
            />
            <RmInput
              label={`Qualifying % (Para 66)${a.category !== "iba-3" ? " — IBA buildings only" : ""}`}
              kind="pct"
              value={a.qualifyingPct}
              on={(v) => set(a.id, { qualifyingPct: v })}
              placeholder="100"
              disabled={a.category !== "iba-3"}
            />
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
              <RmInput
                label="HP capital paid THIS period (RM)"
                value={a.hpPaidPeriodRM}
                on={(v) => set(a.id, { hpPaidPeriodRM: v })}
                placeholder="0.00"
              />
              <RmInput
                label="HP cumulative capital paid (RM)"
                value={a.hpPaidTotalRM}
                on={(v) => set(a.id, { hpPaidTotalRM: v })}
                placeholder="0.00"
              />
            </div>
          )}
        </div>
      ))}
      <button
        className="btn add-action"
        onClick={add}
      >
        + Asset
      </button>
    </div>
  );
}
