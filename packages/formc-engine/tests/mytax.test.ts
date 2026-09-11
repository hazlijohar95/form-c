import { describe, expect, it } from "vitest";
import {
  blankMyTaxProfile,
  coverMaksykt,
  coverProfil,
  coverRumusanGate,
  evaluateCoverage,
  MYTAX_STEPS,
} from "../src/mytax.js";

function fullProfile() {
  return {
    ...blankMyTaxProfile(),
    tin: "C 60490708070",
    employerTin: "E 9626405801",
    operasiDate: "15/01/2025",
    incorpMY: "1" as const,
    residentCountry: "MYS",
    acctFrom: "15/01/2025",
    acctTo: "31/12/2025",
    basisFrom: "15/01/2025",
    basisTo: "31/12/2025",
    businessStatus: "1" as const,
    guaranteeCo: "2" as const,
    statutoryBody: "2" as const,
    peMY: "2" as const,
    spvSecuritisation: "2" as const,
    controlledCo: "2" as const,
    foreignNoShareCo: "2" as const,
    smePara2B2C: "2" as const,
    shareChange445A: "3" as const,
    groupClaim: "3" as const,
    refundMethod: "own-malaysia",
    dividendToIndividuals: "2" as const,
    dividendVoucher: "2" as const,
    controlledTx139_140A: "2" as const,
    foreignExemptIncome: "2" as const,
    interestRestricted140C: "2" as const,
    businessCode: "46209",
    businessActivity: "test trade",
    auditorName: "Test Audit PLT",
    auditorTin: "C 111",
  };
}

describe("mytax portal mirror", () => {
  it("8 canonical steps in portal order", () => {
    expect(MYTAX_STEPS.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(MYTAX_STEPS[0].portalPath).toBe("/eC2025/MakAsas");
    expect(MYTAX_STEPS[7].id).toBe("rumusan");
  });

  it("blank profile is not ready — every date/flag listed", () => {
    const c = coverProfil(blankMyTaxProfile());
    expect(c.ready).toBe(false);
    expect(c.missing.join(" ")).toMatch(/Tempoh asas Dari/);
    expect(c.missing.length).toBeGreaterThan(10);
  });

  it("full test profile passes Profil", () => {
    expect(coverProfil(fullProfile()).ready).toBe(true);
  });

  it("garbage dates rejected (portal DateTime crash class)", () => {
    const p = { ...fullProfile(), acctFrom: "31/02/2025", basisTo: "not-a-date" };
    const c = coverProfil(p);
    expect(c.ready).toBe(false);
    expect(c.missing.join("|")).toMatch(/Tempoh perakaunan Dari|Tempoh asas Hingga/);
  });

  it("MakSykt blocked without Profil — mirrors server crash", () => {
    const c = coverMaksykt(fullProfile(), false, [{ name: "A" }], [{ name: "B" }]);
    expect(c.ready).toBe(false);
    expect(c.missing.join(" ")).toMatch(/Profil dahulu/);
  });

  it("MakSykt demands directors, shareholders, refund, flags, code, auditor", () => {
    const c = coverMaksykt({ ...fullProfile(), refundMethod: "", businessCode: "", auditorName: "" }, true, [], []);
    expect(c.missing.join(" ")).toMatch(/pengarah.*pemegang syer.*bayaran balik.*Kod perniagaan.*juruaudit/s);
  });

  it("SME band mismatch blocks Cukai + submit", () => {
    const out = evaluateCoverage({
      profile: fullProfile(),
      directors: [{ name: "A" }],
      shareholders: [{ name: "B" }],
      smeQualifies: true,
      portalSmeBand: "24",
      chargeableSen: 82679_00,
      grossTaxSen: 12401_85,
      netProfitTied: true,
      kewanganTied: true,
      checklistDone: true,
    });
    const cukai = out.steps.find((s) => s.id === "cukai")!;
    expect(cukai.ready).toBe(false);
    expect(out.submitBlockers.join(" ")).toMatch(/jalur kadar/);
  });

  it("Rumusan never auto-ready — human sign-off gate always present", () => {
    const blockers = coverRumusanGate(true, true, true);
    expect(blockers.join(" ")).toMatch(/titik tanpa patah balik/);
    const out = evaluateCoverage({
      profile: fullProfile(),
      directors: [{ name: "A" }],
      shareholders: [{ name: "B" }],
      smeQualifies: false,
      portalSmeBand: "24",
      chargeableSen: 100,
      grossTaxSen: 24,
      netProfitTied: true,
      kewanganTied: true,
      checklistDone: true,
    });
    expect(out.steps.find((s) => s.id === "rumusan")!.ready).toBe(false);
    expect(out.submitBlockers.length).toBeGreaterThan(0);
  });
});
