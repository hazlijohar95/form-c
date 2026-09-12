// Decimal-safe RM string <-> sen helpers. All UI amounts stay as strings;
// parse once here instead of ad-hoc Number()/rmStrToSen in render loops.

/** Parse "1,234.56" -> 123456 sen. Invalid/negative -> 0 (legacy behaviour). */
export function rmStrToSen(v: string): number {
  return parseRm(v).sen;
}

export interface RmParse {
  sen: number;
  /** Non-empty when a non-blank input was coerced (silent-zero legacy path). */
  error: string | null;
}

/** Strict parse surfacing coercions at the Computation bridge Seam.
 * Empty string → { 0, null } (untouched field, not an error).
 * Malformed / negative / unsafe → { 0, reason } so callers can warn. */
export function parseRm(v: string): RmParse {
  const raw = String(v);
  const s = raw.replace(/,/g, "").trim();
  if (s === "") return { sen: 0, error: null };
  const m = s.match(/^(-)?(\d+)(?:\.(\d{1,2}))?$/);
  if (!m) return { sen: 0, error: `"${raw}" is not a valid RM amount — treated as 0` };
  if (m[1]) return { sen: 0, error: `"${raw}" is negative — clamped to 0` };
  const rm = Number(m[2]);
  const cents = (m[3] ?? "").padEnd(2, "0");
  if (!Number.isSafeInteger(rm)) return { sen: 0, error: `"${raw}" exceeds safe range — treated as 0` };
  return { sen: rm * 100 + Number(cents), error: null };
}

/** Parse a signed RM string ("-12,000.50" allowed) -> sen. Malformed -> 0. */
export function signedRmToSen(v: string): number {
  const s = String(v).replace(/,/g, "").trim();
  if (s === "") return 0;
  const m = s.match(/^(-)?(\d+)(?:\.(\d{1,2}))?$/);
  if (!m) return 0;
  const rm = Number(m[2]);
  const cents = (m[3] ?? "").padEnd(2, "0");
  if (!Number.isSafeInteger(rm)) return 0;
  const sen = rm * 100 + Number(cents);
  return m[1] ? -sen : sen;
}

/** True when a signed RM string is well-formed (blank counts as untouched). */
export function isSignedRm(v: string): boolean {
  const s = String(v).replace(/,/g, "").trim();
  if (s === "") return true;
  const m = s.match(/^(-)?(\d+)(?:\.(\d{1,2}))?$/);
  return m !== null && Number.isSafeInteger(Number(m[2]));
}

/** Parse a plain numeric string ("12", "4.5") -> number, fallback 0. */
export function numOr0(v: string): number {
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

/** Exact sen -> "1234.56" without float round-trip. */
export function senToRMString(sen: number): string {
  const s = Math.round(sen);
  const sign = s < 0 ? "-" : "";
  const abs = Math.abs(s);
  const rm = Math.trunc(abs / 100);
  const cents = abs % 100;
  return cents === 0 ? `${sign}${rm}` : `${sign}${rm}.${cents.toString().padStart(2, "0").replace(/0$/, "")}`;
}

/** True if any month-end balance string parses to a debit (< 0). */
export function hasDebitBalance(balances: string[]): boolean {
  return balances.some((b) => {
    if (b.trim() === "") return false;
    const n = Number(String(b).replace(/,/g, "").trim());
    return Number.isFinite(n) && n < 0;
  });
}
