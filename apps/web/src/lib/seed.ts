import { blankBusinessUnit, blankEngagement, blankPartnershipFirm, standardReliefLines, uid } from "./types.js";
import type { Engagement } from "./types.js";
import { ensureDocuments } from "./onboarding.js";
import { CHECKLIST_B, CHECKLIST_P } from "./constants.js";

// Synthetic demo engagement — entirely fictional figures for a fictional
// company. NEVER seed real client data here. Must reproduce:
// CI 82,679.95 → Form C 82,679 → tax 12,401.85 → balance 1,001.85.
export function demoSeed(): Engagement {
  const e = blankEngagement();
  return {
    ...e,
    id: uid(),
    companyName: "Demo Bakery Sdn Bhd",
    regNo: "C 00000000000",
    ya: 2025,
    fyeFrom: "2025-01-01",
    fyeTo: "2025-12-31",
    paidUpRM: "80000",
    grossIncRM: "1450000.60",
    foreignPct: "0",
    netProfitRM: "62400",
    addBacks: [
      { id: uid(), description: "Depreciation of PPE", amountRM: "38120.50", section: "s.39(1)(b)" },
      { id: uid(), description: "Statutory audit fee", amountRM: "7500", section: "s.39(1)(d)" },
      { id: uid(), description: "Tax filing fee, net", amountRM: "420", section: "s.39(1)(d)" },
    ],
    credits: [
      { id: uid(), description: "Interest income (hibah)", amountRM: "95.30", basis: "s.4(c)" },
      { id: uid(), description: "Gain on disposal of plant", amountRM: "6200", basis: "capital receipt" },
      { id: uid(), description: "Repairs capitalised in accounts", amountRM: "4100", basis: "s.33(1)" },
    ],
    doubleDeductions: [
      { id: uid(), description: "Statutory audit expenditure", amountRM: "7500", authority: "P.U.(A) 129/2006", code: "132", capRM: "" },
      { id: uid(), description: "Secretarial and tax filing fee", amountRM: "420", authority: "P.U.(A) 162/2020", code: "157", capRM: "15000" },
    ],
    assets: [],
    schedule3: {
      enabled: true,
      caRM: "12340.55", bcRM: "4800", baRM: "0",
      reBfRM: "18200.40", additionsRM: "3150", disposedReRM: "900", reCfRM: "8109.85",
      note: "External register schedule (demo)",
    },
    nonQualifying: [
      { id: uid(), description: "Renovation fit-out (setting, not plant)", amountRM: "280000", reason: "Sch 3 para 2" },
    ],
    registerTotalRM: "500000",
    directors: [
      { id: uid(), name: "Pengarah A", sharePct: "50", salaryRM: "48000", loanRM: "15000" },
      { id: uid(), name: "Pengarah B (MD)", sharePct: "50", salaryRM: "46000", loanRM: "12000" },
    ],
    nonBusiness: [
      { id: uid(), label: "Interest (hibah) s.4(c)", amountRM: "95.30" },
    ],
    cp204EstimateRM: "11400",
    cp204PaidRM: "11400",
    priorCreditRM: "500",
    priorCreditVerified: false,
    priorYear: { ciRM: "", taxRM: "", caRM: "21000", lossesBfRM: "0", unabsorbedCaBfRM: "0", reBfRM: "", agreed: true },
    judgements: [
      { id: uid(), title: "Renovation excluded from qualifying pool", position: "Setting, not apparatus (Sch 3 para 2)", alternative: "Include at AA 10%", signedOff: false },
      { id: uid(), title: "Machine disposal + balancing charge", position: "Proceeds less RE, capped at allowances given", alternative: "Leave in revenue — overstates turnover", signedOff: false },
    ],
    openItems: [
      { id: uid(), title: "Agent Sch 3 + RE by pool at prior year-end", whyBlocks: "RE b/f modelled against filed CA", effect: "Tax range material — obtain schedule", resolved: false },
    ],
  };
}

// Synthetic Form B demo — sole proprietor, one business + employment.
// Must reproduce: statutory 156,000 − reliefs 13,000 → CI 143,000 →
// tax 20,150 → less CP500 12,000 → balance 8,150.
export function demoSeedB(): Engagement {
  const e = blankEngagement();
  const business = blankBusinessUnit("Nasi Lemak Stall");
  business.netProfitRM = "120000";
  business.addBacks = [
    { id: uid(), description: "Depreciation of equipment", amountRM: "12000", section: "s.39(1)(c)" },
  ];
  const reliefs = standardReliefLines().filter((l) => l.key === "self" || l.key === "epf");
  reliefs[0]!.amountRM = "9000";
  reliefs[1]!.amountRM = "4000";
  const docs = ensureDocuments([], "B").map((d) => ({ ...d, status: "received" as const }));
  return {
    ...e,
    id: uid(),
    formType: "B",
    companyName: "Demo Ahmad (Sole Prop)",
    regNo: "ROB 000000000",
    ya: 2025,
    fyeFrom: "2025-01-01",
    fyeTo: "2025-12-31",
    documents: docs,
    businesses: [business],
    partnerShares: [],
    employmentRM: "24000",
    reliefs,
    rebatesRM: "0",
    donationsRM: "0",
    currentLossOffsetRM: "0",
    bfLosses: [],
    unabsorbedCaBfRM: "0",
    cp500EstimateRM: "12000",
    cp500PaidRM: "12000",
    whtCreditRM: "0",
    bilateralCreditRM: "0",
    priorCreditRM: "0",
    priorCreditVerified: false,
    priorYear: { ciRM: "", taxRM: "", caRM: "", lossesBfRM: "", unabsorbedCaBfRM: "", reBfRM: "", agreed: true },
    judgements: [],
    openItems: [],
    checks: CHECKLIST_B.map(() => true),
  };
}

// Synthetic Form P demo — Ali & Abu Enterprise, 100,000 divisional split
// 60/40 with no salaries: Ali 60,000 + Abu 40,000, zero delta.
export function demoSeedP(): Engagement {
  const e = blankEngagement();
  const firm = blankPartnershipFirm("Ali & Abu Enterprise");
  firm.netProfitRM = "100000";
  firm.partners = [
    { id: uid(), name: "Ali", salaryRM: "", interestRM: "", ratioPct: "60" },
    { id: uid(), name: "Abu", salaryRM: "", interestRM: "", ratioPct: "40" },
  ];
  const docs = ensureDocuments([], "P").map((d) => ({ ...d, status: "received" as const }));
  return {
    ...e,
    id: uid(),
    formType: "P",
    companyName: "Ali & Abu Enterprise",
    regNo: "ROB 000000001",
    ya: 2025,
    fyeFrom: "2025-01-01",
    fyeTo: "2025-12-31",
    documents: docs,
    partnerships: [firm],
    priorYear: { ciRM: "", taxRM: "", caRM: "", lossesBfRM: "", unabsorbedCaBfRM: "", reBfRM: "", agreed: true },
    judgements: [],
    openItems: [],
    checks: CHECKLIST_P.map(() => true),
  };
}
