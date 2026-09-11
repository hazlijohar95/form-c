import type { AddBackSection, CaCategory } from "@formc/engine";

export const SECTIONS: AddBackSection[] = [
  "s.39(1)(a)",
  "s.39(1)(b)",
  "s.39(1)(c)",
  "s.39(1)(d)",
  "s.39(1)(e)",
  "s.39(1)(f)",
  "s.39(1)(l)",
  "s.39(1)(m)",
  "s.39(2)",
  "s.140C",
];

export const CATEGORIES: { value: CaCategory; label: string }[] = [
  { value: "cat1-20", label: "Cat 1 — Heavy/motor (20% AA)" },
  { value: "cat2-14", label: "Cat 2 — General plant (14% AA)" },
  { value: "cat3-10", label: "Cat 3 — Office/furniture (10% AA)" },
  { value: "ict-std", label: "ICT standard (40% IA / 20% AA)" },
  { value: "aca2026", label: "Budget 2026 ACA (20% IA / 40% AA)" },
  { value: "small-value", label: "Small value ≤RM2k (100%)" },
  { value: "iba-3", label: "Industrial building (10% IA / 3% AA)" },
];

export const CHECKLIST = [
  "P&L net profit tied to TB — no estimates",
  "Depreciation added back [s.39(1)(c)]",
  "General provisions added back; only specific bad debts claimed [s.39(1)(m)]",
  "Entertainment split 50% vs 100% proviso [s.39(1)(l)]",
  "Penalties, fines, private expenses added back [s.39(1)(a),(d)]",
  "Non-resident payments WHT-checked [s.39(2)]",
  "Each asset QE verified; motor caps applied",
  "B/F losses carry year-of-origin; expiry ≤10yr [s.44(5A)]",
  "Donations ≤10%, zakat ≤2.5% of aggregate",
  "SME 5 conditions evidenced; CP204 checked",
];
