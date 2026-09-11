import type { AddBackSection } from "@formc/engine";
import { CATEGORIES, SECTIONS, uid } from "../lib/types.js";
import type {
  AddBackLine,
  AssetLine,
  CreditLine,
  DoubleDeductionLine,
  Engagement,
  LossLine,
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
  const set = (id: string, p: Partial<AddBackLine>): void =>
    props.patch({ addBacks: props.lines.map((l) => (l.id === id ? { ...l, ...p } : l)) });
  return (
    <div>
      {props.lines.map((l) => (
        <div key={l.id} className="linerow">
          <input
            value={l.description}
            onChange={(e) => set(l.id, { description: e.target.value })}
            placeholder="Description"
            style={{ flex: 3 }}
          />
          <input
            className="num"
            value={l.amountRM}
            onChange={(e) => set(l.id, { amountRM: e.target.value })}
            placeholder="RM"
            style={{ flex: 1 }}
          />
          <select
            value={l.section}
            onChange={(e) => set(l.id, { section: e.target.value as AddBackSection })}
            style={{ flex: 1.4 }}
          >
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            className="btn ghost"
            onClick={() => props.patch({ addBacks: props.lines.filter((x) => x.id !== l.id) })}
          >
            ×
          </button>
        </div>
      ))}
      <button
        className="btn"
        onClick={() =>
          props.patch({
            addBacks: [
              ...props.lines,
              { id: uid(), description: "", amountRM: "0", section: "s.39(1)(d)" },
            ],
          })
        }
      >
        + Add-back line
      </button>
    </div>
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
        <AssetEditor assets={eng.assets} patch={patch} />
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
  const set = (id: string, p: Partial<import("../lib/types.js").NonQualifyingLine>): void =>
    patch({ nonQualifying: eng.nonQualifying.map((l) => (l.id === id ? { ...l, ...p } : l)) });
  return (
    <div>
      {eng.nonQualifying.map((l) => (
        <div key={l.id} className="linerow">
          <input value={l.description} onChange={(e) => set(l.id, { description: e.target.value })} placeholder="e.g. Renovation fit-out" style={{ flex: 2 }} />
          <input className="num" value={l.amountRM} onChange={(e) => set(l.id, { amountRM: e.target.value })} placeholder="RM" style={{ flex: 1 }} />
          <input value={l.reason} onChange={(e) => set(l.id, { reason: e.target.value })} placeholder="Why not plant" style={{ flex: 2 }} />
          <button className="btn ghost" onClick={() => patch({ nonQualifying: eng.nonQualifying.filter((x) => x.id !== l.id) })}>×</button>
        </div>
      ))}
      <button className="btn" onClick={() => patch({ nonQualifying: [...eng.nonQualifying, { id: uid(), description: "", amountRM: "0", reason: "" }] })}>+ Non-qualifying item</button>
    </div>
  );
}

function CreditEditor(props: { lines: CreditLine[]; patch: Patch }): JSX.Element {
  const set = (id: string, p: Partial<CreditLine>): void =>
    props.patch({ credits: props.lines.map((l) => (l.id === id ? { ...l, ...p } : l)) });
  return (
    <div>
      {props.lines.map((l) => (
        <div key={l.id} className="linerow">
          <input value={l.description} onChange={(e) => set(l.id, { description: e.target.value })} placeholder="e.g. Single-tier dividends" style={{ flex: 3 }} />
          <input className="num" value={l.amountRM} onChange={(e) => set(l.id, { amountRM: e.target.value })} placeholder="RM" style={{ flex: 1 }} />
          <input value={l.basis} onChange={(e) => set(l.id, { basis: e.target.value })} placeholder="Basis" style={{ flex: 1.4 }} />
          <button className="btn ghost" onClick={() => props.patch({ credits: props.lines.filter((x) => x.id !== l.id) })}>×</button>
        </div>
      ))}
      <button className="btn" onClick={() => props.patch({ credits: [...props.lines, { id: uid(), description: "", amountRM: "0", basis: "" }] })}>+ Credit line</button>
    </div>
  );
}

function DoubleEditor(props: { lines: DoubleDeductionLine[]; patch: Patch }): JSX.Element {
  const set = (id: string, p: Partial<DoubleDeductionLine>): void =>
    props.patch({ doubleDeductions: props.lines.map((l) => (l.id === id ? { ...l, ...p } : l)) });
  return (
    <div>
      {props.lines.map((l) => (
        <div key={l.id}>
          <div className="linerow">
            <input value={l.description} onChange={(e) => set(l.id, { description: e.target.value })} placeholder="e.g. Statutory audit expenditure" style={{ flex: 3 }} />
            <input className="num" value={l.amountRM} onChange={(e) => set(l.id, { amountRM: e.target.value })} placeholder="RM" style={{ flex: 1 }} />
            <button className="btn ghost" onClick={() => props.patch({ doubleDeductions: props.lines.filter((x) => x.id !== l.id) })}>×</button>
          </div>
          <div className="linerow">
            <input value={l.code} onChange={(e) => set(l.id, { code: e.target.value })} placeholder="D1 code (132/157)" style={{ flex: 1 }} />
            <input value={l.authority} onChange={(e) => set(l.id, { authority: e.target.value })} placeholder="P.U.(A) reference" style={{ flex: 2 }} />
            <input className="num" value={l.capRM} onChange={(e) => set(l.id, { capRM: e.target.value })} placeholder="Cap RM (blank=none)" style={{ flex: 1 }} />
          </div>
        </div>
      ))}
      <button className="btn" onClick={() => props.patch({ doubleDeductions: [...props.lines, { id: uid(), description: "", amountRM: "0", authority: "", code: "", capRM: "" }] })}>+ Double deduction</button>
    </div>
  );
}

function SourceEditor(props: { eng: Engagement; patch: Patch }): JSX.Element {
  const { eng, patch } = props;
  const set = (id: string, p: Partial<import("../lib/types.js").SourceLine>): void =>
    patch({ nonBusiness: eng.nonBusiness.map((l) => (l.id === id ? { ...l, ...p } : l)) });
  return (
    <div>
      {eng.nonBusiness.map((l) => (
        <div key={l.id} className="linerow">
          <input value={l.label} onChange={(e) => set(l.id, { label: e.target.value })} placeholder="e.g. Interest (hibah) s.4(c)" style={{ flex: 3 }} />
          <input className="num" value={l.amountRM} onChange={(e) => set(l.id, { amountRM: e.target.value })} placeholder="RM" style={{ flex: 1 }} />
          <button className="btn ghost" onClick={() => patch({ nonBusiness: eng.nonBusiness.filter((x) => x.id !== l.id) })}>×</button>
        </div>
      ))}
      <button className="btn" onClick={() => patch({ nonBusiness: [...eng.nonBusiness, { id: uid(), label: "", amountRM: "0" }] })}>+ Source</button>
    </div>
  );
}

const WHT_OPTS = ["s.109-interest", "s.109-royalty", "s.109B", "s.107A", "s.109A"];

function WhtEditor(props: { eng: Engagement; patch: Patch }): JSX.Element {
  const { eng, patch } = props;
  const set = (id: string, p: Partial<import("../lib/types.js").WhtLineUI>): void =>
    patch({ whtLines: eng.whtLines.map((l) => (l.id === id ? { ...l, ...p } : l)) });
  return (
    <div>
      {eng.whtLines.map((l) => (
        <div key={l.id} className="linerow">
          <input value={l.description} onChange={(e) => set(l.id, { description: e.target.value })} placeholder="e.g. Management fee to SG" style={{ flex: 3 }} />
          <input className="num" value={l.amountRM} onChange={(e) => set(l.id, { amountRM: e.target.value })} placeholder="RM" style={{ flex: 1 }} />
          <select value={l.section} onChange={(e) => set(l.id, { section: e.target.value })} style={{ flex: 1.2 }}>
            {WHT_OPTS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
          <label className="check"><input type="checkbox" checked={l.remitted} onChange={(e) => set(l.id, { remitted: e.target.checked })} /><span>Remitted</span></label>
          <button className="btn ghost" onClick={() => patch({ whtLines: eng.whtLines.filter((x) => x.id !== l.id) })}>×</button>
        </div>
      ))}
      <button className="btn" onClick={() => patch({ whtLines: [...eng.whtLines, { id: uid(), description: "", amountRM: "0", section: "s.109B", remitted: true }] })}>+ Payment</button>
    </div>
  );
}

function LossEditor(props: { lines: LossLine[]; patch: Patch }): JSX.Element {  const set = (id: string, p: Partial<LossLine>): void =>
    props.patch({ bfLosses: props.lines.map((l) => (l.id === id ? { ...l, ...p } : l)) });
  return (
    <div>
      {props.lines.map((l) => (
        <div key={l.id} className="linerow">
          <input value={l.ya} onChange={(e) => set(l.id, { ya: e.target.value })} placeholder="YA of origin" style={{ flex: 1 }} />
          <input className="num" value={l.amountRM} onChange={(e) => set(l.id, { amountRM: e.target.value })} placeholder="RM b/f" style={{ flex: 2 }} />
          <button className="btn ghost" onClick={() => props.patch({ bfLosses: props.lines.filter((x) => x.id !== l.id) })}>×</button>
        </div>
      ))}
      <button className="btn" onClick={() => props.patch({ bfLosses: [...props.lines, { id: uid(), ya: "2024", amountRM: "0" }] })}>+ Loss year</button>
    </div>
  );
}

function AssetEditor(props: { assets: AssetLine[]; patch: Patch }): JSX.Element {
  const set = (id: string, p: Partial<AssetLine>): void =>
    props.patch({ assets: props.assets.map((a) => (a.id === id ? { ...a, ...p } : a)) });
  return (
    <div>
      {props.assets.map((a) => (
        <div key={a.id} className="assetbox">
          <div className="linerow">
            <input value={a.description} onChange={(e) => set(a.id, { description: e.target.value })} placeholder="Asset description" style={{ flex: 3 }} />
            <select value={a.category} onChange={(e) => set(a.id, { category: e.target.value as AssetLine["category"] })} style={{ flex: 2 }}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <button className="btn ghost" onClick={() => props.patch({ assets: props.assets.filter((x) => x.id !== a.id) })}>×</button>
          </div>
          <div className="row3">
            <div><label className="f">Original cost / QE (RM)</label><input className="num" value={a.costRM} onChange={(e) => set(a.id, { costRM: e.target.value })} /></div>
            <div><label className="f">Allowances to prior YA (RM)</label><input className="num" value={a.allowancesBfRM} onChange={(e) => set(a.id, { allowancesBfRM: e.target.value })} disabled={a.isNew} /></div>
            <div><label className="f">Months in use (blank=12)</label><input className="num" value={a.monthsInUse} onChange={(e) => set(a.id, { monthsInUse: e.target.value })} /></div>
          </div>
          <div className="row3">
            <div><label className="f">Disposal price (blank=held)</label><input className="num" value={a.disposalPriceRM} onChange={(e) => set(a.id, { disposalPriceRM: e.target.value })} /></div>
            <div><label className="f">Motor total cost (RM)</label><input className="num" value={a.motorTotalCostRM} onChange={(e) => set(a.id, { motorTotalCostRM: e.target.value })} disabled={!a.isMotorNonCommercial} /></div>
            <div className="checkcol">
              <label className="check"><input type="checkbox" checked={a.isNew} onChange={(e) => set(a.id, { isNew: e.target.checked })} /><span>New</span></label>
              <label className="check"><input type="checkbox" checked={a.isHirePurchase} onChange={(e) => set(a.id, { isHirePurchase: e.target.checked })} /><span>Hire purchase</span></label>
              <label className="check"><input type="checkbox" checked={a.isMotorNonCommercial} onChange={(e) => set(a.id, { isMotorNonCommercial: e.target.checked })} /><span>Non-commercial motor</span></label>
              <label className="check"><input type="checkbox" checked={a.isCommercialVehicle} onChange={(e) => set(a.id, { isCommercialVehicle: e.target.checked })} /><span>Commercial (no cap)</span></label>
            </div>
          </div>
          {a.isHirePurchase && (
            <div className="row2">
              <div><label className="f">HP capital paid THIS period (RM)</label><input className="num" value={a.hpPaidPeriodRM} onChange={(e) => set(a.id, { hpPaidPeriodRM: e.target.value })} /></div>
              <div><label className="f">HP cumulative capital paid (RM)</label><input className="num" value={a.hpPaidTotalRM} onChange={(e) => set(a.id, { hpPaidTotalRM: e.target.value })} /></div>
            </div>
          )}
        </div>
      ))}
      <button
        className="btn"
        onClick={() =>
          props.patch({
            assets: [...props.assets, { id: uid(), description: "", category: "cat2-14", costRM: "0", allowancesBfRM: "0", isNew: true, isHirePurchase: false, hpPaidPeriodRM: "", hpPaidTotalRM: "", isMotorNonCommercial: false, motorTotalCostRM: "", isCommercialVehicle: false, monthsInUse: "", disposalPriceRM: "" }],
          })
        }
      >
        + Asset
      </button>
    </div>
  );
}
