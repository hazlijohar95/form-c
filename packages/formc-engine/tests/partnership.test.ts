import { describe, expect, it } from "vitest";
import { toSen } from "../src/money.js";
import { computePartnership } from "../src/partnership.js";
import type { PartnershipInput } from "../src/partnership.js";

// Synthetic firms only. Ali & Abu split 100k 60/40 with no salaries:
// allocations must foot exactly to divisional income.
function aliAbu(): PartnershipInput {
  return {
    label: "Ali & Abu Enterprise",
    netProfitSen: toSen(100_000),
    addBacks: [],
    credits: [],
    doubleDeductions: [],
    assets: [],
    unabsorbedCaBfSen: 0,
    partners: [
      { name: "Ali", salarySen: 0, interestSen: 0, ratioPct: 60 },
      { name: "Abu", salarySen: 0, interestSen: 0, ratioPct: 40 },
    ],
  };
}

describe("computePartnership", () => {
  it("60/40 split of 100,000 allocates 60,000 + 40,000 with zero delta", () => {
    const r = computePartnership(aliAbu());
    expect(r.statutorySen).toBe(toSen(100_000));
    expect(r.allocations).toHaveLength(2);
    expect(r.allocations[0]).toMatchObject({ name: "Ali", totalSen: toSen(60_000) });
    expect(r.allocations[1]).toMatchObject({ name: "Abu", totalSen: toSen(40_000) });
    expect(r.allocatedTotalSen).toBe(toSen(100_000));
    expect(r.allocationDeltaSen).toBe(0);
    expect(r.findings).toHaveLength(0);
  });
  it("takes salaries off the top before the ratio split", () => {
    const r = computePartnership({
      ...aliAbu(),
      netProfitSen: toSen(120_000),
      partners: [
        { name: "Ali", salarySen: toSen(12_000), interestSen: 0, ratioPct: 60 },
        { name: "Abu", salarySen: toSen(8_000), interestSen: 0, ratioPct: 40 },
      ],
    });
    // balance 100,000 → Ali 12k + 60k = 72k; Abu 8k + 40k = 48k.
    expect(r.allocations[0]?.totalSen).toBe(toSen(72_000));
    expect(r.allocations[1]?.totalSen).toBe(toSen(48_000));
    expect(r.allocationDeltaSen).toBe(0);
  });
  it("flags ratios that do not total 100%", () => {
    const r = computePartnership({
      ...aliAbu(),
      partners: [
        { name: "Ali", salarySen: 0, interestSen: 0, ratioPct: 60 },
        { name: "Abu", salarySen: 0, interestSen: 0, ratioPct: 30 },
      ],
    });
    expect(r.findings.some((f) => f.includes("90%"))).toBe(true);
    expect(r.allocationDeltaSen).toBeLessThan(0); // 10% of balance unallocated
  });
  it("flows a loss firm through to partners instead of flooring at NIL", () => {
    const r = computePartnership({
      ...aliAbu(),
      netProfitSen: toSen(-50_000),
      addBacks: [{ description: "Depreciation", amountSen: toSen(5_000), section: "s.39(1)(c)" }],
    });
    // adjusted −45,000, no CA to absorb → divisional loss apportions 60/40.
    expect(r.statutorySen).toBe(toSen(-45_000));
    expect(r.unabsorbedCaCfSen).toBe(0);
    expect(r.allocations[0]?.totalSen).toBe(toSen(-27_000));
    expect(r.allocations[1]?.totalSen).toBe(toSen(-18_000));
    expect(r.allocationDeltaSen).toBe(0);
  });
  it("applies firm CA before division", () => {
    const r = computePartnership({
      ...aliAbu(),
      netProfitSen: toSen(100_000),
      schedule3Override: {
        caSen: toSen(10_000),
        balancingChargeSen: 0,
        balancingAllowanceSen: 0,
        residualBfSen: toSen(50_000),
        additionsSen: 0,
        disposedReSen: 0,
        residualCfSen: toSen(40_000),
        note: "test",
      },
    });
    expect(r.statutorySen).toBe(toSen(90_000));
    expect(r.allocations[0]?.totalSen).toBe(toSen(54_000));
  });
  it("parks excess CA as unabsorbed, keeps trading profit intact", () => {
    const r = computePartnership({
      ...aliAbu(),
      netProfitSen: toSen(5_000),
      schedule3Override: {
        caSen: toSen(10_000),
        balancingChargeSen: 0,
        balancingAllowanceSen: 0,
        residualBfSen: toSen(50_000),
        additionsSen: 0,
        disposedReSen: 0,
        residualCfSen: toSen(40_000),
        note: "test",
      },
    });
    // CA shelters only the 5,000 adjusted; 5,000 rides forward same source.
    expect(r.statutorySen).toBe(0);
    expect(r.unabsorbedCaCfSen).toBe(toSen(5_000));
    expect(r.allocations[0]?.totalSen).toBe(0);
  });
});
