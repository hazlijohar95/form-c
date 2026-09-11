import { describe, expect, it } from "vitest";
import { blankEngagement } from "./types.js";
import { mytaxOf } from "./mytax.js";
import { evaluateCoverage } from "@formc/engine";

describe("mytax bridge adversarial", () => {
  it("legacy engagement without mytax defaults to blank (no crash)", () => {
    const eng = blankEngagement();
    delete (eng as Partial<typeof eng>).mytax;
    const m = mytaxOf(eng as never);
    expect(m.operasiDate).toBe("");
    const out = evaluateCoverage({
      profile: m,
      directors: [],
      shareholders: [],
      smeQualifies: false,
      portalSmeBand: "",
      chargeableSen: 0,
      grossTaxSen: 0,
      netProfitTied: false,
      kewanganTied: false,
      checklistDone: false,
    });
    expect(out.steps[0].ready).toBe(false); // profil
    expect(out.steps[1].missing.join(" ")).toMatch(/Profil dahulu/);
  });

  it("kewangan demands TB tie + business code, not just profit", () => {
    const eng = blankEngagement();
    const m = mytaxOf(eng);
    const out = evaluateCoverage({
      profile: { ...m, businessCode: "" },
      directors: [{ name: "A" }],
      shareholders: [{ name: "B" }],
      smeQualifies: false,
      portalSmeBand: "24",
      chargeableSen: 100,
      grossTaxSen: 24,
      netProfitTied: true,
      kewanganTied: false,
      checklistDone: true,
    });
    const kew = out.steps.find((s) => s.id === "kewangan")!;
    expect(kew.ready).toBe(false);
    expect(kew.missing.join(" ")).toMatch(/imbang|Kod perniagaan/);
  });

  it("empty portal band is tolerated (not yet read), wrong band blocks", () => {
    const m = mytaxOf(blankEngagement());
    const ok = evaluateCoverage({
      profile: m, directors: [], shareholders: [],
      smeQualifies: true, portalSmeBand: "",
      chargeableSen: 1, grossTaxSen: 1, netProfitTied: false, kewanganTied: false,
      checklistDone: false,
    });
    expect(ok.steps.find((s) => s.id === "cukai")!.ready).toBe(true);
    const bad = evaluateCoverage({
      profile: m, directors: [], shareholders: [],
      smeQualifies: true, portalSmeBand: "24",
      chargeableSen: 1, grossTaxSen: 1, netProfitTied: false, kewanganTied: false,
      checklistDone: false,
    });
    expect(bad.steps.find((s) => s.id === "cukai")!.ready).toBe(false);
  });
});
