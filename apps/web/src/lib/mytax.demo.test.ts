import { describe, expect, it } from "vitest";
import { blankMyTaxProfile, evaluateCoverage } from "@formc/engine";
import { blankEngagement } from "./types.js";
import { computeEngagement } from "./computation.js";
import { mytaxOf } from "./mytax.js";

// Full walkthrough: take a blank engagement, fill it like a real job,
// prove steps 1–7 flip ready and only the human sign-off gate remains.
describe("mytax demo walkthrough", () => {
  it("realistic filled engagement flips 1-7, rumusan stays human-gated", () => {
    const eng = blankEngagement();
    eng.companyName = "DADA JUTA SDN. BHD.";
    eng.regNo = "202501056626";
    eng.directors = [
      { id: "d1", name: "Aiman Hakim", sharePct: "100", salaryRM: "0", loanRM: "0" },
    ];
    eng.shareholders = [{ id: "s1", name: "Aiman Hakim", shares: "1000", pct: "100" }];
    eng.checks = eng.checks.map(() => true);
    eng.kewanganTied = true;
    eng.portalSmeBand = "15/17/24"; // blankEngagement SME profile qualifies
    eng.mytax = {
      ...blankMyTaxProfile(),
      tin: "C 60490708070",
      employerTin: "E 9626405801",
      operasiDate: "15/01/2025",
      incorpMY: "1",
      residentCountry: "MYS",
      acctFrom: "15/01/2025",
      acctTo: "31/12/2025",
      basisFrom: "15/01/2025",
      basisTo: "31/12/2025",
      businessStatus: "1",
      guaranteeCo: "2",
      statutoryBody: "2",
      peMY: "2",
      spvSecuritisation: "2",
      controlledCo: "2",
      foreignNoShareCo: "2",
      smePara2B2C: "2",
      shareChange445A: "3",
      groupClaim: "3",
      refundMethod: "own-malaysia",
      dividendToIndividuals: "2",
      dividendVoucher: "2",
      controlledTx139_140A: "2",
      foreignExemptIncome: "2",
      interestRestricted140C: "2",
      businessCode: "46209",
      businessActivity: "test trade",
      auditorName: "Test Audit PLT",
      auditorTin: "C 111",
    };

    const { result } = computeEngagement(eng);
    expect(result.smeQualifies).toBe(true);
    expect(result.chargeableSen).toBeGreaterThan(0);

    const out = evaluateCoverage({
      profile: mytaxOf(eng),
      directors: eng.directors,
      shareholders: eng.shareholders,
      smeQualifies: result.smeQualifies,
      portalSmeBand: eng.portalSmeBand,
      chargeableSen: result.chargeableSen,
      grossTaxSen: result.grossTaxSen,
      netProfitTied: true,
      kewanganTied: eng.kewanganTied,
      checklistDone: eng.checks.every(Boolean),
    });

    const byId = Object.fromEntries(out.steps.map((s) => [s.id, s]));
    for (const id of ["profil", "maksykt", "pendapatan", "cukai", "kewangan", "elaun", "tuntutan"] as const) {
      expect(byId[id].ready, `${id} missing: ${byId[id].missing.join("; ")}`).toBe(true);
    }
    expect(byId["rumusan"].ready).toBe(false); // human sign-off only
    expect(out.submitBlockers.join(" ")).toMatch(/titik tanpa patah balik/);
  });
});
