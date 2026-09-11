import type { Sen } from "./money.js";
import type { AddBack } from "./adjustedIncome.js";
import type { WhtLine } from "./related.js";
import { assessWht, earningsStripping } from "./related.js";

export interface DisallowanceResult {
  autoAddBacks: AddBack[];
  stripSen: Sen;
  whtFindings: string[];
  stripFinding: string | null;
  nonBusinessExtra: { label: string; amountSen: Sen }[];
}

// Deepened Disallowance Module: WHT s.39(2) + s.140C + s.140B in one
// Implementation. Single assessWht pass — findings derived from the
// same results used for synthesis, no second loop.
export function computeDisallowances(args: {
  whtLines: WhtLine[];
  relatedInterestSen: Sen;
  taxEbitdaSen: Sen;
  deemedInterestSen: Sen;
}): DisallowanceResult {
  const autoAddBacks: AddBack[] = [];
  const whtFindings: string[] = [];
  for (const w of args.whtLines) {
    const r = assessWht(w);
    if (!r.deductible) {
      autoAddBacks.push({
        description: `${w.description} (WHT ${Math.round(r.rate * 100)}% not remitted)`,
        amountSen: w.amountSen,
        section: "s.39(2)",
      });
      whtFindings.push(`WHT not remitted on "${w.description}" — added back s.39(2)`);
    }
  }
  const stripSen = earningsStripping(args.relatedInterestSen, args.taxEbitdaSen);
  let stripFinding: string | null = null;
  if (stripSen > 0) {
    autoAddBacks.push({
      description: "Related-party interest above 20% tax-EBITDA",
      amountSen: stripSen,
      section: "s.140C",
    });
    stripFinding = "s.140C earnings stripping disallowance applied";
  }
  const nonBusinessExtra =
    args.deemedInterestSen > 0
      ? [{ label: "Deemed interest (s.140B)", amountSen: args.deemedInterestSen }]
      : [];
  return { autoAddBacks, stripSen, whtFindings, stripFinding, nonBusinessExtra };
}
