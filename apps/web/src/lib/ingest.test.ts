import { describe, expect, it } from "vitest";
import { hintFor, parseTrialBalance } from "./ingest.js";

describe("parseTrialBalance", () => {
  it("parses debits and parenthesised credits", () => {
    const lines = parseTrialBalance("Depreciation 50,000.00\nSales (1,200,000.00)");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ label: "Depreciation", amountSen: 5000000, kind: "debit" });
    expect(lines[1]).toMatchObject({ label: "Sales", amountSen: 120000000, kind: "credit" });
  });
  it("keeps parens in the label as a debit", () => {
    const lines = parseTrialBalance("Provision (doubtful) 5000");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ label: "Provision (doubtful)", kind: "debit" });
  });
  it("ignores unbalanced parens on the amount", () => {
    expect(parseTrialBalance("Sales (1,200,000.00")).toHaveLength(1);
    expect(parseTrialBalance("Sales (1,200,000.00")[0]?.kind).toBe("debit");
  });
});

describe("hintFor", () => {
  it("hints depreciation as an add-back", () => {
    expect(hintFor("Depreciation of PPE")).toContain("s.39(1)(c)");
  });
});
