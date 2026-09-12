import { describe, expect, it } from "vitest";
import { blankEngagement } from "./types.js";
import { docsFor, ensureDocuments, requiredDocsIn, syncDocsToOpenItems } from "./onboarding.js";

describe("docsFor", () => {
  it("requires SSM for companies, ROB for individuals", () => {
    expect(docsFor("C").some((d) => d.code === "ssm" && d.required)).toBe(true);
    expect(docsFor("B").some((d) => d.code === "rob" && d.required)).toBe(true);
    expect(docsFor("B").some((d) => d.code === "ssm")).toBe(false);
    expect(docsFor("P").some((d) => d.code === "partnership-agreement" && d.required)).toBe(true);
  });
});

describe("ensureDocuments + syncDocsToOpenItems", () => {
  it("tops up slots and pushes missing required docs to [TO OBTAIN]", () => {
    const eng = blankEngagement();
    const docs = ensureDocuments(eng.documents, "C");
    expect(docs.length).toBe(docsFor("C").length);
    const req = requiredDocsIn(docs);
    expect(req.done).toBe(0);
    expect(req.total).toBeGreaterThan(0);
    const items = syncDocsToOpenItems(docs, []);
    expect(items.length).toBe(req.total);
    expect(items.every((o) => !o.resolved)).toBe(true);
  });
  it("resolves items when docs arrive, reopens when missing again", () => {
    let docs = ensureDocuments([], "B");
    let items = syncDocsToOpenItems(docs, []);
    docs = docs.map((d) => (d.code === "rob" ? { ...d, status: "received" as const } : d));
    items = syncDocsToOpenItems(docs, items);
    expect(items.find((o) => o.title.includes("ROB"))?.resolved).toBe(true);
    docs = docs.map((d) => (d.code === "rob" ? { ...d, status: "missing" as const } : d));
    items = syncDocsToOpenItems(docs, items);
    expect(items.find((o) => o.title.includes("ROB"))?.resolved).toBe(false);
  });
  it("is idempotent across repeated syncs", () => {
    const docs = ensureDocuments([], "C");
    const once = syncDocsToOpenItems(docs, []);
    const twice = syncDocsToOpenItems(docs, once);
    expect(twice.length).toBe(once.length);
  });
});
