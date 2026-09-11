import type {
  AddBackSection,
  AssetInput,
  CaCategory,
} from "@formc/engine";

export interface NamedAmount {
  id: string;
  description: string;
  amountRM: string;
}

export interface AddBackLine extends NamedAmount {
  section: AddBackSection;
}

export interface CreditLine extends NamedAmount {
  basis: string;
}

export interface DoubleDeductionLine extends NamedAmount {
  authority: string;
  code: string; // e-C Part D1 claim code, e.g. 132 / 157
  capRM: string; // statutory cap, blank = none
}

export interface AssetLine {
  id: string;
  description: string;
  category: CaCategory;
  costRM: string; // original QE
  allowancesBfRM: string; // allowances given to prior YA (0 if new)
  isNew: boolean;
  isHirePurchase: boolean;
  hpPaidPeriodRM: string; // capital paid THIS period (HP only)
  hpPaidTotalRM: string; // cumulative capital paid to date (HP only)
  isMotorNonCommercial: boolean;
  motorTotalCostRM: string;
  isCommercialVehicle: boolean;
  monthsInUse: string; // "" = 12
  disposalPriceRM: string; // "" = not disposed
}

export interface NonQualifyingLine {
  id: string;
  description: string;
  amountRM: string;
  reason: string; // e.g. "setting not apparatus (Sch 3 para 2)"
}

export interface Schedule3Override {
  enabled: boolean;
  caRM: string;
  bcRM: string;
  baRM: string;
  reBfRM: string;
  additionsRM: string;
  disposedReRM: string;
  reCfRM: string;
  note: string;
}

export interface Director {
  id: string;
  name: string;
  sharePct: string;
  salaryRM: string;
  loanRM: string;
}

export interface RelatedAccount {
  id: string;
  name: string;
  // 12 month-end balances; negative = debit (advance). s.140B flags any debit.
  balances: string[];
}

export interface Cp204Bill {
  id: string;
  billNo: string;
  amountRM: string;
  paidOn: string; // date; "" = unpaid
  inFY: boolean; // paid within the basis period (vs next Jan)
}

export interface Judgement {
  id: string;
  title: string;
  position: string;
  alternative: string;
  signedOff: boolean;
}

export interface OpenItem {
  id: string;
  title: string;
  whyBlocks: string;
  effect: string;
  resolved: boolean;
}

export interface PriorYear {
  ciRM: string;
  taxRM: string;
  caRM: string;
  lossesBfRM: string;
  unabsorbedCaBfRM: string;
  reBfRM: string; // residual expenditure at 1.1 ("" = not agreed)
  agreed: boolean;
}

export interface RunRecord {
  at: string;
  ciSen: number;
  taxSen: number;
  payableSen: number;
}

export interface LossLine {
  id: string;
  ya: string;
  amountRM: string;
}

export interface WhtLineUI {
  id: string;
  description: string;
  amountRM: string;
  section: string; // s.109-interest | s.109-royalty | s.109B | s.107A | s.109A
  remitted: boolean;
}

export interface SourceLine {
  id: string;
  label: string;
  amountRM: string;
}

export interface Engagement {
  id: string;
  companyName: string;
  regNo: string;
  ya: number;
  fyeFrom: string;
  fyeTo: string;
  paidUpRM: string;
  grossIncRM: string;
  controlsLarge: boolean;
  controlledByLarge: boolean;
  foreignPct: string;
  netProfitRM: string;
  addBacks: AddBackLine[];
  credits: CreditLine[];
  doubleDeductions: DoubleDeductionLine[];
  assets: AssetLine[];
  nonBusiness: SourceLine[];
  whtLines: WhtLineUI[];
  relatedInterestRM: string; // controlled cross-border interest (s.140C)
  taxEbitdaRM: string;
  deemedRatePct: string; // market rate for s.140B on peak debits
  nonQualifying: NonQualifyingLine[];
  registerTotalRM: string; // FA register grand total — control ties QE+nonQ+repairs
  schedule3: Schedule3Override;
  directors: Director[];
  relatedAccounts: RelatedAccount[];
  cp204Bills: Cp204Bill[];
  judgements: Judgement[];
  openItems: OpenItem[];
  priorYear: PriorYear;
  priorCreditRM: string; // prior-YA overpayments held by LHDN (verify on MyTax)
  priorCreditVerified: boolean;
  donationsRM: string;
  zakatRM: string;
  currentLossOffsetRM: string;
  bfLosses: LossLine[];
  unabsorbedCaBfRM: string;
  cp204EstimateRM: string;
  cp204PaidRM: string;
  whtCreditRM: string;
  bilateralCreditRM: string;
  checks: boolean[];
  ingestText: string;
  runs: RunRecord[];
  updatedAt: string;
}

export const SECTIONS: AddBackSection[] = [
  "s.39(1)(a)",
  "s.39(1)(b)",
  "s.39(1)(c)",
  "s.39(1)(d)",
  "s.39(1)(e)",
  "s.39(1)(f)",
  "s.39(1)(l)",
  "s.39(1)(m)",
  "s.39(2)",
  "s.140C",
];

export const CATEGORIES: { value: CaCategory; label: string }[] = [
  { value: "cat1-20", label: "Cat 1 — Heavy/motor (20% AA)" },
  { value: "cat2-14", label: "Cat 2 — General plant (14% AA)" },
  { value: "cat3-10", label: "Cat 3 — Office/furniture (10% AA)" },
  { value: "ict-std", label: "ICT standard (40% IA / 20% AA)" },
  { value: "aca2026", label: "Budget 2026 ACA (20% IA / 40% AA)" },
  { value: "small-value", label: "Small value ≤RM2k (100%)" },
  { value: "iba-3", label: "Industrial building (10% IA / 3% AA)" },
];

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function blankEngagement(): Engagement {
  return {
    id: uid(),
    companyName: "New Client Sdn Bhd",
    regNo: "",
    ya: 2025,
    fyeFrom: "2024-01-01",
    fyeTo: "2024-12-31",
    paidUpRM: "1000000",
    grossIncRM: "2000000",
    controlsLarge: false,
    controlledByLarge: false,
    foreignPct: "0",
    netProfitRM: "500000",
    addBacks: [
      { id: uid(), description: "Depreciation", amountRM: "50000", section: "s.39(1)(c)" },
      { id: uid(), description: "Entertainment (50% portion)", amountRM: "6000", section: "s.39(1)(l)" },
    ],
    credits: [],
    doubleDeductions: [],
    assets: [
      {
        id: uid(),
        description: "General plant",
        category: "cat2-14",
        costRM: "120000",
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
      },
    ],
    nonQualifying: [],
    registerTotalRM: "",
    schedule3: {
      enabled: false, caRM: "0", bcRM: "0", baRM: "0", reBfRM: "0",
      additionsRM: "0", disposedReRM: "0", reCfRM: "0", note: "",
    },
    directors: [],
    relatedAccounts: [],
    cp204Bills: [],
    judgements: [],
    openItems: [],
    priorYear: { ciRM: "", taxRM: "", caRM: "", lossesBfRM: "", unabsorbedCaBfRM: "", reBfRM: "", agreed: false },
    priorCreditRM: "0",
    priorCreditVerified: false,
    nonBusiness: [],
    whtLines: [],
    relatedInterestRM: "0",
    taxEbitdaRM: "0",
    deemedRatePct: "",
    donationsRM: "0",
    zakatRM: "0",
    currentLossOffsetRM: "0",
    bfLosses: [],
    unabsorbedCaBfRM: "0",
    cp204EstimateRM: "0",
    cp204PaidRM: "0",
    whtCreditRM: "0",
    bilateralCreditRM: "0",
    checks: CHECKLIST.map(() => false),
    ingestText: "",
    runs: [],
    updatedAt: new Date().toISOString(),
  };
}

export const CHECKLIST = [
  "P&L net profit tied to TB — no estimates",
  "Depreciation added back [s.39(1)(c)]",
  "General provisions added back; only specific bad debts claimed [s.39(1)(m)]",
  "Entertainment split 50% vs 100% proviso [s.39(1)(l)]",
  "Penalties, fines, private expenses added back [s.39(1)(a),(d)]",
  "Non-resident payments WHT-checked [s.39(2)]",
  "Each asset QE verified; motor caps applied",
  "B/F losses carry year-of-origin; expiry ≤10yr [s.44(5A)]",
  "Donations ≤10%, zakat ≤2.5% of aggregate",
  "SME 5 conditions evidenced; CP204 checked",
];

const KEY = "formc.engagements.v4";
// v1–v3 keys are abandoned AND wiped on load — they may hold real client
// data from earlier builds. No migration: re-key from source.

export function loadAll(): Engagement[] {
  try {
    for (const k of ["formc.engagements.v1", "formc.engagements.v2", "formc.engagements.v3"])
      localStorage.removeItem(k);
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Engagement[];
  } catch {
    return [];
  }
}

export function eraseAll(): void {
  for (const k of ["formc.engagements.v1", "formc.engagements.v2", "formc.engagements.v3", KEY])
    localStorage.removeItem(k);
}

export function saveAll(list: Engagement[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function toAssetInput(a: AssetLine): AssetInput {
  return {
    id: a.id,
    description: a.description,
    category: a.category,
    costSen: rmStrToSen(a.costRM),
    allowancesBfSen: rmStrToSen(a.allowancesBfRM),
    isNew: a.isNew,
    isHirePurchase: a.isHirePurchase,
    hpPaidPeriodSen: a.hpPaidPeriodRM === "" ? undefined : rmStrToSen(a.hpPaidPeriodRM),
    hpPaidTotalSen: a.hpPaidTotalRM === "" ? undefined : rmStrToSen(a.hpPaidTotalRM),
    isMotorNonCommercial: a.isMotorNonCommercial,
    motorTotalCostRM: a.motorTotalCostRM === "" ? undefined : Number(a.motorTotalCostRM),
    isCommercialVehicle: a.isCommercialVehicle,
    ownedAtYearEnd: true,
    inUseAtYearEnd: true,
    monthsInUse: a.monthsInUse === "" ? undefined : Number(a.monthsInUse),
    disposalPriceSen: a.disposalPriceRM === "" ? undefined : rmStrToSen(a.disposalPriceRM),
  };
}

export function rmStrToSen(v: string): number {
  const n = Number(String(v).replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}
