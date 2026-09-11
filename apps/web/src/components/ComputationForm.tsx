import type { AddBackSection } from "@formc/engine";
import { WHT_SECTIONS, isWhtSection } from "@formc/engine";
import { SECTIONS } from "../lib/types.js";
import { AssetTable } from "./AssetTable.js";
import { LineTable } from "./LineTable.js";
import { RmInput } from "./RmInput.js";
import { uid, updateById, removeById } from "../lib/lists.js";
import type {
  AddBackLine,
  CreditLine,
  DoubleDeductionLine,
  Engagement,
  LossLine,
  NonQualifyingLine,
  SourceLine,
  WhtLineUI,
} from "../lib/types.js";

type Patch = (p: Partial<Engagement>) => void;

function Text(props: {
  label: string;
  value: string;
  on: (v: string) => void;
  mono?: boolean;
}): JSX.Element {
  return (
    <div>
      <label className="f">{props.label}</label>
      <input
        className={props.mono ? "num" : ""}
        value={props.value}
        onChange={(e) => props.on(e.target.value)}
      />
    </div>
  );
}

function AddBackEditor(props: { lines: AddBackLine[]; patch: Patch }): JSX.Element {
  return (
    <LineTable<AddBackLine>
      data={props.lines}
      onUpdate={(id, p) => props.patch({ addBacks: updateById(props.lines, id, p) })}
      onRemove={(id) => props.patch({ addBacks: removeById(props.lines, id) })}
      onAdd={() =>
        props.patch({
          addBacks: [...props.lines, { id: uid(), description: "", amountRM: "0", section: "s.39(1)(d)" }],
        })
      }
      addLabel="+ Add-back line"
      columns={[
        {
          header: "Description",
          cell: (l, set) => (
            <input value={l.description} onChange={(e) => set({ description: e.target.value })} placeholder="Description" style={{ width: "100%" }} />
          ),
        },
        {
          header: "RM",
          cell: (l, set) => <RmInput value={l.amountRM} on={(v) => set({ amountRM: v })} placeholder="RM" />,
        },
        {
          header: "Section",
          cell: (l, set) => (
            <select value={l.section} onChange={(e) => set({ section: e.target.value as AddBackSection })}>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          ),
        },
      ]}
    />
  );
}

export function ComputationForm(props: { eng: Engagement; patch: Patch }): JSX.Element {
  const { eng, patch } = props;
  return (
    <div>
      <div className="card">
        <h3>Company &amp; basis period</h3>
        <div className="row2">
          <Text label="Company name" value={eng.companyName} on={(v) => patch({ companyName: v })} />
          <Text label="Reg no" value={eng.regNo} on={(v) => patch({ regNo: v })} />
        </div>
        <div className="row3">
          <div>
            <label className="f">YA</label>
            <select value={eng.ya} onChange={(e) => patch({ ya: Number(e.target.value) })}>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
          <Text label="FYE from" value={eng.fyeFrom} on={(v) => patch({ fyeFrom: v })} />
          <Text label="FYE to" value={eng.fyeTo} on={(v) => patch({ fyeTo: v })} />
        </div>
      </div>

      <div className="card">
        <h3>SME status — all 5 must hold</h3>
        <div className="row2">
          <Text label="Paid-up capital (RM)" value={eng.paidUpRM} on={(v) => patch({ paidUpRM: v })} mono />
          <Text label="Gross business income (RM)" value={eng.grossIncRM} on={(v) => patch({ grossIncRM: v })} mono />
        </div>
        <div className="row3">
          <Text label="Foreign ownership %" value={eng.foreignPct} on={(v) => patch({ foreignPct: v })} mono />
          <label className="check">
            <input
              type="checkbox"
              checked={eng.controlsLarge}
              onChange={(e) => patch({ controlsLarge: e.target.checked })}
            />
            <span>Controls company &gt; RM2.5m</span>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={eng.controlledByLarge}
              onChange={(e) => patch({ controlledByLarge: e.target.checked })}
            />
            <span>Controlled by company &gt; RM2.5m</span>
          </label>
        </div>
      </div>

      <div className="card">
        <h3>Adjusted income working</h3>
        <Text label="Net profit per accounts (RM)" value={eng.netProfitRM} on={(v) => patch({ netProfitRM: v })} mono />
        <h4>Add-backs (each line sectioned)</h4>
        <AddBackEditor lines={eng.addBacks} patch={patch} />
        <h4>Non-taxable credits</h4>
        <CreditEditor lines={eng.credits} patch={patch} />
        <h4>Double deductions (s.34)</h4>
        <DoubleEditor lines={eng.doubleDeductions} patch={patch} />
      </div>

      <div className="card">
        <h3>Capital allowance schedule — one row per asset</h3>
        <AssetTable assets={eng.assets} patch={patch} />
      </div>

      <div className="card">
        <h3>Other sources + cross-border (s.4(c)-(f), WHT, s.140C)</h3>
        <h4>Non-business sources (each floored at NIL)</h4>
        <SourceEditor eng={eng} patch={patch} />
        <h4>Non-resident payments (WHT — unremitted auto-adds back s.39(2))</h4>
        <WhtEditor eng={eng} patch={patch} />
        <div className="row2" style={{ marginTop: 8 }}>
          <Text label="Controlled cross-border interest (RM)" value={eng.relatedInterestRM} on={(v) => patch({ relatedInterestRM: v })} mono />
          <Text label="Tax-EBITDA (RM)" value={eng.taxEbitdaRM} on={(v) => patch({ taxEbitdaRM: v })} mono />
        </div>
        <p className="hint">s.140C: interest above max(RM500k, 20% EBITDA) permanently disallowed.</p>
      </div>

      <div className="card">
        <h3>Incentives, group relief, IHC</h3>
        <div className="row2">
          <Text label="RA qualifying expenditure (RM)" value={eng.raQeRM} on={(v) => patch({ raQeRM: v })} mono />
          <Text label="RA b/f (RM)" value={eng.raBfRM} on={(v) => patch({ raBfRM: v })} mono />
        </div>
        <div className="row3">
          <Text label="ITA allowance (RM)" value={eng.itaAllowanceRM} on={(v) => patch({ itaAllowanceRM: v })} mono />
          <Text label="ITA b/f (RM)" value={eng.itaBfRM} on={(v) => patch({ itaBfRM: v })} mono />
          <div>
            <label className="f">ITA absorbable %</label>
            <select value={eng.itaPct} onChange={(e) => patch({ itaPct: e.target.value })}>
              <option value="70">70% of statutory</option>
              <option value="100">100% of statutory</option>
            </select>
          </div>
        </div>
        <Text label="Pioneer exempt income (RM)" value={eng.pioneerExemptRM} on={(v) => patch({ pioneerExemptRM: v })} mono />
        <h4>Group relief s.44A (all conditions or nothing)</h4>
        <div className="row3">
          <Text label="Loss surrendered (RM)" value={eng.groupSurrenderedRM} on={(v) => patch({ groupSurrenderedRM: v })} mono />
          <Text label="Surrenderer adjusted loss (RM)" value={eng.groupSurrendererLossRM} on={(v) => patch({ groupSurrendererLossRM: v })} mono />
          <label className="check" style={{ alignSelf: "end" }}>
            <input type="checkbox" checked={eng.groupConditionsMet} onChange={(e) => patch({ groupConditionsMet: e.target.checked })} />
            <span>All s.44A conditions met</span>
          </label>
        </div>
        <label className="check">
          <input type="checkbox" checked={eng.isIhc} onChange={(e) => patch({ isIhc: e.target.checked })} />
          <span>Investment holding company (s.60F — flat 24%, no offsets/carry-forwards)</span>
        </label>
      </div>

      <div className="card">
        <h3>Losses, donations, credits, CP204</h3>
        <div className="row2">
          <Text label="Unabsorbed CA b/f (RM)" value={eng.unabsorbedCaBfRM} on={(v) => patch({ unabsorbedCaBfRM: v })} mono />
          <Text label="Current-year loss offset s.44(2) (RM)" value={eng.currentLossOffsetRM} on={(v) => patch({ currentLossOffsetRM: v })} mono />
        </div>
        <div className="row2" style={{ marginTop: 8 }}>
          <Text label="WHT credit (RM)" value={eng.whtCreditRM} on={(v) => patch({ whtCreditRM: v })} mono />
        </div>
        <div className="row2">
          <Text label="Approved donations (RM)" value={eng.donationsRM} on={(v) => patch({ donationsRM: v })} mono />
          <Text label="Company zakat (RM)" value={eng.zakatRM} on={(v) => patch({ zakatRM: v })} mono />
        </div>
        <h4>B/F business losses — year of origin</h4>
        <LossEditor lines={eng.bfLosses} patch={patch} />
        <div className="row2">
          <Text label="Bilateral credit s.132 (RM)" value={eng.bilateralCreditRM} on={(v) => patch({ bilateralCreditRM: v })} mono />
          <Text label="CP204 paid instalments (RM)" value={eng.cp204PaidRM} on={(v) => patch({ cp204PaidRM: v })} mono />
        </div>
        <Text label="CP204 estimate (RM)" value={eng.cp204EstimateRM} on={(v) => patch({ cp204EstimateRM: v })} mono />
        <div className="row2">
          <Text label="Prior-YA credits held by LHDN (RM)" value={eng.priorCreditRM} on={(v) => patch({ priorCreditRM: v })} mono />
          <label className="check" style={{ alignSelf: "end" }}>
            <input type="checkbox" checked={eng.priorCreditVerified} onChange={(e) => patch({ priorCreditVerified: e.target.checked })} />
            <span>Verified on MyTax ledger (unverified credits are excluded from net cash)</span>
          </label>
        </div>
      </div>

      <div className="card">
        <h3>Schedule 3 override (external register basis)</h3>
        <label className="check">
          <input type="checkbox" checked={eng.schedule3.enabled} onChange={(e) => patch({ schedule3: { ...eng.schedule3, enabled: e.target.checked } })} />
          <span>Use external schedule instead of the per-asset loop above</span>
        </label>
        {eng.schedule3.enabled && (
          <>
            <div className="row3">
              <Text label="CA deducted (RM)" value={eng.schedule3.caRM} on={(v) => patch({ schedule3: { ...eng.schedule3, caRM: v } })} mono />
              <Text label="Balancing charge (RM)" value={eng.schedule3.bcRM} on={(v) => patch({ schedule3: { ...eng.schedule3, bcRM: v } })} mono />
              <Text label="Balancing allowance (RM)" value={eng.schedule3.baRM} on={(v) => patch({ schedule3: { ...eng.schedule3, baRM: v } })} mono />
            </div>
            <div className="row3">
              <Text label="RE b/f (RM)" value={eng.schedule3.reBfRM} on={(v) => patch({ schedule3: { ...eng.schedule3, reBfRM: v } })} mono />
              <Text label="Additions (RM)" value={eng.schedule3.additionsRM} on={(v) => patch({ schedule3: { ...eng.schedule3, additionsRM: v } })} mono />
              <Text label="Disposed RE (RM)" value={eng.schedule3.disposedReRM} on={(v) => patch({ schedule3: { ...eng.schedule3, disposedReRM: v } })} mono />
            </div>
            <div className="row2">
              <Text label="RE c/f → next YA (RM)" value={eng.schedule3.reCfRM} on={(v) => patch({ schedule3: { ...eng.schedule3, reCfRM: v } })} mono />
              <Text label="Basis note" value={eng.schedule3.note} on={(v) => patch({ schedule3: { ...eng.schedule3, note: v } })} />
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h3>Non-qualifying register items + register tie</h3>
        <NonQualifyingEditor eng={eng} patch={patch} />
        <Text label="FA register grand total (RM)" value={eng.registerTotalRM} on={(v) => patch({ registerTotalRM: v })} mono />
      </div>
    </div>
  );
}

function NonQualifyingEditor(props: { eng: Engagement; patch: Patch }): JSX.Element {
  const { eng, patch } = props;
  return (
    <LineTable<NonQualifyingLine>
      data={eng.nonQualifying}
      onUpdate={(id, p) => patch({ nonQualifying: updateById(eng.nonQualifying, id, p) })}
      onRemove={(id) => patch({ nonQualifying: removeById(eng.nonQualifying, id) })}
      onAdd={() => patch({ nonQualifying: [...eng.nonQualifying, { id: uid(), description: "", amountRM: "0", reason: "" }] })}
      addLabel="+ Non-qualifying item"
      columns={[
        { header: "Description", cell: (l, set) => (<input value={l.description} onChange={(e) => set({ description: e.target.value })} placeholder="e.g. Renovation fit-out" style={{ width: "100%" }} />) },
        { header: "RM", cell: (l, set) => (<RmInput value={l.amountRM} on={(v) => set({ amountRM: v })} placeholder="RM" />) },
        { header: "Why not plant", cell: (l, set) => (<input value={l.reason} onChange={(e) => set({ reason: e.target.value })} placeholder="Why not plant" style={{ width: "100%" }} />) },
      ]}
    />
  );
}

function CreditEditor(props: { lines: CreditLine[]; patch: Patch }): JSX.Element {
  return (
    <LineTable<CreditLine>
      data={props.lines}
      onUpdate={(id, p) => props.patch({ credits: updateById(props.lines, id, p) })}
      onRemove={(id) => props.patch({ credits: removeById(props.lines, id) })}
      onAdd={() => props.patch({ credits: [...props.lines, { id: uid(), description: "", amountRM: "0", basis: "" }] })}
      addLabel="+ Credit line"
      columns={[
        { header: "Description", cell: (l, set) => (<input value={l.description} onChange={(e) => set({ description: e.target.value })} placeholder="e.g. Single-tier dividends" style={{ width: "100%" }} />) },
        { header: "RM", cell: (l, set) => (<RmInput value={l.amountRM} on={(v) => set({ amountRM: v })} placeholder="RM" />) },
        { header: "Basis", cell: (l, set) => (<input value={l.basis} onChange={(e) => set({ basis: e.target.value })} placeholder="Basis" style={{ width: "100%" }} />) },
      ]}
    />
  );
}

function DoubleEditor(props: { lines: DoubleDeductionLine[]; patch: Patch }): JSX.Element {
  return (
    <div>
      <LineTable<DoubleDeductionLine>
        data={props.lines}
        onUpdate={(id, p) => props.patch({ doubleDeductions: updateById(props.lines, id, p) })}
        onRemove={(id) => props.patch({ doubleDeductions: removeById(props.lines, id) })}
        onAdd={() => props.patch({ doubleDeductions: [...props.lines, { id: uid(), description: "", amountRM: "0", authority: "", code: "", capRM: "" }] })}
        addLabel="+ Double deduction"
        columns={[
          { header: "Description", cell: (l, set) => (<input value={l.description} onChange={(e) => set({ description: e.target.value })} placeholder="e.g. Statutory audit expenditure" style={{ width: "100%" }} />) },
          { header: "RM", cell: (l, set) => (<RmInput value={l.amountRM} on={(v) => set({ amountRM: v })} placeholder="RM" />) },
          { header: "D1 code", cell: (l, set) => (<input value={l.code} onChange={(e) => set({ code: e.target.value })} placeholder="132/157" style={{ width: "100%" }} />) },
          { header: "Authority", cell: (l, set) => (<input value={l.authority} onChange={(e) => set({ authority: e.target.value })} placeholder="P.U.(A)" style={{ width: "100%" }} />) },
          { header: "Cap RM", cell: (l, set) => (<RmInput value={l.capRM} on={(v) => set({ capRM: v })} placeholder="blank=none" />) },
        ]}
      />
    </div>
  );
}

function SourceEditor(props: { eng: Engagement; patch: Patch }): JSX.Element {
  const { eng, patch } = props;
  return (
    <LineTable<SourceLine>
      data={eng.nonBusiness}
      onUpdate={(id, p) => patch({ nonBusiness: updateById(eng.nonBusiness, id, p) })}
      onRemove={(id) => patch({ nonBusiness: removeById(eng.nonBusiness, id) })}
      onAdd={() => patch({ nonBusiness: [...eng.nonBusiness, { id: uid(), label: "", amountRM: "0" }] })}
      addLabel="+ Source"
      columns={[
        { header: "Source", cell: (l, set) => (<input value={l.label} onChange={(e) => set({ label: e.target.value })} placeholder="e.g. Interest (hibah) s.4(c)" style={{ width: "100%" }} />) },
        { header: "RM", cell: (l, set) => (<RmInput value={l.amountRM} on={(v) => set({ amountRM: v })} placeholder="RM" />) },
      ]}
    />
  );
}

const WHT_OPTS = WHT_SECTIONS;

function WhtEditor(props: { eng: Engagement; patch: Patch }): JSX.Element {
  const { eng, patch } = props;
  return (
    <LineTable<WhtLineUI>
      data={eng.whtLines}
      onUpdate={(id, p) => patch({ whtLines: updateById(eng.whtLines, id, p) })}
      onRemove={(id) => patch({ whtLines: removeById(eng.whtLines, id) })}
      onAdd={() => patch({ whtLines: [...eng.whtLines, { id: uid(), description: "", amountRM: "0", section: "s.109B", remitted: true }] })}
      addLabel="+ Payment"
      columns={[
        { header: "Description", cell: (l, set) => (<input value={l.description} onChange={(e) => set({ description: e.target.value })} placeholder="e.g. Management fee to SG" style={{ width: "100%" }} />) },
        { header: "RM", cell: (l, set) => (<RmInput value={l.amountRM} on={(v) => set({ amountRM: v })} placeholder="RM" />) },
        { header: "Section", cell: (l, set) => (
          <select value={l.section} onChange={(e) => { const v = e.target.value; if (isWhtSection(v)) set({ section: v }); }}>
            {WHT_OPTS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        ) },
        { header: "Remitted", cell: (l, set) => (
          <label className="check"><input type="checkbox" checked={l.remitted} onChange={(e) => set({ remitted: e.target.checked })} /><span>Yes</span></label>
        ) },
      ]}
    />
  );
}

function LossEditor(props: { lines: LossLine[]; patch: Patch }): JSX.Element {
  return (
    <LineTable<LossLine>
      data={props.lines}
      onUpdate={(id, p) => props.patch({ bfLosses: updateById(props.lines, id, p) })}
      onRemove={(id) => props.patch({ bfLosses: removeById(props.lines, id) })}
      onAdd={() => props.patch({ bfLosses: [...props.lines, { id: uid(), ya: "2024", amountRM: "0" }] })}
      addLabel="+ Loss year"
      columns={[
        { header: "YA of origin", cell: (l, set) => (<input value={l.ya} onChange={(e) => set({ ya: e.target.value })} placeholder="YA" style={{ width: "100%" }} />) },
        { header: "RM b/f", cell: (l, set) => (<RmInput value={l.amountRM} on={(v) => set({ amountRM: v })} placeholder="RM b/f" />) },
      ]}
    />
  );
}
