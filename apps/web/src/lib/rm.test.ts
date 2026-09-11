import { describe, expect, it } from "vitest";
import { hasDebitBalance, numOr0, rmStrToSen, senToRMString } from "./rm.js";

describe("rmStrToSen", () => {
  it("parses plain and comma amounts to sen", () => {
    expect(rmStrToSen("1,234.56")).toBe(123456);
    expect(rmStrToSen("850")).toBe(85000);
    expect(rmStrToSen("0.5")).toBe(50);
  });
  it("clamps invalid and negative to 0", () => {
    expect(rmStrToSen("")).toBe(0);
    expect(rmStrToSen("abc")).toBe(0);
    expect(rmStrToSen("-500")).toBe(0);
    expect(rmStrToSen("12.345")).toBe(0);
  });
});

describe("numOr0", () => {
  it("strips commas and falls back to 0", () => {
    expect(numOr0("1,000")).toBe(1000);
    expect(numOr0("4.5")).toBe(4.5);
    expect(numOr0("nope")).toBe(0);
  });
});

describe("senToRMString", () => {
  it("round-trips without float drift", () => {
    expect(senToRMString(123456)).toBe("1234.56");
    expect(senToRMString(85000)).toBe("850");
    expect(senToRMString(-50)).toBe("-0.5");
  });
});

describe("hasDebitBalance", () => {
  it("flags comma-formatted debits, ignores blanks", () => {
    expect(hasDebitBalance(["100", "200"])).toBe(false);
    expect(hasDebitBalance(["100", "-50"])).toBe(true);
    expect(hasDebitBalance(["1,000", "-2,500.75"])).toBe(true);
    expect(hasDebitBalance(["", "  "])).toBe(false);
  });
});
