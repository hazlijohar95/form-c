import { blankClient, uid } from "./types.js";
import type { Client, ClientKind } from "./types.js";

const KEY = "formc.clients.v1";

function normalize(c: Record<string, unknown>): Client {
  const base = blankClient("company");
  const merged = { ...base, ...c } as Client;
  if (merged.kind !== "company" && merged.kind !== "individual" && merged.kind !== "partnership")
    merged.kind = "company";
  if (!Array.isArray(merged.members)) merged.members = [];
  return merged;
}

export function loadClients(): Client[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as Record<string, unknown>[]).map(normalize);
  } catch {
    return [];
  }
}

export function saveClients(list: Client[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage full/blocked — engagements remain source of truth
  }
}

export { blankClient, uid };
export type { Client, ClientKind };
