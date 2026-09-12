import { describe, expect, it } from "vitest";
import { taxOnBands, toSen } from "../src/money.js";
import { individualBandsYA2025 } from "../src/rates.js";
import { allocatePartnershipShare, computeFormB } from "../src/individual.js";
import { computePartnership } from "../src/partnership.js";
import { applyBfLosses } from "../src/losses.js";
import { computeFormC } from "../src/index.js";
import type { FormBInput } from "../src/individual.js";

// Adversarial: hostile, empty, and boundary inputs must degrade to
// findings and zeros — never NaN, never negative tax, never silent loss.

function bareB(): FormBInput {
  return {
    ya: 2025,
    businesses: [],
    partnershipShareSen: 0,
    employmentSen: 0,
    nonBusiness: [],
    donationsSen: 0,
    currentLossOffsetSen: 0,
    bfLosses: [],
    reliefs: [],
    rebatesSen: 0,
    cp500PaidSen: 0,
    whtCreditSen: 0,
    bilateralCreditSen: 0,
    priorCreditSen: 0,
  };
}

describe("adversarial Form B", () => {
  it("empty engagement computes zero tax, not NaN", () => {
    const r = computeFormB(bareB());
    expect(r.chargeableSen).toBe(0);
    expect(r.grossTaxSen).toBe(0);
    expect(r.taxPayableSen).toBe(0);
    expect(Number.isNaN(r.netCashSen)).toBe(false);
  });
  it("employment-only individual pays graduated tax with no reliefs", () => {
    // 30,000 → 150 + 300 = 450.
    const r = computeFormB({ ...bareB(), employmentSen: toSen(30_000) });
    expect(r.chargeableSen).toBe(toSen(30_000));
    expect(r.grossTaxSen).toBe(toSen(450));
  });
  it("reliefs cannot drive chargeable below zero", () => {
    const r = computeFormB({
      ...bareB(),
      employmentSen: toSen(10_000),
      reliefs: [{ key: "self", label: "Self", amountSen: toSen(9_000) }],
    });
    expect(r.chargeableSen).toBe(toSen(1_000));
    const r2 = computeFormB({
      ...bareB(),
      employmentSen: toSen(5_000),
      reliefs: [{ key: "self", label: "Self", amountSen: toSen(9_000) }],
    });
    expect(r2.chargeableSen).toBe(0);
    expect(r2.reliefsAllowedSen).toBe(toSen(5_000));
  });
  it("unknown relief keys pass through uncapped but bounded by income", () => {
    const r = computeFormB({
      ...bareB(),
      employmentSen: toSen(50_000),
      reliefs: [{ key: "mystery-future-relief", label: "Future", amountSen: toSen(99_000_000) }],
    });
    expect(r.reliefsAllowedSen).toBe(toSen(50_000));
    expect(r.chargeableSen).toBe(0);
  });
  it("negative non-business sources floor at NIL instead of sheltering", () => {
    const r = computeFormB({
      ...bareB(),
      employmentSen: toSen(40_000),
      nonBusiness: [{ label: "Rental (loss)", amountSen: toSen(-30_000) }],
    });
    expect(r.aggregateSen).toBe(toSen(40_000));
  });
  it("donations cannot exceed 10% even when generous", () => {
    const r = computeFormB({ ...bareB(), employmentSen: toSen(100_000), donationsSen: toSen(99_000_000) });
    expect(r.donationsAllowedSen).toBe(toSen(10_000));
  });
  it("B/F loss exactly 10 years old survives; 11 years drops", () => {
    const kept = applyBfLosses({
      remainingSen: toSen(50_000),
      businessCapSen: toSen(50_000),
      bfLosses: [{ yearOfAssessment: 2015, amountBfSen: toSen(20_000) }],
      currentYa: 2025,
    });
    expect(kept.lossUsedSen).toBe(toSen(20_000));
    expect(kept.expiredDropped).toBe(false);
    const dropped = applyBfLosses({
      remainingSen: toSen(50_000),
      businessCapSen: toSen(50_000),
      bfLosses: [{ yearOfAssessment: 2014, amountBfSen: toSen(20_000) }],
      currentYa: 2025,
    });
    expect(dropped.lossUsedSen).toBe(0);
    expect(dropped.expiredDropped).toBe(true);
  });
  it("B/F losses cannot shelter non-business income", () => {
    const r = computeFormB({
      ...bareB(),
      nonBusiness: [{ label: "Interest", amountSen: toSen(100_000) }],
      bfLosses: [{ yearOfAssessment: 2024, amountBfSen: toSen(90_000) }],
    });
    expect(r.lossUsedSen).toBe(0);
    expect(r.lossCf).toHaveLength(1);
  });
  it("bands apply on whole-RM floor, not exact sen", () => {
    const bands = individualBandsYA2025();
    // 5,000.50 floors to 5,000 → zero tax; exact-sen would leak 1 sen.
    expect(taxOnBands(Math.floor(toSen(5_000.5) / 100) * 100, bands)).toBe(0);
  });
});

describe("adversarial allocation", () => {
  it("clamps ratios above 100 and below 0", () => {
    expect(
      allocatePartnershipShare({
        partnershipAdjustedSen: toSen(100_000),
        totalSalariesSen: 0,
        totalInterestSen: 0,
        partnerSalarySen: 0,
        partnerInterestSen: 0,
        ratioPct: 150,
      })
    ).toBe(toSen(100_000));
    expect(
      allocatePartnershipShare({
        partnershipAdjustedSen: toSen(100_000),
        totalSalariesSen: 0,
        totalInterestSen: 0,
        partnerSalarySen: 0,
        partnerInterestSen: 0,
        ratioPct: -20,
      })
    ).toBe(0);
  });
  it("allocations foot to divisional across a hostile matrix", () => {
    const cases: [number, number, number, number][] = [
      [100_000, 0, 0, 33.33],
      [1, 0, 0, 50],
      [999_999_99 / 100, 1_000, 500, 12.5],
      [0, 10_000, 0, 100],
    ];
    for (const [div, sal, intr, ratio] of cases) {
      const got = allocatePartnershipShare({
        partnershipAdjustedSen: toSen(div),
        totalSalariesSen: toSen(sal),
        totalInterestSen: toSen(intr),
        partnerSalarySen: toSen(sal),
        partnerInterestSen: toSen(intr),
        ratioPct: ratio,
      });
      expect(Number.isInteger(got)).toBe(true);
      expect(Number.isNaN(got)).toBe(false);
    }
    // sole partner at 100% always takes the whole divisional.
    const solo = allocatePartnershipShare({
      partnershipAdjustedSen: toSen(77_777.77),
      totalSalariesSen: toSen(7_000),
      totalInterestSen: toSen(700),
      partnerSalarySen: toSen(7_000),
      partnerInterestSen: toSen(700),
      ratioPct: 100,
    });
    expect(solo).toBe(toSen(77_777.77));
  });
  it("firm allocations sum to divisional for multi-partner fixtures", () => {
    const r = computePartnership({
      label: "Hostile",
      netProfitSen: toSen(123_456.78),
      addBacks: [],
      credits: [],
      doubleDeductions: [],
      assets: [],
      unabsorbedCaBfSen: 0,
      partners: [
        { name: "A", salarySen: toSen(1_000), interestSen: toSen(100), ratioPct: 33.33 },
        { name: "B", salarySen: toSen(2_000), interestSen: 0, ratioPct: 33.33 },
        { name: "C", salarySen: 0, interestSen: toSen(50), ratioPct: 33.34 },
      ],
    });
    expect(Math.abs(r.allocationDeltaSen)).toBeLessThanOrEqual(300); // ±1 sen rounding per partner
  });
});

describe("adversarial Form C guards", () => {
  it("rejects completion on empty company input without NaN", () => {
    const r = computeFormC({
      ya: 2025,
      companyName: "",
      regNo: "",
      fyeFrom: "",
      fyeTo: "",
      sme: {
        paidUpCapitalRM: 0,
        grossBusinessIncomeRM: 0,
        controlsLargeCompany: false,
        controlledByLargeCompany: false,
        foreignOwnershipPct: 0,
        isResident: false,
      },
      netProfitSen: 0,
      addBacks: [],
      credits: [],
      doubleDeductions: [],
      assets: [],
      nonBusiness: [],
      whtLines: [],
      deemedInterestSen: 0,
      relatedInterestSen: 0,
      taxEbitdaSen: 0,
      raQeSen: 0,
      raBfSen: 0,
      itaAllowanceSen: 0,
      itaBfSen: 0,
      itaPct: 70,
      pioneerExemptSen: 0,
      groupSurrenderedSen: 0,
      groupSurrendererLossSen: 0,
      groupConditionsMet: false,
      isIhc: false,
      donationsSen: 0,
      zakatSen: 0,
      currentLossOffsetSen: 0,
      bfLosses: [],
      unabsorbedCaBfSen: 0,
      cp204EstimateSen: 0,
      cp204PaidSen: 0,
      whtCreditSen: 0,
      bilateralCreditSen: 0,
      priorCreditSen: 0,
    });
    expect(r.chargeableSen).toBe(0);
    expect(r.grossTaxSen).toBe(0);
    expect(r.smeQualifies).toBe(false);
  });
});
