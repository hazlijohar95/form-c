import { describe, expect, it } from "vitest";
import { demoSeedB } from "./seed.js";
import { buildFormBInput, computeEngagementB } from "./computation.js";
import { buildMytaxExport } from "./myexport.js";
import { CHECKLIST_B } from "./constants.js";

// Synthetic Form B demo — sole proprietor, one business + employment.
// Must reproduce: statutory 156,000 − reliefs 13,000 → CI 143,000 →
// tax 20,150 → less CP500 12,000 → balance 8,150.
describe("demoSeedB", () => {
  it("reproduces the pinned proof figures", () => {
    const eng = demoSeedB();
    expect(eng.formType).toBe("B");
    const { result } = computeEngagementB(eng);
    expect(result.businessStatutorySen).toBe(132_000 * 100);
    expect(result.aggregateSen).toBe(156_000 * 100);
    expect(result.reliefsAllowedSen).toBe(13_000 * 100);
    expect(result.chargeableSen).toBe(143_000 * 100);
    expect(result.grossTaxSen).toBe(2_015_000);
    expect(result.taxPayableSen).toBe(815_000);
    expect(result.netCashSen).toBe(815_000);
  });
  it("exports a Form B envelope with a complete checklist", () => {
    const o = JSON.parse(buildMytaxExport(demoSeedB())) as Record<string, unknown>;
    expect(o.form).toBe("B");
    expect(o.chargeableIncomeSen).toBe(143_000 * 100);
    expect(o.taxPayableSen).toBe(815_000);
    expect((o.checklist as unknown[]).length).toBe(CHECKLIST_B.length);
    expect((o.checklist as { done: boolean }[]).every((c) => c.done)).toBe(true);
  });
  it("bridges engagement fields into FormBInput", () => {
    const input = buildFormBInput(demoSeedB());
    expect(input.businesses).toHaveLength(1);
    expect(input.employmentSen).toBe(24_000 * 100);
    expect(input.cp500PaidSen).toBe(12_000 * 100);
    expect(input.reliefs).toHaveLength(2);
  });
});
