import { MYTAX_STEPS } from "@formc/engine";
import { useMyTaxCoverage } from "../lib/mytax.js";
import type { Engagement } from "../lib/types.js";
import { mytaxOf } from "../lib/mytax.js";

type Patch = (p: Partial<Engagement>) => void;

function Text(props: {
  label: string;
  value: string;
  ph?: string;
  on: (v: string) => void;
}): JSX.Element {
  return (
    <label className="fld">
      <span>{props.label}</span>
      <input value={props.value} placeholder={props.ph ?? ""} onChange={(e) => props.on(e.target.value)} />
    </label>
  );
}

function Yn(props: { label: string; value: string; on: (v: string) => void }): JSX.Element {
  return (
    <label className="fld">
      <span>{props.label}</span>
      <select value={props.value} onChange={(e) => props.on(e.target.value)}>
        <option value="">-- Sila Pilih --</option>
        <option value="1">Ya</option>
        <option value="2">Tidak</option>
      </select>
    </label>
  );
}

export function MyTaxCoverage(props: { eng: Engagement; patch: Patch }): JSX.Element {
  const { eng, patch } = props;
  const { steps, submitBlockers, result } = useMyTaxCoverage(eng);
  const m = mytaxOf(eng);
  const set = (p: Partial<typeof m>) => patch({ mytax: { ...m, ...p } } as Partial<Engagement>);

  return (
    <div className="card">
      <h3>MyTax mirror — 8 langkah e-C vs enjin</h3>
      <p className="hint">
        Kiri: apa portal minta (susunan sebenar). Kanan: status liputan dari engagement ini.
        Draf boleh simpan; Hantar + tandatangan perlukan kelulusan manusia. Band {result.smeQualifies ? "15/17/24" : "24"} enjin.
      </p>
      <div className="grid2">
        <div>
          <h4>1 · Profil — tarikh & status</h4>
          <Text label="TIN (C …)" value={m.tin} ph="C 60490708070" on={(v) => set({ tin: v })} />
          <Text label="Operasi dd/MM/yyyy" value={m.operasiDate} ph="15/01/2025" on={(v) => set({ operasiDate: v })} />
          <Text label="Perakaunan Dari" value={m.acctFrom} ph="15/01/2025" on={(v) => set({ acctFrom: v })} />
          <Text label="Perakaunan Hingga" value={m.acctTo} ph="31/12/2025" on={(v) => set({ acctTo: v })} />
          <Text label="Asas Dari" value={m.basisFrom} ph="15/01/2025" on={(v) => set({ basisFrom: v })} />
          <Text label="Asas Hingga" value={m.basisTo} ph="31/12/2025" on={(v) => set({ basisTo: v })} />
          <Yn label="Diperbadankan MY" value={m.incorpMY} on={(v) => set({ incorpMY: v as "1" | "2" | "" })} />
          <Text label="Mastautin" value={m.residentCountry} ph="MYS" on={(v) => set({ residentCountry: v })} />
          <label className="fld"><span>Status</span>
            <select value={m.businessStatus} onChange={(e) => set({ businessStatus: e.target.value as typeof m.businessStatus })}>
              <option value="">-- Sila Pilih --</option>
              <option value="1">Beroperasi</option>
              <option value="2">Dorman</option>
              <option value="3">Penggulungan</option>
            </select>
          </label>
          <Yn label="Berhad jaminan" value={m.guaranteeCo} on={(v) => set({ guaranteeCo: v as "1" | "2" | "" })} />
          <Yn label="Badan berkanun" value={m.statutoryBody} on={(v) => set({ statutoryBody: v as "1" | "2" | "" })} />
          <Yn label="PE di MY" value={m.peMY} on={(v) => set({ peMY: v as "1" | "2" | "" })} />
          <Yn label="SPV sekuriti" value={m.spvSecuritisation} on={(v) => set({ spvSecuritisation: v as "1" | "2" | "" })} />
          <Yn label="Terkawal" value={m.controlledCo} on={(v) => set({ controlledCo: v as "1" | "2" | "" })} />
          <Yn label="Asing tanpa syer" value={m.foreignNoShareCo} on={(v) => set({ foreignNoShareCo: v as "1" | "2" | "" })} />
          <Yn label="SME 2B/2C" value={m.smePara2B2C} on={(v) => set({ smePara2B2C: v as "1" | "2" | "" })} />
          <label className="fld"><span>Syer 44(5A)</span>
            <select value={m.shareChange445A} onChange={(e) => set({ shareChange445A: e.target.value as typeof m.shareChange445A })}>
              <option value="">-- Sila Pilih --</option>
              <option value="1">Ya</option>
              <option value="2">Tidak</option>
              <option value="3">Tidak Berkenaan</option>
            </select>
          </label>
          <label className="fld"><span>RKT/RKS</span>
            <select value={m.groupClaim} onChange={(e) => set({ groupClaim: e.target.value as typeof m.groupClaim })}>
              <option value="">-- Sila Pilih --</option>
              <option value="RKT">Menuntut</option>
              <option value="RKS">Menyerah</option>
              <option value="3">Tidak Berkenaan</option>
            </select>
          </label>
        </div>
        <div>
          <h4>2 · Syarikat — pematuhan & meja</h4>
          <Text label="Kaedah refund" value={m.refundMethod} ph="own-malaysia / duitnow / overseas" on={(v) => set({ refundMethod: v })} />
          <Yn label="Dividen individu" value={m.dividendToIndividuals} on={(v) => set({ dividendToIndividuals: v as "1" | "2" | "" })} />
          <Yn label="Baucar dividen" value={m.dividendVoucher} on={(v) => set({ dividendVoucher: v as "1" | "2" | "" })} />
          <Yn label="s139/140A" value={m.controlledTx139_140A} on={(v) => set({ controlledTx139_140A: v as "1" | "2" | "" })} />
          <Yn label="s140C disekat" value={m.interestRestricted140C} on={(v) => set({ interestRestricted140C: v as "1" | "2" | "" })} />
          <Yn label="GLC" value={m.glc} on={(v) => set({ glc: v as "1" | "2" | "" })} />
          <Yn label="Bursa" value={m.listedBursa} on={(v) => set({ listedBursa: v as "1" | "2" | "" })} />
          <Yn label="Induk" value={m.hasParent} on={(v) => set({ hasParent: v as "1" | "2" | "" })} />
          <Text label="Kod perniagaan" value={m.businessCode} ph="46209" on={(v) => set({ businessCode: v })} />
          <Text label="Aktiviti" value={m.businessActivity} on={(v) => set({ businessActivity: v })} />
          <Text label="Juruaudit" value={m.auditorName} on={(v) => set({ auditorName: v })} />
          <Text label="TIN juruaudit" value={m.auditorTin} on={(v) => set({ auditorTin: v })} />
          <h4>Portal read-back</h4>
          <Text label="Band MyTax papar" value={eng.portalSmeBand ?? ""} ph="15/17/24 atau 24" on={(v) => patch({ portalSmeBand: v } as Partial<Engagement>)} />
          <label className="check">
            <input type="checkbox" checked={!!eng.kewanganTied} onChange={(e) => patch({ kewanganTied: e.target.checked } as Partial<Engagement>)} />
            <span>Kewangan (txtL1–52) diikat & imbang kepada TB</span>
          </label>
        </div>
      </div>
      <h4>Liputan langkah</h4>
      <table className="w">
        <thead><tr><th>#</th><th>Portal</th><th>Status</th><th>Kekurangan</th></tr></thead>
        <tbody>
          {steps.map((s) => (
            <tr key={s.id}>
              <td>{s.n}</td>
              <td>{MYTAX_STEPS.find((x) => x.id === s.id)?.portalPath}</td>
              <td>{s.ready ? "✓" : "—"}</td>
              <td className="hint">{s.missing.join("; ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h4>Gate hantar</h4>
      <ul>
        {submitBlockers.map((b, i) => (<li key={i} className="hint">{b}</li>))}
      </ul>
    </div>
  );
}
