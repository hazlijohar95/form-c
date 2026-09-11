import type { Sen } from "./money.js";
import { toSen } from "./money.js";
import { CAPS } from "./rates.js";

// Cross-border and related-party computations: WHT (s.109/109A/109B/107A),
// earnings stripping (s.140C), deemed interest on advances (s.140B).

export type WhtSection = "s.109-interest" | "s.109-royalty" | "s.109B" | "s.107A" | "s.109A";

export const WHT_RATES: Record<WhtSection, number> = {
  "s.109-interest": 0.15,
  "s.109-royalty": 0.1,
  "s.109B": 0.1, // technical/management fees, rental of movables
  "s.107A": 0.13, // contract payments 10% + 3%
  "s.109A": 0.15, // public entertainers
};

export interface WhtLine {
  description: string;
  amountSen: Sen;
  section: WhtSection;
  dtaRate?: number; // treaty rate overrides domestic if lower
  remitted: boolean;
}

export interface WhtResult extends WhtLine {
  rate: number;
  whtDueSen: Sen;
  deductible: boolean; // false → add back under s.39(2)
}

export function assessWht(line: WhtLine): WhtResult {
  const domestic = WHT_RATES[line.section];
  const rate = line.dtaRate !== undefined ? Math.min(domestic, line.dtaRate) : domestic;
  return {
    ...line,
    rate,
    whtDueSen: Math.round(line.amountSen * rate),
    deductible: line.remitted,
  };
}

// s.140C: interest on controlled cross-border transactions exceeding the
// greater of RM500k or 20% of tax-EBITDA is permanently disallowed.
export function earningsStripping(relatedInterestSen: Sen, taxEbitdaSen: Sen): Sen {
  return earningsStrippingWith(
    relatedInterestSen,
    taxEbitdaSen,
    toSen(CAPS.earningsStrippingDeMinimisRM),
    CAPS.earningsStrippingPctOfEbitda
  );
}

export function earningsStrippingWith(
  relatedInterestSen: Sen,
  taxEbitdaSen: Sen,
  deMinimisSen: Sen,
  pct: number
): Sen {
  if (relatedInterestSen <= deMinimisSen) return 0;
  const cap = Math.round(taxEbitdaSen * pct);
  const limit = Math.max(deMinimisSen, cap);
  return Math.max(0, relatedInterestSen - limit);
}

// s.140B: advance to director/shareholder out of internal funds — deemed
// gross interest income at market rate for the debit period.
export function deemedInterest140B(peakDebitSen: Sen, debitMonths: number, annualRatePct: number): Sen {
  if (peakDebitSen <= 0 || debitMonths <= 0 || annualRatePct <= 0) return 0;
  return Math.round(((peakDebitSen * annualRatePct) / 100) * (debitMonths / 12));
}
