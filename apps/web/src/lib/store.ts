import { isWhtSection } from "@formc/engine";
import { blankEngagement } from "./types.js";
import type { Engagement } from "./types.js";
import { checklistFor } from "./constants.js";

const KEY = "formc.engagements.v4";
// v1–v3 keys are abandoned AND wiped on load — they may hold real client
// data from earlier builds. No migration: re-key from source.

export function normalizeStored(e: Record<string, unknown>): Engagement {
  const base = blankEngagement();
  const merged = { ...base, ...e } as Engagement;
  // v4 records may carry untyped WHT sections from before WhtLineUI.section
  // was narrowed to WhtSection — coerce unknown values instead of casting.
  if (Array.isArray(merged.whtLines)) {
    merged.whtLines = merged.whtLines.map((l) => {
      const raw = (l as { section: unknown }).section;
      return {
        ...l,
        section: typeof raw === "string" && isWhtSection(raw) ? raw : "s.109B",
      };
    });
  }
  // Older records may carry a shorter checks array — pad per form checklist.
  const wantChecks = checklistFor(merged.formType === "B" ? "B" : merged.formType === "P" ? "P" : "C").length;
  if (!Array.isArray(merged.checks) || merged.checks.length !== wantChecks) {
    const prev = Array.isArray(merged.checks) ? merged.checks : [];
    merged.checks = Array.from({ length: wantChecks }, (_, i) => prev[i] ?? false);
  }
  // Pre-multi-form records lack the Phase 1 fields — default, never migrate.
  if (merged.formType !== "C" && merged.formType !== "B" && merged.formType !== "P") merged.formType = "C";
  if (typeof merged.clientId !== "string") merged.clientId = "";
  for (const k of ["documents", "reliefs", "businesses", "partnerships", "partnerShares"] as const) {
    if (!Array.isArray(merged[k])) merged[k] = [];
  }
  for (const k of ["cp500EstimateRM", "cp500PaidRM", "employmentRM", "rebatesRM"] as const) {
    if (typeof merged[k] !== "string") merged[k] = k === "employmentRM" ? "" : "0";
  }
  // Phase 1 nested rows may predate newer fields — default per row.
  if (Array.isArray(merged.partnerShares)) {
    merged.partnerShares = merged.partnerShares.map((s) => {
      const r = s as unknown as Partial<(typeof merged.partnerShares)[number]>;
      return {
        ...s,
        firmAdjustedRM: r.firmAdjustedRM ?? "",
        firmSalariesRM: r.firmSalariesRM ?? "",
        firmInterestRM: r.firmInterestRM ?? "",
      };
    });
  }
  if (!Array.isArray(merged.declarations) || merged.declarations.length === 0) {
    merged.declarations = base.declarations;
  }
  return merged;
}

export function loadAll(): Engagement[] {
  try {
    for (const k of ["formc.engagements.v1", "formc.engagements.v2", "formc.engagements.v3"])
      localStorage.removeItem(k);
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as Record<string, unknown>[]).map(normalizeStored);
  } catch {
    return [];
  }
}

export function eraseAll(): void {
  for (const k of ["formc.engagements.v1", "formc.engagements.v2", "formc.engagements.v3", KEY])
    localStorage.removeItem(k);
}

export function saveAll(list: Engagement[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}
