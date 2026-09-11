import { describe, expect, it } from "vitest";
import { CHECKLIST, blankEngagement } from "./types.js";
import { diagnoseRmInputs } from "./computation.js";
import { buildMytaxExport } from "./myexport.js";
import { demoSeed } from "./seed.js";

describe("diagnoseRmInputs", () => {
  it("blank engagement is clean", () => {
    expect(diagnoseRmInputs(blankEngagement())).toEqual([]);
  });
  it("flags malformed amounts across sections", () => {
    const e = blankEngagement();
    e.netProfitRM = "12.345";
    e.schedule3.caRM = "abc";
    e.directors = [{ id: "d1", name: "A", sharePct: "50", salaryRM: "4x", loanRM: "" }];
    const issues = diagnoseRmInputs(e);
    expect(issues.some((m) => m.startsWith("P&L net profit"))).toBe(true);
    expect(issues.some((m) => m.startsWith("Sch3 CA"))).toBe(true);
    expect(issues.some((m) => m.startsWith("Director #1 salary"))).toBe(true);
  });
});

describe("buildMytaxExport", () => {
  it("matches the Report contract on the demo seed", () => {
    const json = buildMytaxExport(demoSeed());
    const o = JSON.parse(json) as Record<string, unknown>;
    expect(o.form).toBe("C");
    expect(o.ya).toBe(2025);
    expect(o.company).toBe("Demo Bakery Sdn Bhd");
    expect(o.chargeableIncomeSen).toBe(82679 * 100);
    expect(o.taxPayableSen).toBe(100185);
    expect((o.checklist as unknown[]).length).toBe(CHECKLIST.length);
    expect(o.addBacks).toHaveLength(3);
  });
});
