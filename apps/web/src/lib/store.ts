import { isWhtSection } from "@formc/engine";
import { blankEngagement } from "./types.js";
import type { Engagement } from "./types.js";
import { CHECKLIST } from "./constants.js";

const KEY = "formc.engagements.v4";
// v1–v3 keys are abandoned AND wiped on load — they may hold real client
// data from earlier builds. No migration: re-key from source.

function normalizeStored(e: Record<string, unknown>): Engagement {
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
  // Older records may have a shorter checks array than current CHECKLIST.
  if (!Array.isArray(merged.checks) || merged.checks.length !== CHECKLIST.length) {
    const prev = Array.isArray(merged.checks) ? merged.checks : [];
    merged.checks = CHECKLIST.map((_, i) => prev[i] ?? false);
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
