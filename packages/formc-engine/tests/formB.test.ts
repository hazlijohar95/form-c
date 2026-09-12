import { describe, expect, it } from "vitest";
import { taxOnBands, toSen } from "../src/money.js";
import { individualBandsYA2025 } from "../src/rates.js";
import {
  allocatePartnershipShare,
  computeFormB,
  reliefCapFor,
} from "../src/individual.js";
import type { FormBInput } from "../src/individual.js";

// ---------------------------------------------------------------------------
// Form B anchors — synthetic figures only. Band anchors mirror the published
// LHDN resident-individual schedule (Budget 2023 amendments): RM1,500 on the
// first RM50k; RM9,400 on the first RM100k; RM34,400 on the first RM200k.
// VERIFY-YA DUTY: re-confirm against the LHDN filing programme each YA.
// ---------------------------------------------------------------------------

describe("individualBandsYA2025", () => {
  const bands = individualBandsYA2025();
  it("taxes the first RM50k at RM1,500", () => {
    expect(taxOnBands(toSen(50_000), bands)).toBe(toSen(1_500));
  });
  it("taxes the first RM100k at RM9,400", () => {
    expect(taxOnBands(toSen(100_000), bands)).toBe(toSen(9_400));
  });
  it("taxes the first RM200k at RM34,400", () => {
    expect(taxOnBands(toSen(200_000), bands)).toBe(toSen(34_400));
  });
  it("is zero at zero", () => {
    expect(taxOnBands(0, bands)).toBe(0);
  });
});

function solePropBase(): FormBInput {
  return {
    ya: 2025,
    businesses: [
      {
        label: "Nasi Lemak Stall",
        netProfitSen: toSen(120_000),
        addBacks: [{ description: "Depreciation", amountSen: toSen(12_000), section: "s.39(1)(c)" }],
        credits: [],
        doubleDeductions: [],
        assets: [],
        unabsorbedCaBfSen: 0,
      },
    ],
    partnershipShareSen: 0,
    employmentSen: 0,
    nonBusiness: [],
    donationsSen: 0,
    currentLossOffsetSen: 0,
    bfLosses: [],
    reliefs: [{ key: "self", label: "Self", amountSen: toSen(9_000) }],
    rebatesSen: 0,
    cp500PaidSen: 0,
    whtCreditSen: 0,
    bilateralCreditSen: 0,
    priorCreditSen: 0,
  };
}

describe("computeFormB", () => {
  it("sole prop: 132,000 statutory − 9,000 relief → CI 123,000 → tax 15,150", () => {
    const r = computeFormB(solePropBase());
    expect(r.businessStatutorySen).toBe(toSen(132_000));
    expect(r.reliefsAllowedSen).toBe(toSen(9_000));
    expect(r.chargeableSen).toBe(toSen(123_000));
    expect(r.grossTaxSen).toBe(toSen(15_150));
    expect(r.taxPayableSen).toBe(toSen(15_150));
    expect(r.netCashSen).toBe(toSen(15_150));
  });
  it("caps reliefs and reports the haircut", () => {
    const r = computeFormB({
      ...solePropBase(),
      reliefs: [
        { key: "self", label: "Self", amountSen: toSen(9_000) },
        { key: "child", label: "Child", amountSen: toSen(5_000) },
      ],
    });
    expect(r.reliefsAllowedSen).toBe(toSen(11_000));
    expect(r.reliefCapped).toHaveLength(1);
    expect(r.findings.some((f) => f.includes("Child"))).toBe(true);
  });
  it("rebates reduce tax, never below zero", () => {
    const r = computeFormB({ ...solePropBase(), rebatesSen: toSen(20_000) });
    expect(r.rebatesAllowedSen).toBe(toSen(15_150));
    expect(r.taxPayableSen).toBe(0);
  });
  it("drops expired B/F losses with a finding", () => {
    const r = computeFormB({ ...solePropBase(), bfLosses: [{ yearOfAssessment: 2014, amountBfSen: toSen(10_000) }] });
    expect(r.lossUsedSen).toBe(0);
    expect(r.lossCf).toHaveLength(0);
    expect(r.findings.some((f) => f.includes("Expired"))).toBe(true);
  });
});

describe("allocatePartnershipShare", () => {
  it("salary off the top, balance by ratio", () => {
    expect(
      allocatePartnershipShare({
        partnershipAdjustedSen: toSen(100_000),
        totalSalariesSen: toSen(20_000),
        totalInterestSen: 0,
        partnerSalarySen: toSen(10_000),
        partnerInterestSen: 0,
        ratioPct: 50,
      })
    ).toBe(toSen(50_000));
  });
});

describe("reliefCapFor", () => {
  it("resolves catalog caps, honours other: lines", () => {
    expect(reliefCapFor("child")).toBe(toSen(2_000));
    expect(reliefCapFor("other:PRS top-up", toSen(3_000))).toBe(toSen(3_000));
    expect(reliefCapFor("unknown-key")).toBe(null);
  });
});
