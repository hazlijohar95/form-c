import { blankEngagement, uid } from "./types.js";
import type { Engagement } from "./types.js";

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
