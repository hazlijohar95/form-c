import { describe, expect, it } from "vitest";
import { blankBusinessUnit, blankEngagement, blankPartnershipFirm, uid } from "./types.js";
import { signedRmToSen, isSignedRm } from "./rm.js";
import { normalizeStored } from "./store.js";
import { buildFormBInput, computeEngagementB, computeEngagementP, diagnoseRmInputs } from "./computation.js";
import { rolloverEngagementB, rolloverEngagementP } from "./rollover.js";
import { ensureDocuments, syncDocsToOpenItems } from "./onboarding.js";
import { buildMytaxExport } from "./myexport.js";
import { demoSeedB, demoSeedP } from "./seed.js";

// Adversarial web layer: hostile strings, legacy records, duplicate labels,
// and loss shares must degrade safely — never NaN, never cross-carried.

describe("signedRmToSen / isSignedRm", () => {
  it("parses signed amounts, rejects malformed", () => {
    expect(signedRmToSen("-27,000")).toBe(-2_700_000);
    expect(signedRmToSen("1,200.50")).toBe(120_050);
    expect(signedRmToSen("")).toBe(0);
    expect(signedRmToSen("abc")).toBe(0);
    expect(signedRmToSen("12.345")).toBe(0);
    expect(isSignedRm("-27000")).toBe(true);
    expect(isSignedRm("12.345")).toBe(false);
    expect(isSignedRm("")).toBe(true);
  });
});

describe("loss shares flow as current-year offsets", () => {
  it("splits profit shares from loss shares at the bridge", () => {
    const eng = blankEngagement();
    eng.partnerShares = [
      { id: uid(), partnershipName: "Good Firm", allocatedRM: "50000", ratioPct: "50", salaryRM: "", interestRM: "", firmAdjustedRM: "", firmSalariesRM: "", firmInterestRM: "" },
      { id: uid(), partnershipName: "Bad Firm", allocatedRM: "-27000", ratioPct: "60", salaryRM: "", interestRM: "", firmAdjustedRM: "", firmSalariesRM: "", firmInterestRM: "" },
    ];
    const input = buildFormBInput(eng);
    expect(input.partnershipShareSen).toBe(5_000_000);
    expect(input.currentLossOffsetSen).toBe(2_700_000);
  });
  it("negative allocatedRM is not a diagnostic error; malformed is", () => {
    const eng = blankEngagement();
    eng.partnerShares = [
      { id: uid(), partnershipName: "A", allocatedRM: "-27000", ratioPct: "", salaryRM: "", interestRM: "", firmAdjustedRM: "", firmSalariesRM: "", firmInterestRM: "" },
      { id: uid(), partnershipName: "B", allocatedRM: "12.345", ratioPct: "", salaryRM: "", interestRM: "", firmAdjustedRM: "", firmSalariesRM: "", firmInterestRM: "" },
    ];
    const issues = diagnoseRmInputs(eng);
    expect(issues.some((m) => m.includes("Partnership share #1"))).toBe(false);
    expect(issues.some((m) => m.includes("Partnership share #2"))).toBe(true);
  });
  it("negative firm net profit is not a diagnostic error", () => {
    const eng = blankEngagement();
    const firm = blankPartnershipFirm("Loss Firm");
    firm.netProfitRM = "-50000";
    eng.partnerships = [firm];
    expect(diagnoseRmInputs(eng).some((m) => m.includes("Loss Firm"))).toBe(false);
  });
});

describe("rollover carries by index, not label", () => {
  it("duplicate business labels do not cross-carry unabsorbed CA", () => {
    const eng = demoSeedB();
    const twin = blankBusinessUnit("Nasi Lemak Stall");
    twin.unabsorbedCaBfRM = "5000";
    eng.businesses = [eng.businesses[0]!, twin];
    const { result } = computeEngagementB(eng);
    const next = rolloverEngagementB(eng, result);
    expect(next.businesses[0]?.unabsorbedCaBfRM).toBe("0");
    expect(next.businesses[1]?.unabsorbedCaBfRM).toBe("5000");
  });
  it("Form P rollover resets numbers, keeps names/ratios, carries CA", () => {
    const eng = demoSeedP();
    const { results } = computeEngagementP(eng);
    const next = rolloverEngagementP(eng, results);
    expect(next.formType).toBe("P");
    expect(next.ya).toBe(2026);
    expect(next.partnerships[0]?.partners.map((p) => p.name)).toEqual(["Ali", "Abu"]);
    expect(next.partnerships[0]?.netProfitRM).toBe("");
    expect(next.partnerships[0]?.unabsorbedCaBfRM).toBe("0");
  });
});

describe("legacy record normalization", () => {
  it("pre-form records default to C with padded checks and firm fields", () => {
    const legacy = {
      id: "x",
      companyName: "Old",
      checks: [true],
      partnerShares: [{ id: "s1", partnershipName: "F", allocatedRM: "100", ratioPct: "", salaryRM: "", interestRM: "" }],
    };
    const out = normalizeStored(legacy);
    expect(out.formType).toBe("C");
    expect(out.checks.length).toBe(10);
    expect(out.checks[0]).toBe(true);
    expect(out.partnerships).toEqual([]);
    const share = out.partnerShares[0]!;
    expect(share.firmAdjustedRM).toBe("");
    expect(share.firmSalariesRM).toBe("");
    expect(share.firmInterestRM).toBe("");
  });
});

describe("onboarding edge cases", () => {
  it("waived required docs do not block; missing do", () => {
    const docs = ensureDocuments([], "C").map((d) =>
      d.required ? { ...d, status: "waived" as const } : d
    );
    const items = syncDocsToOpenItems(docs, []);
    expect(items.length).toBe(0);
    const missing = syncDocsToOpenItems(ensureDocuments([], "C"), []);
    expect(missing.length).toBeGreaterThan(0);
  });
});

describe("demoSeedP proof", () => {
  it("allocates 60,000 + 40,000 with zero delta and a P envelope", () => {
    const eng = demoSeedP();
    const { results } = computeEngagementP(eng);
    expect(results).toHaveLength(1);
    expect(results[0]?.statutorySen).toBe(10_000_000);
    expect(results[0]?.allocationDeltaSen).toBe(0);
    const o = JSON.parse(buildMytaxExport(eng)) as Record<string, unknown>;
    expect(o.form).toBe("P");
    expect(o.divisionalTotalSen).toBe(10_000_000);
    expect((o.checklist as unknown[]).length).toBe(10);
  });
});
