import type { Sen } from "./money.js";
import { CAPS } from "./rates.js";

export interface LossYearInput {
  yearOfAssessment: number;
  amountBfSen: Sen;
}

// B/F business-loss set-off shared by Form C (s.44(5A)) and Form B
// (business source, same 10-year FIFO discipline): absorbs `remaining`
// but never more than the business portion still in play, drops expired
// or future years, carries the rest forward in year order.
export function applyBfLosses(input: {
  remainingSen: Sen;
  businessCapSen: Sen; // business income still inside remainingSen
  bfLosses: LossYearInput[];
  currentYa: number;
}): { remainingSen: Sen; lossUsedSen: Sen; lossCf: LossYearInput[]; expiredDropped: boolean } {
  let remaining = input.remainingSen;
  let lossUsed = 0;
  const lossCf: LossYearInput[] = [];
  let expiredDropped = false;
  for (const ly of input.bfLosses) {
    const age = input.currentYa - ly.yearOfAssessment;
    if (age > CAPS.lossCarryYears || age < 0) {
      expiredDropped = true;
      continue; // expired or future — drop
    }
    if (remaining <= 0) {
      lossCf.push(ly);
      continue;
    }
    // B/F business loss can only absorb up to business portion still in remaining.
    const businessCap = Math.min(remaining, Math.max(0, input.businessCapSen - lossUsed));
    const use = Math.min(ly.amountBfSen, remaining, businessCap);
    lossUsed += use;
    remaining -= use;
    const left = ly.amountBfSen - use;
    if (left > 0) lossCf.push({ yearOfAssessment: ly.yearOfAssessment, amountBfSen: left });
  }
  return { remainingSen: remaining, lossUsedSen: lossUsed, lossCf, expiredDropped };
}
