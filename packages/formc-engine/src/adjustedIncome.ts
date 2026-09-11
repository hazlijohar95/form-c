import type { Sen } from "./money.js";

// Every add-back carries its ITA section. No section-less judgments.
export type AddBackSection =
  | "s.39(1)(a)" // domestic/private
  | "s.39(1)(b)" // capital expenditure
  | "s.39(1)(c)" // depreciation
  | "s.39(1)(d)" // not wholly and exclusively
  | "s.39(1)(e)" // income tax provision
  | "s.39(1)(f)" // unapproved contributions
  | "s.39(1)(l)" // entertainment
  | "s.39(1)(m)" // general provision
  | "s.39(2)" // WHT not remitted
  | "s.140C"; // earnings stripping excess

export interface AddBack {
  description: string;
  amountSen: Sen;
  section: AddBackSection;
}

export interface Deduction {
  description: string;
  amountSen: Sen;
  basis: string; // e.g. "single-tier exempt", "s.33(1)"
}

export interface DoubleDeduction {
  description: string;
  amountSen: Sen;
  authority: string; // gazette / approval reference
  code?: string; // e-C Part D1 claim code, e.g. "132", "157"
  capSen?: Sen; // statutory cap, e.g. code 157 RM15,000
}

export function doubleTotal(list: DoubleDeduction[]): Sen {
  return list.reduce((a, b) => a + Math.min(b.amountSen, b.capSen ?? b.amountSen), 0);
}

// Entertainment: general rule 50% disallowable, listed provisos 100% deductible.
export function entertainmentAddBack(totalEntertainmentSen: Sen, fullyDeductibleSen: Sen): Sen {
  const remainder = totalEntertainmentSen - fullyDeductibleSen;
  if (remainder <= 0) return 0;
  return Math.round(remainder * 0.5);
}

export function adjustedIncome(
  netProfitSen: Sen,
  addBacks: AddBack[],
  nonTaxableCredits: Deduction[],
  doubleDeductions: DoubleDeduction[]
): Sen {
  const addTotal = addBacks.reduce((a, b) => a + b.amountSen, 0);
  const creditTotal = nonTaxableCredits.reduce((a, b) => a + b.amountSen, 0);
  const doubleDed = doubleTotal(doubleDeductions);
  return netProfitSen + addTotal - creditTotal - doubleDed;
}
