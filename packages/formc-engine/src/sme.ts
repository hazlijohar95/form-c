import { toSen } from "./money.js";
import type { RateBand } from "./money.js";
import { STANDARD_RATE, YA_2025, YA_2026 } from "./rates.js";

export interface SmeProfile {
  paidUpCapitalRM: number;
  grossBusinessIncomeRM: number;
  controlsLargeCompany: boolean;
  controlledByLargeCompany: boolean;
  foreignOwnershipPct: number;
  isResident: boolean;
}

export interface SmeResult {
  qualifies: boolean;
  failedConditions: string[];
}

// All 5 conditions must pass. One failure = flat 24%.
export function checkSme(profile: SmeProfile): SmeResult {
  const failed: string[] = [];
  if (profile.paidUpCapitalRM > 2_500_000)
    failed.push("paid-up capital exceeds RM2.5m");
  if (profile.grossBusinessIncomeRM > 50_000_000)
    failed.push("gross business income exceeds RM50m");
  if (profile.controlsLargeCompany)
    failed.push("controls a company with paid-up capital > RM2.5m");
  if (profile.controlledByLargeCompany)
    failed.push("controlled by a company with paid-up capital > RM2.5m");
  if (profile.foreignOwnershipPct > 20)
    failed.push("foreign ownership exceeds 20%");
  if (!profile.isResident) failed.push("non-resident company");
  return { qualifies: failed.length === 0, failedConditions: failed };
}

export function smeBands(): RateBand[] {
  return [
    { fromSen: 0, toSen: toSen(150_000), rate: 0.15 },
    { fromSen: toSen(150_000), toSen: toSen(600_000), rate: 0.17 },
    { fromSen: toSen(600_000), toSen: null, rate: 0.24 },
  ];
}

export function flatBand(): RateBand[] {
  return [{ fromSen: 0, toSen: null, rate: STANDARD_RATE }];
}

// Deepened SME Module seam: qualification + IHC override + YA-versioned
// band selection in one place. YA_2025/YA_2026 share the 15/17/24 table;
// unknown YA falls back to current bands so math never blocks on version.
export function smeBandsFor(qualifies: boolean, isIhc: boolean, ya?: number): RateBand[] {
  if (ya !== undefined && ya !== YA_2025 && ya !== YA_2026) return flatBand();
  return qualifies && !isIhc ? smeBands() : flatBand();
}

export function smePortalBand(qualifies: boolean, isIhc: boolean): string {
  return qualifies && !isIhc ? "15/17/24" : "24";
}

export function smeFinding(qualifies: boolean, failed: string[]): string | null {
  if (qualifies) return null;
  return `SME rate denied: ${failed.join("; ")} — flat 24% applied`;
}

export interface ResolvedSme {
  qualifies: boolean;
  failedConditions: string[];
  smeQualifies: boolean;
  bands: RateBand[];
  finding: string | null;
  portalBand: string;
  yaNote: string | null;
}

export function resolveSme(profile: SmeProfile, opts: { isIhc: boolean; ya: number }): ResolvedSme {
  const checked = checkSme(profile);
  const knownYa = opts.ya === YA_2025 || opts.ya === YA_2026;
  const bands = smeBandsFor(checked.qualifies, opts.isIhc, opts.ya);
  const smeQualifies = checked.qualifies && !opts.isIhc && knownYa;
  const finding = smeFinding(checked.qualifies, checked.failedConditions);
  return {
    qualifies: checked.qualifies,
    failedConditions: checked.failedConditions,
    smeQualifies,
    bands,
    finding,
    portalBand: smePortalBand(checked.qualifies, opts.isIhc),
    yaNote: knownYa ? null : `YA ${opts.ya} bands not versioned — flat 24% applied`,
  };
}
