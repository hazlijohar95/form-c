import type { Sen } from "./money.js";

// Incentives: reinvestment allowance (Sch 7A, 60% of QE, against 70% of
// statutory business income), investment tax allowance (against itaPct% of
// statutory, unutilised carried forward), pioneer exempt income (excluded
// from chargeable). Group relief s.44A and IHC s.60F live here too.

export interface IncentiveInput {
  raQeSen: Sen;
  raBfSen: Sen;
  itaAllowanceSen: Sen;
  itaBfSen: Sen;
  itaPct: number; // 70 or 100
  pioneerExemptSen: Sen;
}

export interface IncentiveResult {
  raAvailableSen: Sen;
  raAbsorbedSen: Sen;
  raCfSen: Sen;
  itaAvailableSen: Sen;
  itaAbsorbedSen: Sen;
  itaCfSen: Sen;
}

export function applyIncentives(statutoryBusinessSen: Sen, input: IncentiveInput): {
  afterSen: Sen;
  result: IncentiveResult;
} {
  const raAvailable = Math.round(input.raQeSen * 0.6) + input.raBfSen;
  const raCap = Math.round(statutoryBusinessSen * 0.7);
  const raAbsorbed = Math.min(raAvailable, Math.max(0, raCap));
  const afterRa = statutoryBusinessSen - raAbsorbed;

  const itaAvailable = input.itaAllowanceSen + input.itaBfSen;
  const itaCap = Math.round(afterRa * (input.itaPct / 100));
  const itaAbsorbed = Math.min(itaAvailable, Math.max(0, itaCap));

  return {
    afterSen: afterRa - itaAbsorbed,
    result: {
      raAvailableSen: raAvailable,
      raAbsorbedSen: raAbsorbed,
      raCfSen: raAvailable - raAbsorbed,
      itaAvailableSen: itaAvailable,
      itaAbsorbedSen: itaAbsorbed,
      itaCfSen: itaAvailable - itaAbsorbed,
    },
  };
}

export interface GroupReliefInput {
  surrenderedSen: Sen;
  surrendererLossSen: Sen;
  conditionsMet: boolean;
}

// s.44A: max 70% of surrenderer adjusted loss; all conditions or nothing.
export function validateGroupRelief(input: GroupReliefInput): { allowedSen: Sen; note: string } {
  if (!input.conditionsMet || input.surrenderedSen <= 0)
    return { allowedSen: 0, note: "Group relief not available (conditions fail)" };
  const cap = Math.round(input.surrendererLossSen * 0.7);
  if (input.surrenderedSen > cap)
    return { allowedSen: cap, note: "Surrender capped at 70% of surrenderer loss" };
  return { allowedSen: input.surrenderedSen, note: "" };
}
