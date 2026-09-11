// Money in sen (integer). All RM inputs convert to sen to avoid float error.
export type Sen = number;

export function toSen(rm: number): Sen {
  return Math.round(rm * 100);
}

export function toRM(sen: Sen): number {
  return sen / 100;
}

export function formatRM(sen: Sen): string {
  const negative = sen < 0;
  const abs = Math.abs(sen);
  const rm = Math.floor(abs / 100);
  const cents = abs % 100;
  const grouped = rm.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}RM ${grouped}.${cents.toString().padStart(2, "0")}`;
}

export function add(...vals: Sen[]): Sen {
  return vals.reduce((a, b) => a + b, 0);
}

export function sub(a: Sen, b: Sen): Sen {
  return a - b;
}

// Rate-band tax on integer sen. Bands use sen boundaries, rate as decimal.
export interface RateBand {
  fromSen: Sen;
  toSen: Sen | null; // null = no upper bound
  rate: number;
}

export function taxOnBands(chargeableSen: Sen, bands: RateBand[]): Sen {
  if (chargeableSen <= 0) return 0;
  let tax = 0;
  for (const band of bands) {
    if (chargeableSen <= band.fromSen) continue;
    const upper = band.toSen === null ? chargeableSen : Math.min(chargeableSen, band.toSen);
    const taxableInBand = upper - band.fromSen;
    if (taxableInBand > 0) tax += Math.round(taxableInBand * band.rate);
  }
  return tax;
}
