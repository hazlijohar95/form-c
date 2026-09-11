import { describe, expect, it } from "vitest";
import { entertainmentAddBack } from "../src/adjustedIncome.js";
import { computeAsset } from "../src/capitalAllowances.js";
import { cp204Penalty } from "../src/chargeable.js";
import { computeFormC } from "../src/index.js";
import { assessWht, deemedInterest140B, earningsStripping } from "../src/index.js";
import { checkSme, smeBands } from "../src/rates.js";
import { taxOnBands, toSen } from "../src/money.js";

// ---------------------------------------------------------------------------
// Synthetic SME bakery fixture — entirely fictional figures exercising the
// full pipeline: PBT 62,400 + add-backs 46,040.50 − exclusions 10,395.30
// − D1 7,920 = adjusted 90,125.20; CA 12,340.55; BC 4,800;
// statutory 82,584.65; + hibah 95.30 = CI 82,679.95 → Form C 82,679 →
// tax 12,401.85 → balance 1,001.85. NEVER use real client figures here.
// ---------------------------------------------------------------------------
const DEMO_ADJUSTED = toSen(90_125.2);
const DEMO_CA = toSen(12_340.55);
const DEMO_BC = toSen(4_800);
const DEMO_HIBAH = toSen(95.3);

function demoBase(): Parameters<typeof computeFormC>[0] {
  return {
    ya: 2025,
    companyName: "Demo Bakery Sdn Bhd",
    regNo: "test",
    fyeFrom: "2025-01-01",
    fyeTo: "2025-12-31",
    sme: {
      paidUpCapitalRM: 80_000,
      grossBusinessIncomeRM: 1_450_000.6,
      controlsLargeCompany: false,
      controlledByLargeCompany: false,
      foreignOwnershipPct: 0,
      isResident: true,
    },
    netProfitSen: toSen(62_400),
    addBacks: [
      { description: "Depreciation", amountSen: toSen(38_120.5), section: "s.39(1)(b)" },
      { description: "Statutory audit fee", amountSen: toSen(7_500), section: "s.39(1)(d)" },
      { description: "Tax filing fee net", amountSen: toSen(420), section: "s.39(1)(d)" },
    ],
    credits: [
      { description: "Hibah", amountSen: DEMO_HIBAH, basis: "s.4(c)" },
      { description: "Gain on disposal", amountSen: toSen(6_200), basis: "capital receipt" },
      { description: "Repairs capitalised", amountSen: toSen(4_100), basis: "s.33(1)" },
    ],
    doubleDeductions: [
      { description: "Audit expenditure", amountSen: toSen(7_500), authority: "P.U.(A) 129/2006", code: "132" },
      { description: "Secretarial/tax fee", amountSen: toSen(420), authority: "P.U.(A) 162/2020", code: "157", capSen: toSen(15_000) },
    ],
    assets: [],
    schedule3Override: {
      caSen: DEMO_CA,
      balancingChargeSen: DEMO_BC,
      balancingAllowanceSen: 0,
      residualBfSen: toSen(18_200.4),
      additionsSen: toSen(3_150),
      disposedReSen: toSen(900),
      residualCfSen: toSen(8_109.85),
      note: "External register schedule (demo)",
    },
    nonBusiness: [{ label: "Hibah s.4(c)", amountSen: DEMO_HIBAH }],
    whtLines: [],
    deemedInterestSen: 0,
    relatedInterestSen: 0,
    taxEbitdaSen: 0,
    donationsSen: 0,
    zakatSen: 0,
    currentLossOffsetSen: 0,
    bfLosses: [],
    unabsorbedCaBfSen: 0,
    cp204EstimateSen: toSen(11_400),
    cp204PaidSen: toSen(11_400),
    whtCreditSen: 0,
    bilateralCreditSen: 0,
    priorCreditSen: toSen(500),
  };
}

describe("demo bakery full pipeline", () => {
  const out = computeFormC(demoBase());
  it("adjusted income ties", () => expect(out.adjustedSen).toBe(DEMO_ADJUSTED));
  it("statutory business = adjusted − CA + BC", () =>
    expect(out.statutorySen).toBe(toSen(82_584.65)));
  it("chargeable truncates to whole ringgit", () => {
    expect(out.chargeableExactSen).toBe(toSen(82_679.95));
    expect(out.chargeableSen).toBe(toSen(82_679));
  });
  it("tax on truncated CI at 15%", () => expect(out.grossTaxSen).toBe(toSen(12_401.85)));
  it("balance of tax", () => expect(out.taxPayableSen).toBe(toSen(1_001.85)));
  it("no s.107C(10) penalty (shortfall below 30% of tax payable)", () =>
    expect(out.cp204PenaltySen).toBe(0));
  it("net cash after prior credits", () =>
    expect(out.netCashSen).toBe(toSen(501.85)));
  it("schedule roll-forward foots to zero", () => expect(out.scheduleRollSen).toBe(0));
  it("RE c/f opens next YA", () => expect(out.residualCfSen).toBe(toSen(8_109.85)));
});

describe("Sch 3 straight-line (per-asset model)", () => {
  it("new Cat2 asset: IA 20% + AA 14% of QE", () => {
    const r = computeAsset(
      {
        id: "t1", description: "Plant", category: "cat2-14",
        costSen: toSen(10_000), allowancesBfSen: 0, isNew: true,
        isHirePurchase: false, isMotorNonCommercial: false,
        ownedAtYearEnd: true, inUseAtYearEnd: true,
      },
      true, 0
    );
    expect(r.iaSen).toBe(toSen(2_000));
    expect(r.aaSen).toBe(toSen(1_400)); // 14% of QE, not of residual
    expect(r.residualCfSen).toBe(toSen(6_600));
  });
  it("existing asset: no IA, AA on original QE capped at remaining", () => {
    const r = computeAsset(
      {
        id: "t2", description: "Old plant", category: "cat2-14",
        costSen: toSen(10_000), allowancesBfSen: toSen(9_500), isNew: false,
        isHirePurchase: false, isMotorNonCommercial: false,
        ownedAtYearEnd: true, inUseAtYearEnd: true,
      },
      true, 0
    );
    expect(r.iaSen).toBe(0);
    expect(r.aaSen).toBe(toSen(500)); // capped at residual, not 1,400
    expect(r.residualCfSen).toBe(0);
  });
  it("disposal: no AA, BC capped at allowances given", () => {
    const r = computeAsset(
      {
        id: "D1", description: "Disposed machine", category: "cat2-14",
        costSen: toSen(12_000), allowancesBfSen: toSen(10_800), isNew: false,
        isHirePurchase: false, isMotorNonCommercial: false,
        ownedAtYearEnd: false, inUseAtYearEnd: false,
        disposalPriceSen: toSen(7_700),
      },
      true, 0
    );
    expect(r.aaSen).toBe(0);
    expect(r.balancingChargeSen).toBe(toSen(6_500)); // 7,700−1,200 capped at 10,800
    expect(r.disposedReSen).toBe(toSen(1_200));
  });
  it("small-value only for NEW assets", () => {
    const r = computeAsset(
      {
        id: "t3", description: "Old fitting", category: "small-value",
        costSen: toSen(1_000), allowancesBfSen: toSen(500), isNew: false,
        isHirePurchase: false, isMotorNonCommercial: false,
        ownedAtYearEnd: true, inUseAtYearEnd: true,
      },
      true, 0
    );
    expect(r.svaSen).toBe(0);
    expect(r.notes.join(" ")).toMatch(/Para 19A requires new asset/);
  });
});

describe("adversarial", () => {
  it("CI 82,679.99 still truncates to 82,679", () => {
    const inp = demoBase();
    inp.nonBusiness = [{ label: "Hibah", amountSen: toSen(95.34) }]; // exact CI 82,679.99
    const out = computeFormC(inp);
    expect(out.chargeableSen).toBe(toSen(82_679));
    expect(out.grossTaxSen).toBe(toSen(12_401.85)); // same tax — boundary proven
  });
  it("code 157 capped at RM15,000", () => {
    const inp = demoBase();
    inp.doubleDeductions = [
      { description: "Audit (132)", amountSen: toSen(7_500), authority: "P.U.(A) 129/2006", code: "132" },
      { description: "Big fee (157)", amountSen: toSen(40_000), authority: "P.U.(A) 162/2020", code: "157", capSen: toSen(15_000) },
    ];
    const out = computeFormC(inp);
    // D1 total 22,500 vs base 7,920 — only capped 15,000 of the 40,000 allowed
    expect(out.adjustedSen).toBe(DEMO_ADJUSTED - toSen(22_500 - 7_920));
  });
  it("Para 75: CA cannot create a loss — excess unabsorbed", () => {
    const inp = demoBase();
    inp.netProfitSen = toSen(1_000);
    inp.addBacks = [];
    inp.credits = [];
    inp.doubleDeductions = [];
    const out = computeFormC(inp);
    expect(out.statutorySen).toBeGreaterThanOrEqual(0);
    expect(out.findings.join(" ")).toMatch(/Para 75/);
  });
  it("broken override roll-forward is flagged, not silently accepted", () => {
    const inp = demoBase();
    inp.schedule3Override = { ...inp.schedule3Override!, residualCfSen: toSen(9_999) };
    const out = computeFormC(inp);
    expect(out.scheduleRollSen).not.toBe(0);
    expect(out.findings.join(" ")).toMatch(/roll-forward/);
  });
  it("s.107C penalty when estimate truly low", () => {
    expect(cp204Penalty(toSen(11_404.65), toSen(5_000))).toBeGreaterThan(0);
  });
});

describe("sme", () => {
  it("demo SME qualifies (RM80k capital, 0% foreign)", () => {
    expect(
      checkSme({
        paidUpCapitalRM: 80_000, grossBusinessIncomeRM: 1_450_000.60,
        controlsLargeCompany: false, controlledByLargeCompany: false,
        foreignOwnershipPct: 0, isResident: true,
      }).qualifies
    ).toBe(true);
  });
  it("bands at boundary", () => {
    expect(taxOnBands(toSen(150_000), smeBands())).toBe(toSen(22_500));
  });
});

describe("entertainment", () => {
  it("fully-proviso entertainment — no add-back", () => {
    expect(entertainmentAddBack(toSen(1_390), toSen(1_390))).toBe(0);
  });
});

describe("hire purchase (Para 46)", () => {
  it("allowances on cumulative paid, IA on first payment", () => {
    const r = computeAsset(
      {
        id: "hp1", description: "HP machine", category: "cat2-14",
        costSen: toSen(100_000), allowancesBfSen: 0, isNew: true,
        isHirePurchase: true, hpPaidPeriodSen: toSen(30_000), hpPaidTotalSen: toSen(30_000),
        isMotorNonCommercial: false,
        ownedAtYearEnd: true, inUseAtYearEnd: true,
      },
      true, 0
    );
    expect(r.iaSen).toBe(toSen(6_000)); // 20% of 30,000 paid — not of 100,000
    expect(r.aaSen).toBe(toSen(4_200)); // 14% of 30,000 paid-to-date
    expect(r.additionSen).toBe(toSen(30_000));
  });
  it("missing paid figures is a data error, not a silent full claim", () => {
    const r = computeAsset(
      {
        id: "hp2", description: "HP machine", category: "cat2-14",
        costSen: toSen(100_000), allowancesBfSen: 0, isNew: true,
        isHirePurchase: true,
        isMotorNonCommercial: false,
        ownedAtYearEnd: true, inUseAtYearEnd: true,
      },
      true, 0
    );
    expect(r.totalCaSen).toBe(0);
    expect(r.notes.join(" ")).toMatch(/needs capital paid/);
  });
});

describe("s.140C earnings stripping", () => {
  it("de minimis RM500k — no disallowance below", () => {
    expect(earningsStripping(toSen(400_000), toSen(100_000))).toBe(0);
  });
  it("excess over 20% EBITDA disallowed", () => {
    // interest 800k, EBITDA 1m → limit max(500k, 200k)=500k → disallow 300k
    expect(earningsStripping(toSen(800_000), toSen(1_000_000))).toBe(toSen(300_000));
  });
  it("flows as s.140C add-back in the computation", () => {
    const inp = demoBase();
    inp.relatedInterestSen = toSen(800_000);
    inp.taxEbitdaSen = toSen(1_000_000);
    const out = computeFormC(inp);
    expect(out.adjustedSen).toBe(DEMO_ADJUSTED + toSen(300_000));
    expect(out.findings.join(" ")).toMatch(/140C/);
  });
});

describe("WHT s.39(2) gate", () => {
  it("remitted payment stays deductible", () => {
    const inp = demoBase();
    inp.whtLines = [{ description: "Royalty", amountSen: toSen(50_000), section: "s.109-royalty", remitted: true }];
    expect(computeFormC(inp).adjustedSen).toBe(DEMO_ADJUSTED);
  });
  it("unremitted payment added back with finding", () => {
    const inp = demoBase();
    inp.whtLines = [{ description: "Management fee", amountSen: toSen(50_000), section: "s.109B", remitted: false }];
    const out = computeFormC(inp);
    expect(out.adjustedSen).toBe(DEMO_ADJUSTED + toSen(50_000));
    expect(out.findings.join(" ")).toMatch(/s\.39\(2\)/);
  });
});

describe("s.140B deemed interest", () => {
  it("peak debit × rate × months", () => {
    expect(deemedInterest140B(toSen(484), 6, 4)).toBe(Math.round(48400 * 0.04 * 0.5));
  });
  it("deemed interest joins the computation as a source", () => {
    const inp = demoBase();
    inp.deemedInterestSen = toSen(1_000);
    expect(computeFormC(inp).chargeableExactSen).toBe(toSen(82_679.95) + toSen(1_000));
  });
});

describe("per-source floor", () => {
  it("loss-making non-business source cannot shelter business income", () => {
    const inp = demoBase();
    inp.nonBusiness = [{ label: "Rental (loss)", amountSen: toSen(-5_000) }];
    const out = computeFormC(inp);
    expect(out.aggregateSen).toBe(out.statutorySen); // negative source floored at NIL
  });
});
