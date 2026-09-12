export type Tab = "ingest" | "entry" | "registers" | "review" | "ekey" | "report";

export const TABS: { id: Tab; label: string; step: string }[] = [
  { id: "ingest", label: "Ingest", step: "1" },
  { id: "entry", label: "Entry", step: "2" },
  { id: "registers", label: "Registers", step: "3" },
  { id: "review", label: "Review", step: "4" },
  { id: "ekey", label: "e-C keying", step: "5" },
  { id: "report", label: "Report", step: "6" },
];

export function isTab(v: unknown): v is Tab {
  return typeof v === "string" && TABS.some((t) => t.id === v);
}
