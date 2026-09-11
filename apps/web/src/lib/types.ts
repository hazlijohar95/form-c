import type {
  AddBackSection,
  AssetInput,
  CaCategory,
  MyTaxProfile,
  WhtSection,
} from "@formc/engine";
import { blankMyTaxProfile } from "@formc/engine";

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
  qualifyingPct: string; // industrial building portion, default "100"
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

export interface Shareholder {
  id: string;
  name: string;
  shares: string;
  pct: string;
}

export interface Declaration {
  key: string;
  label: string;
  value: boolean;
}

export function defaultDeclarations(): Declaration[] {
  return [
    { key: "controlled", label: "Controlled transactions (s.139/s.140A)", value: false },
    { key: "ecommerce", label: "E-commerce income", value: false },
    { key: "foreign", label: "Foreign income received in Malaysia", value: false },
    { key: "d1", label: "Part D1 special deduction claim", value: false },
    { key: "incentive", label: "Incentive (PS/ITA/RA) in force", value: false },
    { key: "dormant", label: "Dormant basis period", value: false },
  ];
}

export interface WhtLineUI {
  id: string;
  description: string;
  amountRM: string;
  section: WhtSection;
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
  raQeRM: string;
  raBfRM: string;
  itaAllowanceRM: string;
  itaBfRM: string;
  itaPct: string; // "70" | "100"
  pioneerExemptRM: string;
  groupSurrenderedRM: string;
  groupSurrendererLossRM: string;
  groupConditionsMet: boolean;
  isIhc: boolean;
  shareholders: Shareholder[];
  declarations: Declaration[];
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
  mytax: MyTaxProfile;
  portalSmeBand: string; // what MyTax shows: "15/17/24" | "24" | "" = not yet read
  kewanganTied: boolean; // P&L + balance sheet footed to TB
  updatedAt: string;
}

export { SECTIONS, CATEGORIES, CHECKLIST } from "./constants.js";

import { CHECKLIST } from "./constants.js";

import { numOr0, rmStrToSen } from "./rm.js";
import { uid } from "./lists.js";

export { rmStrToSen, numOr0, senToRMString, hasDebitBalance } from "./rm.js";
export { uid, updateById, removeById } from "./lists.js";

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
        qualifyingPct: "100",
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
    raQeRM: "0",
    raBfRM: "0",
    itaAllowanceRM: "0",
    itaBfRM: "0",
    itaPct: "70",
    pioneerExemptRM: "0",
    groupSurrenderedRM: "0",
    groupSurrendererLossRM: "0",
    groupConditionsMet: false,
    isIhc: false,
    shareholders: [],
    declarations: defaultDeclarations(),
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
    mytax: blankMyTaxProfile(),
    portalSmeBand: "",
    kewanganTied: false,
    updatedAt: new Date().toISOString(),
  };
}

export function toAssetInput(a: AssetLine): AssetInput {
  const pct = numOr0(a.qualifyingPct);
  return {
    id: a.id,
    description: a.description,
    category: a.category,
    costSen: rmStrToSen(a.costRM),
    allowancesBfSen: rmStrToSen(a.allowancesBfRM),
    qualifyingPct: pct > 0 ? Math.min(100, pct) : 100,
    isNew: a.isNew,
    isHirePurchase: a.isHirePurchase,
    hpPaidPeriodSen: a.hpPaidPeriodRM === "" ? undefined : rmStrToSen(a.hpPaidPeriodRM),
    hpPaidTotalSen: a.hpPaidTotalRM === "" ? undefined : rmStrToSen(a.hpPaidTotalRM),
    isMotorNonCommercial: a.isMotorNonCommercial,
    motorTotalCostRM: a.motorTotalCostRM === "" ? undefined : numOr0(a.motorTotalCostRM),
    isCommercialVehicle: a.isCommercialVehicle,
    ownedAtYearEnd: true,
    inUseAtYearEnd: true,
    monthsInUse: a.monthsInUse === "" ? undefined : numOr0(a.monthsInUse),
    disposalPriceSen: a.disposalPriceRM === "" ? undefined : rmStrToSen(a.disposalPriceRM),
  };
}
