import { useState } from "react";
import { PERSONAL_RELIEF_CAPS_RM, allocatePartnershipShare, computePartnership, formatRM } from "@formc/engine";
import { SECTIONS, blankBusinessUnit, blankPartnershipFirm, standardReliefLines } from "../lib/types.js";
import type {
  AddBackLine,
  BusinessUnit,
  CreditLine,
  DoubleDeductionLine,
  Engagement,
  FirmPartner,
  LossLine,
  PartnerShare,
  PartnershipFirm,
  ReliefLine,
  SourceLine,
} from "../lib/types.js";
import { rmStrToSen, numOr0, senToRMString } from "../lib/rm.js";
import { toPartnershipInput } from "../lib/computation.js";
import { uid, updateById, removeById } from "../lib/lists.js";
import { AssetTable } from "./AssetTable.js";
import { LineTable } from "./LineTable.js";
import { RmInput } from "./RmInput.js";

type Patch = (p: Partial<Engagement>) => void;

function setBusiness(eng: Engagement, patch: Patch, id: string, p: Partial<BusinessUnit>): void {
  patch({ businesses: updateById(eng.businesses, id, p) });
}

function AddBackLinesEditor(props: { lines: AddBackLine[]; onLines: (next: AddBackLine[]) => void }): JSX.Element {
  const { lines, onLines } = props;
  return (
    <LineTable<AddBackLine>
      data={lines}
      onUpdate={(id, p) => onLines(updateById(lines, id, p))}
      onRemove={(id) => onLines(removeById(lines, id))}
      onAdd={() => onLines([...lines, { id: uid(), description: "", amountRM: "0", section: "s.39(1)(c)" }])}
      addLabel="+ Add-back"
      describe={(l) => l.description || "add-back"}
      emptyTitle="No add-backs"
      emptyHint="Depreciation and other non-deductible expenses, each sectioned."
      columns={[
        { header: "Description", cell: (l, set) => (<input value={l.description} onChange={(e) => set({ description: e.target.value })} aria-label="Description" />) },
        { header: "RM", cell: (l, set) => (<RmInput label="Amount (RM)" compact value={l.amountRM} on={(v) => set({ amountRM: v })} placeholder="0.00" />) },
        { header: "Section", cell: (l, set) => (
          <select value={l.section} onChange={(e) => set({ section: e.target.value as AddBackLine["section"] })} aria-label="Section">
            {SECTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        ) },
      ]}
    />
  );
}

function CreditLinesEditor(props: { lines: CreditLine[]; onLines: (next: CreditLine[]) => void }): JSX.Element {
  const { lines, onLines } = props;
  return (
    <LineTable<CreditLine>
      data={lines}
      onUpdate={(id, p) => onLines(updateById(lines, id, p))}
      onRemove={(id) => onLines(removeById(lines, id))}
      onAdd={() => onLines([...lines, { id: uid(), description: "", amountRM: "0", basis: "" }])}
      addLabel="+ Credit"
      describe={(l) => l.description || "credit"}
      emptyTitle="No credits"
      emptyHint="Non-taxable receipts excluded from adjusted income."
      columns={[
        { header: "Description", cell: (l, set) => (<input value={l.description} onChange={(e) => set({ description: e.target.value })} aria-label="Description" />) },
        { header: "RM", cell: (l, set) => (<RmInput label="Amount (RM)" compact value={l.amountRM} on={(v) => set({ amountRM: v })} placeholder="0.00" />) },
        { header: "Basis", cell: (l, set) => (<input value={l.basis} onChange={(e) => set({ basis: e.target.value })} aria-label="Basis" placeholder="e.g. s.4(c)" />) },
      ]}
    />
  );
}

function DoubleLinesEditor(props: { lines: DoubleDeductionLine[]; onLines: (next: DoubleDeductionLine[]) => void }): JSX.Element {
  const { lines, onLines } = props;
  return (
    <LineTable<DoubleDeductionLine>
      data={lines}
      onUpdate={(id, p) => onLines(updateById(lines, id, p))}
      onRemove={(id) => onLines(removeById(lines, id))}
      onAdd={() => onLines([...lines, { id: uid(), description: "", amountRM: "0", authority: "", code: "", capRM: "" }])}
      addLabel="+ Double deduction"
      describe={(l) => l.description || "double deduction"}
      emptyTitle="No double deductions"
      emptyHint="Special deductions with gazette authority."
      columns={[
        { header: "Description", cell: (l, set) => (<input value={l.description} onChange={(e) => set({ description: e.target.value })} aria-label="Description" />) },
        { header: "RM", cell: (l, set) => (<RmInput label="Amount (RM)" compact value={l.amountRM} on={(v) => set({ amountRM: v })} placeholder="0.00" />) },
        { header: "Code", cell: (l, set) => (<input value={l.code} onChange={(e) => set({ code: e.target.value })} aria-label="D1 code" />) },
      ]}
    />
  );
}

function BusinessCard(props: { b: BusinessUnit; eng: Engagement; patch: Patch; onRemove: () => void }): JSX.Element {
  const { b, eng, patch } = props;
  const o = b.schedule3;
  return (
    <div className="assetbox">
      <div className="linerow">
        <input
          value={b.label}
          onChange={(e) => setBusiness(eng, patch, b.id, { label: e.target.value })}
          aria-label="Business name"
          placeholder="e.g. Nasi Lemak Stall"
          className="linerow-main"
        />
        <button type="button" className="btn btn-xs ghost danger" onClick={props.onRemove} aria-label={`Remove ${b.label || "business"}`}>×</button>
      </div>
      <div className="row2">
        <RmInput label="Net profit per accounts (RM)" value={b.netProfitRM} on={(v) => setBusiness(eng, patch, b.id, { netProfitRM: v })} placeholder="0.00" />
        <RmInput label="Unabsorbed CA b/f (RM)" value={b.unabsorbedCaBfRM} on={(v) => setBusiness(eng, patch, b.id, { unabsorbedCaBfRM: v })} placeholder="0.00" />
      </div>
      <h4>Add-backs (each line sectioned)</h4>
      <AddBackLinesEditor lines={b.addBacks} onLines={(next) => setBusiness(eng, patch, b.id, { addBacks: next })} />
      <h4>Non-taxable credits</h4>
      <CreditLinesEditor lines={b.credits} onLines={(next) => setBusiness(eng, patch, b.id, { credits: next })} />
      <h4>Double deductions</h4>
      <DoubleLinesEditor lines={b.doubleDeductions} onLines={(next) => setBusiness(eng, patch, b.id, { doubleDeductions: next })} />
      <h4>Capital allowances — one row per asset</h4>
      <AssetTable assets={b.assets} patch={patch} onAssets={(next) => setBusiness(eng, patch, b.id, { assets: next })} />
      <label className="check">
        <input
          type="checkbox"
          checked={o.enabled}
          onChange={(e) => setBusiness(eng, patch, b.id, { schedule3: { ...o, enabled: e.target.checked } })}
        />
        <span>Use external schedule instead of the per-asset loop above</span>
      </label>
      {o.enabled && (
        <div className="row3">
          <RmInput label="CA deducted (RM)" value={o.caRM} on={(v) => setBusiness(eng, patch, b.id, { schedule3: { ...o, caRM: v } })} placeholder="0.00" />
          <RmInput label="Balancing charge (RM)" value={o.bcRM} on={(v) => setBusiness(eng, patch, b.id, { schedule3: { ...o, bcRM: v } })} placeholder="0.00" />
          <RmInput label="Balancing allowance (RM)" value={o.baRM} on={(v) => setBusiness(eng, patch, b.id, { schedule3: { ...o, baRM: v } })} placeholder="0.00" />
        </div>
      )}
    </div>
  );
}

function PartnerCard(props: { s: PartnerShare; eng: Engagement; patch: Patch; firms: PartnershipFirm[]; onRemove: () => void }): JSX.Element {
  const { s, eng, patch, firms } = props;
  const [firmId, setFirmId] = useState("");
  const [partnerName, setPartnerName] = useState("");
  function auto(): void {
    const allocated = allocatePartnershipShare({
      partnershipAdjustedSen: rmStrToSen(s.firmAdjustedRM),
      totalSalariesSen: rmStrToSen(s.firmSalariesRM),
      totalInterestSen: rmStrToSen(s.firmInterestRM),
      partnerSalarySen: rmStrToSen(s.salaryRM),
      partnerInterestSen: rmStrToSen(s.interestRM),
      ratioPct: numOr0(s.ratioPct),
    });
    const rm = String(allocated / 100);
    patch({ partnerShares: updateById(eng.partnerShares, s.id, { allocatedRM: rm }) });
  }
  const set = (p: Partial<PartnerShare>): void =>
    patch({ partnerShares: updateById(eng.partnerShares, s.id, p) });
  function copyFromFirm(): void {
    const firm = firms.find((f) => f.id === firmId);
    if (!firm) return;
    const result = computePartnership(toPartnershipInput(firm));
    const hit = result.allocations.find((a) => a.name === partnerName) ?? result.allocations[0];
    if (!hit) return;
    const partner = firm.partners.find((p) => p.name === hit.name);
    patch({
      partnerShares: updateById(eng.partnerShares, s.id, {
        partnershipName: firm.name,
        ratioPct: partner?.ratioPct ?? "",
        salaryRM: partner?.salaryRM ?? "",
        interestRM: partner?.interestRM ?? "",
        firmAdjustedRM: senToRMString(result.adjustedSen),
        firmSalariesRM: senToRMString(result.totalSalariesSen),
        firmInterestRM: senToRMString(result.totalInterestSen),
        allocatedRM: senToRMString(hit.totalSen),
      }),
    });
  }
  return (
    <div className="assetbox">
      <div className="linerow">
        <input value={s.partnershipName} onChange={(e) => set({ partnershipName: e.target.value })} aria-label="Partnership name" placeholder="e.g. Ali & Abu Enterprise" className="linerow-main" />
        <button type="button" className="btn btn-xs ghost danger" onClick={props.onRemove} aria-label="Remove partnership share">×</button>
      </div>
      <div className="row3">
        <RmInput label="Profit-sharing % " value={s.ratioPct} kind="pct" on={(v) => set({ ratioPct: v })} placeholder="0–100" />
        <RmInput label="My salary (RM)" value={s.salaryRM} on={(v) => set({ salaryRM: v })} placeholder="0.00" />
        <RmInput label="My interest (RM)" value={s.interestRM} on={(v) => set({ interestRM: v })} placeholder="0.00" />
      </div>
      <div className="row3">
        <RmInput label="Firm adjusted income (RM)" value={s.firmAdjustedRM} on={(v) => set({ firmAdjustedRM: v })} placeholder="0.00" hint="Divisional total" />
        <RmInput label="Firm total salaries (RM)" value={s.firmSalariesRM} on={(v) => set({ firmSalariesRM: v })} placeholder="0.00" />
        <RmInput label="Firm total interest (RM)" value={s.firmInterestRM} on={(v) => set({ firmInterestRM: v })} placeholder="0.00" />
      </div>
      <div className="row2">
        <RmInput label="My apportioned share (RM)" kind="signed" value={s.allocatedRM} on={(v) => set({ allocatedRM: v })} placeholder="0.00" hint="Negative = loss share" />
        <div className="f">
          <span className="field-hint">Salary off the top, balance by ratio</span>
          <button type="button" className="btn btn-xs" onClick={auto}>Auto-allocate</button>
        </div>
      </div>
      {firms.length > 0 && (
        <div className="row3">
          <label className="f">Copy from firm
            <select value={firmId} onChange={(e) => { setFirmId(e.target.value); setPartnerName(""); }} aria-label="Source firm">
              <option value="">— select firm —</option>
              {firms.map((f) => (<option key={f.id} value={f.id}>{f.name || "(unnamed firm)"}</option>))}
            </select>
          </label>
          <label className="f">Partner
            <select value={partnerName} onChange={(e) => setPartnerName(e.target.value)} aria-label="Source partner" disabled={firmId === ""}>
              <option value="">— select partner —</option>
              {(firms.find((f) => f.id === firmId)?.partners ?? []).map((p) => (
                <option key={p.id} value={p.name}>{p.name || "(unnamed)"}</option>
              ))}
            </select>
          </label>
          <div className="f">
            <span className="field-hint">Fills basis + share</span>
            <button type="button" className="btn btn-xs" onClick={copyFromFirm} disabled={firmId === ""}>Copy share</button>
          </div>
        </div>
      )}
    </div>
  );
}

const RELIEF_KEYS = Object.keys(PERSONAL_RELIEF_CAPS_RM);

function setFirm(eng: Engagement, patch: Patch, id: string, p: Partial<PartnershipFirm>): void {
  patch({ partnerships: updateById(eng.partnerships, id, p) });
}

function FirmCard(props: { f: PartnershipFirm; eng: Engagement; patch: Patch; onRemove: () => void }): JSX.Element {
  const { f, eng, patch } = props;
  const preview = computePartnership(toPartnershipInput(f));
  const o = f.schedule3;
  return (
    <div className="assetbox">
      <div className="linerow">
        <input
          value={f.name}
          onChange={(e) => setFirm(eng, patch, f.id, { name: e.target.value })}
          aria-label="Firm name"
          placeholder="e.g. Ali & Abu Enterprise"
          className="linerow-main"
        />
        <button type="button" className="btn btn-xs ghost danger" onClick={props.onRemove} aria-label={`Remove ${f.name || "firm"}`}>×</button>
      </div>
      <div className="row2">
        <RmInput label="Net profit per accounts (RM)" kind="signed" value={f.netProfitRM} on={(v) => setFirm(eng, patch, f.id, { netProfitRM: v })} placeholder="0.00" hint="Negative = firm loss" />
        <RmInput label="Unabsorbed CA b/f (RM)" value={f.unabsorbedCaBfRM} on={(v) => setFirm(eng, patch, f.id, { unabsorbedCaBfRM: v })} placeholder="0.00" />
      </div>
      <h4>Add-backs (each line sectioned)</h4>
      <AddBackLinesEditor lines={f.addBacks} onLines={(next) => setFirm(eng, patch, f.id, { addBacks: next })} />
      <h4>Non-taxable credits</h4>
      <CreditLinesEditor lines={f.credits} onLines={(next) => setFirm(eng, patch, f.id, { credits: next })} />
      <h4>Double deductions</h4>
      <DoubleLinesEditor lines={f.doubleDeductions} onLines={(next) => setFirm(eng, patch, f.id, { doubleDeductions: next })} />
      <h4>Capital allowances — one row per asset</h4>
      <AssetTable assets={f.assets} patch={patch} onAssets={(next) => setFirm(eng, patch, f.id, { assets: next })} />
      <label className="check">
        <input
          type="checkbox"
          checked={o.enabled}
          onChange={(e) => setFirm(eng, patch, f.id, { schedule3: { ...o, enabled: e.target.checked } })}
        />
        <span>Use external schedule instead of the per-asset loop above</span>
      </label>
      {o.enabled && (
        <div className="row3">
          <RmInput label="CA deducted (RM)" value={o.caRM} on={(v) => setFirm(eng, patch, f.id, { schedule3: { ...o, caRM: v } })} placeholder="0.00" />
          <RmInput label="Balancing charge (RM)" value={o.bcRM} on={(v) => setFirm(eng, patch, f.id, { schedule3: { ...o, bcRM: v } })} placeholder="0.00" />
          <RmInput label="Balancing allowance (RM)" value={o.baRM} on={(v) => setFirm(eng, patch, f.id, { schedule3: { ...o, baRM: v } })} placeholder="0.00" />
        </div>
      )}
      <h4>Partners — salary off the top, balance by ratio</h4>
      <LineTable<FirmPartner>
        data={f.partners}
        onUpdate={(id, p) => setFirm(eng, patch, f.id, { partners: updateById(f.partners, id, p) })}
        onRemove={(id) => setFirm(eng, patch, f.id, { partners: removeById(f.partners, id) })}
        onAdd={() => setFirm(eng, patch, f.id, { partners: [...f.partners, { id: uid(), name: "", salaryRM: "", interestRM: "", ratioPct: "" }] })}
        addLabel="+ Partner"
        describe={(m) => m.name || "partner"}
        emptyTitle="No partners"
        emptyHint="Ratios must total 100%."
        columns={[
          { header: "Name", cell: (m, set) => (<input value={m.name} onChange={(e) => set({ name: e.target.value })} aria-label="Partner name" />) },
          { header: "Salary RM", cell: (m, set) => (<RmInput label="Salary (RM)" compact value={m.salaryRM} on={(v) => set({ salaryRM: v })} placeholder="0.00" />) },
          { header: "Interest RM", cell: (m, set) => (<RmInput label="Interest (RM)" compact value={m.interestRM} on={(v) => set({ interestRM: v })} placeholder="0.00" />) },
          { header: "Ratio %", cell: (m, set) => (<RmInput label="Ratio %" compact kind="pct" value={m.ratioPct} on={(v) => set({ ratioPct: v })} placeholder="0–100" />) },
        ]}
      />
      <div className="kv">
        <span className="hint">Divisional {preview.statutorySen < 0 ? "loss" : "income"}</span>
        <span className="num">{formatRM(preview.statutorySen)}</span>
      </div>
      {preview.allocations.map((a) => (
        <div key={a.name} className="kv">
          <span className="hint">{a.name || "(unnamed)"} — salary {formatRM(a.salarySen)} + interest {formatRM(a.interestSen)} + balance {formatRM(a.balanceShareSen)}</span>
          <span className="num">{formatRM(a.totalSen)}</span>
        </div>
      ))}
      {preview.allocationDeltaSen !== 0 && (
        <div className="flag crit">Allocations off divisional by {formatRM(preview.allocationDeltaSen)} — check ratios total 100%.</div>
      )}
      {preview.findings.map((note) => (
        <div key={note} className="flag">{note}</div>
      ))}
    </div>
  );
}

export function FirmsEditor(props: { eng: Engagement; patch: Patch }): JSX.Element {
  const { eng, patch } = props;
  return (
    <div className="card">
      <h3>Partnership firms — divisional computation (Form P)</h3>
      <p className="hint">Each firm computes divisional income like a business source; partners split salary + interest + ratio balance. Tax lands on the partner's Form B.</p>
      {eng.partnerships.map((f) => (
        <FirmCard
          key={f.id}
          f={f}
          eng={eng}
          patch={patch}
          onRemove={() => patch({ partnerships: removeById(eng.partnerships, f.id) })}
        />
      ))}
      <button type="button" className="btn add-action" onClick={() => patch({ partnerships: [...eng.partnerships, blankPartnershipFirm(`Firm ${eng.partnerships.length + 1}`)] })}>
        + Partnership firm
      </button>
    </div>
  );
}

export function BusinessForm(props: { eng: Engagement; patch: Patch }): JSX.Element {
  const { eng, patch } = props;
  return (
    <div>
      <div className="card">
        <h3>Businesses — one P&L per enterprise</h3>
        <p className="hint">Each business computes its own adjusted income and Schedule 3 (individuals use the non-SME small-value cap).</p>
        {eng.businesses.map((b) => (
          <BusinessCard
            key={b.id}
            b={b}
            eng={eng}
            patch={patch}
            onRemove={() => patch({ businesses: removeById(eng.businesses, b.id) })}
          />
        ))}
        <button type="button" className="btn add-action" onClick={() => patch({ businesses: [...eng.businesses, blankBusinessUnit(`Business ${eng.businesses.length + 1}`)] })}>
          + Business
        </button>
      </div>

      <div className="card">
        <h3>Partnership shares (Form P)</h3>
        <p className="hint">Apportioned divisional share per firm — key the firm's Form P figures, auto-allocate, or copy from a firm computed below.</p>
        {eng.partnerShares.map((s) => (
          <PartnerCard
            key={s.id}
            s={s}
            eng={eng}
            patch={patch}
            firms={eng.partnerships}
            onRemove={() => patch({ partnerShares: removeById(eng.partnerShares, s.id) })}
          />
        ))}
        <button
          type="button"
          className="btn add-action"
          onClick={() => patch({ partnerShares: [...eng.partnerShares, { id: uid(), partnershipName: "", allocatedRM: "", ratioPct: "", salaryRM: "", interestRM: "", firmAdjustedRM: "", firmSalariesRM: "", firmInterestRM: "" }] })}
        >
          + Partnership share
        </button>
      </div>

      <FirmsEditor eng={eng} patch={patch} />

      <div className="card">
        <h3>Employment, other sources, losses, CP500</h3>
        <div className="row2">
          <RmInput label="Employment income (RM)" value={eng.employmentRM} on={(v) => patch({ employmentRM: v })} placeholder="0.00" hint="Per EA form" />
          <RmInput label="Approved donations (RM)" value={eng.donationsRM} on={(v) => patch({ donationsRM: v })} placeholder="0.00" hint="s.44(6), capped 10%" />
        </div>
        <h4>Non-business sources (each floored at NIL)</h4>
        <LineTable<SourceLine>
          data={eng.nonBusiness}
          onUpdate={(id, p) => patch({ nonBusiness: updateById(eng.nonBusiness, id, p) })}
          onRemove={(id) => patch({ nonBusiness: removeById(eng.nonBusiness, id) })}
          onAdd={() => patch({ nonBusiness: [...eng.nonBusiness, { id: uid(), label: "", amountRM: "0" }] })}
          addLabel="+ Source"
          describe={(l) => l.label || "source"}
          emptyTitle="No other sources"
          emptyHint="Interest, rental and other s.4(c)–(f) income."
          columns={[
            { header: "Source", cell: (l, set) => (<input value={l.label} onChange={(e) => set({ label: e.target.value })} aria-label="Source" />) },
            { header: "RM", cell: (l, set) => (<RmInput label="Amount (RM)" compact value={l.amountRM} on={(v) => set({ amountRM: v })} placeholder="0.00" />) },
          ]}
        />
        <div className="row3">
          <RmInput label="Current-year loss offset s.44(2) (RM)" value={eng.currentLossOffsetRM} on={(v) => patch({ currentLossOffsetRM: v })} placeholder="0.00" />
          <RmInput label="CP500 estimate (RM)" value={eng.cp500EstimateRM} on={(v) => patch({ cp500EstimateRM: v })} placeholder="0.00" />
          <RmInput label="CP500 paid instalments (RM)" value={eng.cp500PaidRM} on={(v) => patch({ cp500PaidRM: v })} placeholder="0.00" />
        </div>
        <div className="row3">
          <RmInput label="WHT credit (RM)" value={eng.whtCreditRM} on={(v) => patch({ whtCreditRM: v })} placeholder="0.00" />
          <RmInput label="Bilateral credit s.132 (RM)" value={eng.bilateralCreditRM} on={(v) => patch({ bilateralCreditRM: v })} placeholder="0.00" />
          <RmInput label="Rebates — zakat fitrah (RM)" value={eng.rebatesRM} on={(v) => patch({ rebatesRM: v })} placeholder="0.00" hint="Reduce tax, not income" />
        </div>
        <h4>B/F business losses — year of origin</h4>
        <LineTable<LossLine>
          data={eng.bfLosses}
          onUpdate={(id, p) => patch({ bfLosses: updateById(eng.bfLosses, id, p) })}
          onRemove={(id) => patch({ bfLosses: removeById(eng.bfLosses, id) })}
          onAdd={() => patch({ bfLosses: [...eng.bfLosses, { id: uid(), ya: "", amountRM: "0" }] })}
          addLabel="+ Loss year"
          describe={(l) => `YA${l.ya || "?"} loss`}
          emptyTitle="No b/f losses"
          emptyHint="FIFO expiry is automatic (10 years)."
          columns={[
            { header: "YA", cell: (l, set) => (<input value={l.ya} onChange={(e) => set({ ya: e.target.value })} aria-label="Year of assessment" placeholder="e.g. 2023" />) },
            { header: "RM", cell: (l, set) => (<RmInput label="Amount (RM)" compact value={l.amountRM} on={(v) => set({ amountRM: v })} placeholder="0.00" />) },
          ]}
        />
      </div>

      <div className="card">
        <h3>Personal reliefs (s.46–49)</h3>
        <p className="hint">Catalog caps apply automatically — over-claims are cut with a finding on the Report.</p>
        <div className="toolbar no-print">
          <button
            type="button"
            className="btn btn-xs"
            onClick={() => {
              const have = new Set(eng.reliefs.map((r) => r.key));
              patch({ reliefs: [...eng.reliefs, ...standardReliefLines().filter((r) => !have.has(r.key))] });
            }}
          >
            Seed standard reliefs
          </button>
        </div>
        <LineTable<ReliefLine>
          data={eng.reliefs}
          onUpdate={(id, p) => patch({ reliefs: updateById(eng.reliefs, id, p) })}
          onRemove={(id) => patch({ reliefs: removeById(eng.reliefs, id) })}
          onAdd={() => patch({ reliefs: [...eng.reliefs, { id: uid(), key: "other:", label: "", amountRM: "", capRM: "" }] })}
          addLabel="+ Other relief"
          describe={(l) => l.label || l.key}
          emptyTitle="No reliefs"
          emptyHint="Seed the standard set, then key receipt amounts."
          columns={[
            { header: "Relief", cell: (l, set) => (
              l.key.startsWith("other:")
                ? (<input value={l.label} onChange={(e) => set({ label: e.target.value })} aria-label="Relief label" placeholder="e.g. PRS top-up" />)
                : (
                  <select value={l.key} onChange={(e) => {
                    const key = e.target.value;
                    const label = key.split(":")[0] ?? key;
                    set({ key, label: label.charAt(0).toUpperCase() + label.slice(1) });
                  }} aria-label="Relief type">
                    {RELIEF_KEYS.map((k) => (<option key={k} value={k}>{k} (cap RM{PERSONAL_RELIEF_CAPS_RM[k]?.toLocaleString()})</option>))}
                    <option value="other:">Other…</option>
                  </select>
                )
            ) },
            { header: "RM", cell: (l, set) => (<RmInput label="Amount (RM)" compact value={l.amountRM} on={(v) => set({ amountRM: v })} placeholder="0.00" />) },
            { header: "Cap", cell: (l, set) => (
              l.key.startsWith("other:")
                ? (<RmInput label="Cap (RM)" compact value={l.capRM} on={(v) => set({ capRM: v })} placeholder="cap" />)
                : (<span className="hint">{l.label || l.key}: {formatRM((PERSONAL_RELIEF_CAPS_RM[l.key] ?? 0) * 100)}</span>)
            ) },
          ]}
        />
      </div>
    </div>
  );
}
