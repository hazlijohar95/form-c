export type Tab = "onboard" | "ingest" | "entry" | "registers" | "review" | "ekey" | "report";

export interface TabMeta {
  id: Tab;
  label: string;
  plain: string;
  step: string;
  blurb: string;
  hint: string;
}

export const TABS: TabMeta[] = [
  { id: "onboard", label: "Onboard", plain: "Start", step: "0", blurb: "Who is filing, and is the file ready?", hint: "Pick return type, link client, clear missing docs." },
  { id: "ingest", label: "Ingest", plain: "Docs", step: "1", blurb: "Turn source docs into posted lines.", hint: "Paste the trial balance, assign each line once." },
  { id: "entry", label: "Entry", plain: "Numbers", step: "2", blurb: "Key the computation — profit, add-backs, allowances.", hint: "One section at a time. Totals update live." },
  { id: "registers", label: "Registers", plain: "Registers", step: "3", blurb: "People, loans and instalments that prove the numbers.", hint: "Directors, related accounts, CP204 bills." },
  { id: "review", label: "Review", plain: "Check", step: "4", blurb: "Clear every flag before you key into MyTax.", hint: "Verification, blocking items, sign-off." },
  { id: "ekey", label: "e-C keying", plain: "Keying", step: "5", blurb: "Key top-to-bottom into MyTax, no re-typing.", hint: "Screen order with prior-year beside current." },
  { id: "report", label: "Report", plain: "File", step: "6", blurb: "Sign off, snapshot and export.", hint: "Checklist gates the MyTax JSON." },
];

export function isTab(v: unknown): v is Tab {
  return typeof v === "string" && TABS.some((t) => t.id === v);
}

export function tabIndex(id: Tab): number {
  return TABS.findIndex((t) => t.id === id);
}

export function nextTab(id: Tab): Tab {
  const i = tabIndex(id);
  return TABS[Math.min(TABS.length - 1, i + 1)].id;
}

export function prevTab(id: Tab): Tab {
  const i = tabIndex(id);
  return TABS[Math.max(0, i - 1)].id;
}
