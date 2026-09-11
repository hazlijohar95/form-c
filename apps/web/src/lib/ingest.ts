// TB paste parser: propose-step only. Each parsed line becomes an
// unmapped proposal the reviewer assigns to add-back / credit / ignore.
export interface ProposedLine {
  id: string;
  label: string;
  amountSen: number;
  kind: "debit" | "credit";
}

export function parseTrialBalance(text: string): ProposedLine[] {
  const out: ProposedLine[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    // Match trailing number: "Depreciation 50,000.00" or "Sales (1,200,000)"
    const m = line.match(/^(.*?)\s+(\(?[\d,]+(?:\.\d{1,2})?)\)?\s*$/);
    if (!m || !m[1] || !m[2]) continue;
    const label = m[1].trim();
    if (label.length < 2) continue;
    const negative = line.includes("(") && line.includes(")");
    const amountSen = decimalToSen(m[2]);
    if (amountSen <= 0) continue;
    out.push({
      // Stable across re-parses so "posted" state in Ingest.tsx survives edits.
      id: `tb:${label}:${m[2]}:${negative ? "c" : "d"}`,
      label,
      amountSen,
      kind: negative ? "credit" : "debit",
    });
  }
  return out;
}

function decimalToSen(raw: string): number {
  const s = raw.replace(/,/g, "").trim();
  const m = s.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!m) return 0;
  const rm = Number(m[1]);
  const cents = (m[2] ?? "").padEnd(2, "0");
  if (!Number.isSafeInteger(rm)) return 0;
  return rm * 100 + Number(cents);
}

// Keyword hints for likely tax treatment — hints only, reviewer decides.
const HINTS: { re: RegExp; hint: string }[] = [
  { re: /depreci/i, hint: "Likely add-back s.39(1)(c)" },
  { re: /provision|reserve|allowance.*doubt/i, hint: "Check s.39(1)(m) — general provision?" },
  { re: /entertain/i, hint: "Split 50% vs proviso s.39(1)(l)" },
  { re: /penalt|fine|compound|saman/i, hint: "Likely add-back s.39(1)(d)" },
  { re: /donation|zakat/i, hint: "Schedule separately (caps apply)" },
  { re: /tax.*(provision|payable)|current tax/i, hint: "Add back s.39(1)(e)" },
  { re: /dividend.*(income|received)/i, hint: "Likely exempt single-tier — credit" },
  { re: /director.*(fee|remuneration|bonus)/i, hint: "Verify wholly & exclusively s.33(1)" },
];

export function hintFor(label: string): string {
  for (const h of HINTS) if (h.re.test(label)) return h.hint;
  return "";
}
