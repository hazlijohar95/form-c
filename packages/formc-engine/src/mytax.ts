import type { Sen } from "./money.js";
import { smePortalBand } from "./sme.js";

// ---------------------------------------------------------------------------
// MyTax e-C mirror — portal truth observed 2026-09-11 on eC2025.
// MyTax is the compliance surface (what the portal asks, in what order,
// with what gates). The engine remains the technical prep layer that
// produces the numbers. This module is the bridge: it names every portal
// step, declares what engagement data feeds it, and evaluates readiness.
// Units: portal RM fields are whole-RM or .00; engine uses integer sen.
// ---------------------------------------------------------------------------

export type MyTaxStepId =
  | "profil"
  | "maksykt"
  | "pendapatan"
  | "cukai"
  | "kewangan"
  | "elaun"
  | "tuntutan"
  | "rumusan";

export interface MyTaxStep {
  id: MyTaxStepId;
  n: number;
  title: string;
  portalPath: string;
  portalIds: string[];
  gates: string[];
  engineFeeds: string[];
}

export const MYTAX_STEPS: MyTaxStep[] = [
  {
    id: "profil",
    n: 1,
    title: "Profil (MakAsas)",
    portalPath: "/eC2025/MakAsas",
    portalIds: [
      "MainContent_txtTarikhOperasi",
      "MainContent_txtTarikhMula",
      "MainContent_txtTarikhTutup",
      "MainContent_txtTarikhMulaAsas",
      "MainContent_txtTarikhTutupAsas",
      "MainContent_ddlBadanMsia",
      "MainContent_ddlMastautin",
      "MainContent_ddlStatus_pern",
      "MainContent_ddlBerhad",
      "MainContent_ddlBadan_kanun",
      "MainContent_ddlPE",
      "MainContent_ddlSekuriti",
      "MainContent_ddlKawal",
      "MainContent_ddlAsing",
      "MainContent_ddlSME",
      "MainContent_ddlSyer",
      "MainContent_ddlRKT_RKS",
      "MainContent_btnNext",
    ],
    gates: [
      "all five dates present dd/MM/yyyy",
      "accounting period Dentro basis logic",
      "MakSykt crashes (DateTime.ParseExact) when dates empty — must save Profil first",
    ],
    engineFeeds: ["ya", "companyName", "regNo", "fyeFrom", "fyeTo", "sme", "groupConditionsMet"],
  },
  {
    id: "maksykt",
    n: 2,
    title: "Maklumat Syarikat",
    portalPath: "/eC2025/MakSykt.aspx",
    portalIds: [
      "MainContent_btnHKO",
      "MainContent_btnHKP",
      "MainContent_btnBenefisial",
      "btnSyktInduk",
      "btnHKN",
      "MainContent_btnLuarNegara",
      "MainContent_btnSyktSub",
      "MainContent_btnSyktSubBayar",
      "MainContent_btnEntiti",
      "MainContent_btnNext",
    ],
    gates: [
      "requires Profil dates saved",
      "director / shareholder / beneficial-owner popup tables",
      "dividend, GLC, Bursa, 139/140A, 140C, CbCR, top-up tax flags",
      "auditor block",
    ],
    engineFeeds: ["directors", "shareholders", "declarations", "relatedInterestSen", "taxEbitdaSen"],
  },
  {
    id: "pendapatan",
    n: 3,
    title: "Pendapatan",
    portalPath: "/eC2025/Pendapatan",
    portalIds: ["agregat-statutori", "rugi-bawa-hadapan", "derma", "zakat-2.5%", "relif-kumpulan"],
    gates: ["donations capped 10% aggregate", "zakat capped 2.5% aggregate", "loss offset limited to aggregate"],
    engineFeeds: ["statutoryBeforeIncentivesSen", "nonBusiness", "donationsSen", "zakatSen", "bfLosses"],
  },
  {
    id: "cukai",
    n: 4,
    title: "Cukai Kena Dibayar",
    portalPath: "/eC2025/CukaiKenaDibayar",
    portalIds: ["s6D-rebat-20k", "s110B", "s110-lain", "s132", "s133", "s107C", "s107A(1)(a)"],
    gates: ["s132/s133 capped to gross tax", "s6D rebate capped RM20,000", "SME bands 15/17/24 vs flat 24 must match smeQualifies"],
    engineFeeds: ["chargeableSen", "grossTaxSen", "cp204PaidSen", "whtCreditSen", "bilateralCreditSen", "taxPayableSen"],
  },
  {
    id: "kewangan",
    n: 5,
    title: "Maklumat Kewangan",
    portalPath: "/eC2025/Kewangan.aspx",
    portalIds: ["txtL1..txtL52", "MainContent_txtL1A..", "kod-perniagaan", "aktiviti"],
    gates: ["P&L + balance-sheet sections expandable", "72 text inputs observed", "Kod perniagaan required"],
    engineFeeds: ["netProfitSen", "registerTotalRM"],
  },
  {
    id: "elaun",
    n: 6,
    title: "Elaun (Sch 3 / 7A / 7B)",
    portalPath: "/eC2025/Elaun",
    portalIds: ["jadual-3", "jadual-7A", "jadual-7B", "42(1)-IBA"],
    gates: ["accelerated CA only if applicable", "Sch7A/7B absorbed vs c/f split"],
    engineFeeds: ["totalCaSen", "balancingChargeSen", "residualCfSen", "raAbsorbedSen", "itaAbsorbedSen"],
  },
  {
    id: "tuntutan",
    n: 7,
    title: "Tuntutan (D1–D4, losses, remisi)",
    portalPath: "/eC2025/Tuntutan",
    portalIds: ["D1", "D2-127(3)(b)", "D3-127(3A)", "D4", "129(1)(b)-remisi"],
    gates: ["D1 codes 132/157 with P.U.(A) refs + caps", "loss surrender capped 70%", "s129(1)(b) Ya/Tidak"],
    engineFeeds: ["doubleDeductions", "groupReliefSen", "pioneerExemptSen"],
  },
  {
    id: "rumusan",
    n: 8,
    title: "Rumusan Cukai (preview + sign)",
    portalPath: "/eC2025/RumusanCukai",
    portalIds: ["BAKI", "second-key", "digital-sign", "Hantar"],
    gates: [
      "DRAFT saves are reversible; Hantar + sign is the point of no return",
      "all 7 prior steps complete",
      "SME band shown must match engine",
      "NEVER auto-submit — human signs off",
    ],
    engineFeeds: ["chargeableSen", "grossTaxSen", "taxPayableSen", "filingDeadline"],
  },
];

// ---------------------------------------------------------------------------
// Mirror profile — the MyTax-only facts the computation engine does not
// need for math but the portal demands before it lets you through.
// ---------------------------------------------------------------------------

export interface MyTaxProfile {
  tin: string;
  labuanTin: string;
  employerTin: string;
  operasiDate: string; // dd/MM/yyyy
  incorpMY: "1" | "2" | "";
  residentCountry: string; // e.g. MYS
  acctFrom: string; // dd/MM/yyyy
  acctTo: string;
  basisFrom: string;
  basisTo: string;
  businessStatus: "" | "1" | "2" | "3";
  guaranteeCo: "" | "1" | "2";
  statutoryBody: "" | "1" | "2";
  peMY: "" | "1" | "2";
  spvSecuritisation: "" | "1" | "2";
  controlledCo: "" | "1" | "2";
  foreignNoShareCo: "" | "1" | "2";
  smePara2B2C: "" | "1" | "2";
  shareChange445A: "" | "1" | "2" | "3";
  groupClaim: "" | "RKT" | "RKS" | "3";
  // MakSykt compliance flags (Ya=1 / Tidak=2, free-text where noted)
  refundMethod: string;
  dividendToIndividuals: "" | "1" | "2";
  dividendVoucher: "" | "1" | "2";
  dividendRecipientsOver100k: string;
  foreignEquityPct: string;
  glc: "" | "1" | "2";
  listedBursa: "" | "1" | "2";
  hasParent: "" | "1" | "2";
  controlledTx139_140A: "" | "1" | "2";
  foreignExemptIncome: "" | "1" | "2";
  interestRestricted140C: "" | "1" | "2";
  businessCode: string;
  businessActivity: string;
  auditorName: string;
  auditorTin: string;
}

export function blankMyTaxProfile(): MyTaxProfile {
  return {
    tin: "",
    labuanTin: "",
    employerTin: "",
    operasiDate: "",
    incorpMY: "",
    residentCountry: "",
    acctFrom: "",
    acctTo: "",
    basisFrom: "",
    basisTo: "",
    businessStatus: "",
    guaranteeCo: "",
    statutoryBody: "",
    peMY: "",
    spvSecuritisation: "",
    controlledCo: "",
    foreignNoShareCo: "",
    smePara2B2C: "",
    shareChange445A: "",
    groupClaim: "",
    refundMethod: "",
    dividendToIndividuals: "",
    dividendVoucher: "",
    dividendRecipientsOver100k: "",
    foreignEquityPct: "",
    glc: "",
    listedBursa: "",
    hasParent: "",
    controlledTx139_140A: "",
    foreignExemptIncome: "",
    interestRestricted140C: "",
    businessCode: "",
    businessActivity: "",
    auditorName: "",
    auditorTin: "",
  };
}

export interface CoverageInput {
  profile: MyTaxProfile;
  directors: { name: string }[];
  shareholders: { name: string }[];
  smeQualifies: boolean;
  portalSmeBand: string; // what MyTax shows, e.g. "15/17/24" or "24"
  chargeableSen: Sen;
  grossTaxSen: Sen;
  netProfitTied: boolean;
  kewanganTied: boolean;
  checklistDone: boolean;
}

export interface StepCoverage {
  id: MyTaxStepId;
  n: number;
  title: string;
  ready: boolean;
  missing: string[];
}

const DATE_RE = /^\d{2}\/\d{2}\/\d{4}$/;

function isDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const [d, m, y] = s.split("/").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function coverProfil(p: MyTaxProfile): StepCoverage {
  const missing: string[] = [];
  if (!isDate(p.operasiDate)) missing.push("Tarikh mula beroperasi (dd/MM/yyyy)");
  if (!isDate(p.acctFrom)) missing.push("Tempoh perakaunan Dari");
  if (!isDate(p.acctTo)) missing.push("Tempoh perakaunan Hingga");
  if (!isDate(p.basisFrom)) missing.push("Tempoh asas Dari");
  if (!isDate(p.basisTo)) missing.push("Tempoh asas Hingga");
  if (p.incorpMY !== "1" && p.incorpMY !== "2") missing.push("Diperbadankan di Malaysia Ya/Tidak");
  if (!p.residentCountry) missing.push("Negara Mastautin");
  if (!p.businessStatus) missing.push("Status Perniagaan");
  if (!p.guaranteeCo) missing.push("Syarikat berhad menurut jaminan");
  if (!p.statutoryBody) missing.push("Badan berkanun");
  if (!p.peMY) missing.push("PE di Malaysia");
  if (!p.spvSecuritisation) missing.push("SPV sekuriti bersandarkan aset");
  if (!p.controlledCo) missing.push("Syarikat terkawal");
  if (!p.foreignNoShareCo) missing.push("Syarikat asing tanpa modal syer");
  if (!p.smePara2B2C) missing.push("SME para 2B/2C (RM2.5m / RM50m)");
  if (!p.shareChange445A) missing.push("Perubahan syer 44(5A)");
  if (!p.groupClaim) missing.push("RKT/RKS/Tidak Berkenaan");
  return { id: "profil", n: 1, title: "Profil (MakAsas)", ready: missing.length === 0, missing };
}

export function coverMaksykt(p: MyTaxProfile, profilReady: boolean, directors: { name: string }[], shareholders: { name: string }[]): StepCoverage {
  const missing: string[] = [];
  // Portal truth: MakSykt hard-crashes without Profil dates.
  if (!profilReady) missing.push("Lengkapkan Profil dahulu — portal MakSykt gagal tanpa tarikh (DateTime crash)");
  if (directors.length === 0) missing.push("Maklumat pengarah (popup HKO)");
  if (shareholders.length === 0) missing.push("Maklumat pemegang syer (popup HKP)");
  if (!p.refundMethod) missing.push("Kaedah bayaran balik");
  if (!p.dividendToIndividuals) missing.push("Dividen kepada individu Ya/Tidak");
  if (!p.controlledTx139_140A) missing.push("Transaksi terkawal s139/140A Ya/Tidak");
  if (!p.interestRestricted140C) missing.push("Sekatan faedah s140C Ya/Tidak");
  if (!p.businessCode) missing.push("Kod perniagaan (rujuk kodperniagaan.pdf)");
  if (!p.auditorName) missing.push("Maklumat juruaudit");
  return { id: "maksykt", n: 2, title: "Maklumat Syarikat", ready: missing.length === 0, missing };
}

export function coverRumusanGate(allReady: boolean, checklistDone: boolean, bandMatches: boolean): string[] {
  const blockers: string[] = [];
  if (!allReady) blockers.push("7 langkah sebelum Rumusan belum lengkap");
  if (!checklistDone) blockers.push("senarai semak belum semua done");
  if (!bandMatches) blockers.push("jalur kadar MyTax tidak sepadan dengan enjin (SME 15/17/24 vs rata 24) — berhenti dan flag");
  blockers.push("Draf boleh simpan; Hantar + tandatangan adalah titik tanpa patah balik — kelulusan manusia diperlukan");
  return blockers;
}

export function evaluateCoverage(input: CoverageInput): { steps: StepCoverage[]; submitBlockers: string[] } {
  const profil = coverProfil(input.profile);
  const maksykt = coverMaksykt(input.profile, profil.ready, input.directors, input.shareholders);
  const bandShown = input.portalSmeBand.trim();
  const expectedBand = smePortalBand(input.smeQualifies, false);
  const bandMatches = bandShown === "" || bandShown === expectedBand;
  const steps: StepCoverage[] = [
    profil,
    maksykt,
    {
      id: "pendapatan",
      n: 3,
      title: "Pendapatan",
      ready: input.chargeableSen >= 0,
      missing: input.chargeableSen >= 0 ? [] : ["tiada pendapatan bercukai dikira"],
    },
    {
      id: "cukai",
      n: 4,
      title: "Cukai Kena Dibayar",
      ready: input.grossTaxSen >= 0 && bandMatches,
      missing: bandMatches ? [] : [`jalur ${bandShown || "(kosong)"} ≠ jangkaan ${expectedBand}`],
    },
    {
      id: "kewangan",
      n: 5,
      title: "Maklumat Kewangan",
      ready: input.netProfitTied && input.kewanganTied && input.profile.businessCode !== "",
      missing: [
        ...(input.netProfitTied ? [] : ["P&L belum diikat kepada TB"]),
        ...(input.kewanganTied ? [] : ["kunci kira-kira belum imbang"]),
        ...(input.profile.businessCode ? [] : ["Kod perniagaan kosong"]),
      ],
    },
    { id: "elaun", n: 6, title: "Elaun", ready: input.chargeableSen >= 0 && input.grossTaxSen >= 0, missing: input.chargeableSen >= 0 && input.grossTaxSen >= 0 ? [] : ["enjin belum kira elaun"] },
    {
      id: "tuntutan",
      n: 7,
      title: "Tuntutan",
      ready: bandMatches,
      missing: bandMatches ? [] : [`tuntutan disekat — ${bandShown || "(kosong)"} ≠ jangkaan ${expectedBand}`],
    },
    {
      id: "rumusan",
      n: 8,
      title: "Rumusan Cukai",
      ready: false,
      missing: ["pratonton sahaja — manusia sahkan dan hantar"],
    },
  ];
  const calcReady = steps.slice(0, 7).every((s) => s.ready);
  return { steps, submitBlockers: coverRumusanGate(calcReady, input.checklistDone, bandMatches) };
}
