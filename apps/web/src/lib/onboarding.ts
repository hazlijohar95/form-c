import { uid } from "./lists.js";
import type { DocSlot, DocStatus, FormType, OpenItem } from "./types.js";

// Onboarding document checklist per form type — what a tax agent asks for
// before touching numbers (§1 of the practice notes). `required` docs gate
// computation; `optional` docs are chased only when applicable.
export interface DocDef {
  code: string;
  label: string;
  required: boolean;
  forms: FormType[];
}

export const ONBOARDING_DOCS: DocDef[] = [
  // Identity + appointment (all forms)
  { code: "engage-letter", label: "Engagement letter + fee agreed", required: true, forms: ["C", "B", "P"] },
  { code: "agent-appoint", label: "MyTax tax-agent appointment", required: true, forms: ["C", "B", "P"] },
  { code: "prior-return", label: "Prior-YA return + computation", required: true, forms: ["C", "B", "P"] },
  { code: "prior-accounts", label: "Prior-year audited / full-set accounts", required: false, forms: ["C", "B", "P"] },
  // Company (Form C)
  { code: "ssm", label: "SSM search — directors / shareholders", required: true, forms: ["C"] },
  { code: "tb", label: "Trial balance (current YA)", required: true, forms: ["C", "B", "P"] },
  { code: "fs", label: "P&L + balance sheet + GL", required: true, forms: ["C", "B", "P"] },
  { code: "bank", label: "Bank statements", required: false, forms: ["C", "B", "P"] },
  { code: "fa-register", label: "Fixed-asset register + additions / disposals", required: true, forms: ["C", "B", "P"] },
  { code: "hp", label: "Hire-purchase agreements (if any)", required: false, forms: ["C", "B", "P"] },
  { code: "payroll", label: "Payroll + Form E / EA / ECP", required: false, forms: ["C", "B", "P"] },
  { code: "rental-interest", label: "Rental / interest schedules (s.4(c)–(f))", required: false, forms: ["C", "B"] },
  { code: "related-party", label: "Related-party ledgers (s.140B / s.140C)", required: false, forms: ["C"] },
  { code: "wht", label: "WHT records (CP37 / remittance)", required: false, forms: ["C", "B"] },
  { code: "cp204", label: "CP204 receipts (s.107C)", required: false, forms: ["C"] },
  { code: "donation", label: "Donation / zakat receipts", required: false, forms: ["C", "B"] },
  { code: "dividend", label: "Dividend vouchers", required: false, forms: ["C"] },
  // Individual (Form B)
  { code: "rob", label: "ROB business registration(s)", required: true, forms: ["B"] },
  { code: "form-p", label: "Form P + profit-allocation (if partner)", required: false, forms: ["B"] },
  { code: "ea", label: "EA form — employment income (if any)", required: false, forms: ["B"] },
  { code: "reliefs", label: "Relief receipts (EPF / insurance / lifestyle / medical / education / SSPN / PRS)", required: true, forms: ["B"] },
  { code: "family", label: "Spouse / children details for reliefs", required: true, forms: ["B"] },
  { code: "cp500", label: "CP500 receipts (s.107B)", required: false, forms: ["B"] },
  // Partnership (Form P)
  { code: "partnership-agreement", label: "Partnership agreement + profit-sharing ratio", required: true, forms: ["P"] },
  { code: "partners", label: "Partners' TIN / IC schedule", required: true, forms: ["P"] },
];

export function docsFor(form: FormType): DocDef[] {
  return ONBOARDING_DOCS.filter((d) => d.forms.includes(form));
}

// Top up an engagement's document slots from the checklist (idempotent).
export function ensureDocuments(current: DocSlot[], form: FormType): DocSlot[] {
  const have = new Set(current.map((d) => d.code));
  const next = [...current];
  for (const def of docsFor(form)) {
    if (!have.has(def.code)) {
      next.push({ id: uid(), code: def.code, label: def.label, required: def.required, status: "missing", note: "" });
    }
  }
  return next;
}

export function requiredDocsIn(documents: DocSlot[]): { done: number; total: number } {
  const req = documents.filter((d) => d.required);
  return { done: req.filter((d) => d.status !== "missing").length, total: req.length };
}

// Upsert one checklist slot by code — shared by the Onboard tab and the
// Ingest receipt log so both write the same slot, never duplicates.
export function setDocStatus(
  documents: DocSlot[],
  def: { code: string; label: string; required: boolean },
  status: DocStatus
): DocSlot[] {
  const cur = documents.find((d) => d.code === def.code);
  return cur
    ? documents.map((d) => (d.code === def.code ? { ...d, status } : d))
    : [...documents, { id: uid(), code: def.code, label: def.label, required: def.required, status, note: "" }];
}

// Push missing required docs into [TO OBTAIN]; resolve items whose docs
// arrived or were waived. Matches on the `Doc:` title prefix.
export function syncDocsToOpenItems(documents: DocSlot[], openItems: OpenItem[]): OpenItem[] {
  const byTitle = new Map(openItems.map((o) => [o.title, o]));
  const next = [...openItems];
  for (const d of documents) {
    const title = `Doc: ${d.label}`;
    const existing = byTitle.get(title);
    if (d.status === "missing" && d.required) {
      if (!existing) {
        next.push({
          id: uid(),
          title,
          whyBlocks: "Required source doc not yet received",
          effect: "Computation cannot start until obtained or waived",
          resolved: false,
        });
      } else if (existing.resolved) {
        const i = next.findIndex((o) => o.id === existing.id);
        next[i] = { ...existing, resolved: false };
      }
    } else if ((d.status === "received" || d.status === "waived") && existing && !existing.resolved) {
      const i = next.findIndex((o) => o.id === existing.id);
      next[i] = { ...existing, resolved: true };
    }
  }
  return next;
}
