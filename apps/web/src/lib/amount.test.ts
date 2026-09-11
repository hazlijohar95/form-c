import { describe, expect, it } from "vitest";
import { validateAmount } from "../components/RmInput.js";

describe("validateAmount", () => {
  it("accepts blank as untouched (all kinds)", () => {
    for (const k of ["rm", "signed", "pct", "int", "year"] as const) {
      expect(validateAmount(k, "")).toBeUndefined();
      expect(validateAmount(k, "   ")).toBeUndefined();
    }
  });
  it("rm: accepts 2dp, rejects 3dp/letters/negatives", () => {
    expect(validateAmount("rm", "1,234.56")).toBeUndefined();
    expect(validateAmount("rm", "0")).toBeUndefined();
    expect(validateAmount("rm", "12.345")).toBeDefined();
    expect(validateAmount("rm", "abc")).toBeDefined();
    expect(validateAmount("rm", "-5")).toBeDefined();
  });
  it("signed: accepts negatives for debit balances", () => {
    expect(validateAmount("signed", "-12,000.50")).toBeUndefined();
    expect(validateAmount("signed", "500")).toBeUndefined();
    expect(validateAmount("signed", "12.345")).toBeDefined();
  });
  it("pct: bounds 0–100", () => {
    expect(validateAmount("pct", "0")).toBeUndefined();
    expect(validateAmount("pct", "12.5")).toBeUndefined();
    expect(validateAmount("pct", "100")).toBeUndefined();
    expect(validateAmount("pct", "100.01")).toBeDefined();
    expect(validateAmount("pct", "-1")).toBeDefined();
    expect(validateAmount("pct", "abc")).toBeDefined();
  });
  it("int: whole numbers only", () => {
    expect(validateAmount("int", "12")).toBeUndefined();
    expect(validateAmount("int", "12.5")).toBeDefined();
    expect(validateAmount("int", "-3")).toBeDefined();
  });
  it("year: four-digit sane range", () => {
    expect(validateAmount("year", "2024")).toBeUndefined();
    expect(validateAmount("year", "24")).toBeDefined();
    expect(validateAmount("year", "1800")).toBeDefined();
    expect(validateAmount("year", "abcd")).toBeDefined();
  });
});
