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
  let n = 0;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    // Match trailing number: "Depreciation 50,000.00" or "Sales (1,200,000)"
    const m = line.match(/^(.*?)\s+(\(?[\d,]+\.\d{2})\)?\s*$/);
    if (!m || !m[1] || !m[2]) continue;
    const label = m[1].trim();
    if (label.length < 2) continue;
    const negative = line.includes("(") && line.includes(")");
    const amount = Number(m[2].replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) continue;
    n += 1;
    out.push({
      id: `tb-${n}`,
      label,
      amountSen: Math.round(amount * 100),
      kind: negative ? "credit" : "debit",
    });
  }
  return out;
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
