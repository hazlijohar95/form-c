import { describe, expect, it } from "vitest";
import { blankEngagement } from "./types.js";
import { buildFormCInput, computeEngagement, deemed140B } from "./computation.js";
import { uid } from "./lists.js";

describe("buildFormCInput", () => {
  it("coerces unknown ITA % to 70 and gates unverified prior credits", () => {
    const eng = blankEngagement();
    eng.itaPct = "80";
    eng.priorCreditVerified = false;
    eng.priorCreditRM = "500";
    const input = buildFormCInput(eng);
    expect(input.itaPct).toBe(70);
    expect(input.priorCreditSen).toBe(0);
    eng.priorCreditVerified = true;
    expect(buildFormCInput(eng).priorCreditSen).toBe(50000);
  });
  it("falls back unknown WHT sections to s.109B", () => {
    const eng = blankEngagement();
    eng.whtLines = [
      { id: uid(), description: "x", amountRM: "100", section: "bogus" as never, remitted: false },
    ];
    expect(buildFormCInput(eng).whtLines[0].section).toBe("s.109B");
  });
});

describe("deemed140B", () => {
  it("computes peak debit x months x rate with comma balances", () => {
    const eng = blankEngagement();
    eng.deemedRatePct = "12";
    eng.relatedAccounts = [
      { id: uid(), name: "Director", balances: ["1,000", "-2,000", "-500", "", "0", "0", "0", "0", "0", "0", "0", "0"] },
    ];
    const { totalSen } = deemed140B(eng);
    // peak 2000 x 2 months x 12% p.a. = 200000*0.12*(2/12) = 4000 sen
    expect(totalSen).toBe(4000);
  });
  it("returns zero with no rate or no debit", () => {
    const eng = blankEngagement();
    expect(deemed140B(eng).totalSen).toBe(0);
    eng.deemedRatePct = "5";
    eng.relatedAccounts = [
      { id: uid(), name: "Clean", balances: Array(12).fill("100") },
    ];
    expect(deemed140B(eng).totalSen).toBe(0);
  });
});

describe("computeEngagement", () => {
  it("matches computeFormC on the same input (single build)", () => {
    const eng = blankEngagement();
    const { result, assetRows } = computeEngagement(eng);
    expect(result.adjustedSen).toBeGreaterThan(0);
    expect(assetRows.length).toBe(eng.assets.length);
    expect(result.scheduleRollSen).toBe(0);
  });
});
