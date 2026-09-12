import { uid, updateById, removeById } from "../lib/lists.js";
import { blankClient } from "../lib/types.js";
import type { Client, ClientKind, DocSlot, Engagement, FormType } from "../lib/types.js";
import { docsFor, ensureDocuments, requiredDocsIn, setDocStatus, syncDocsToOpenItems } from "../lib/onboarding.js";
import { LineTable } from "./LineTable.js";
import type { ClientMember } from "../lib/types.js";

type Patch = (p: Partial<Engagement>) => void;

const FORM_LABEL: Record<FormType, string> = {
  C: "Form C — company (Sdn Bhd)",
  B: "Form B — individual with business",
  P: "Form P — partnership return",
};

const KIND_FOR_FORM: Record<FormType, ClientKind> = { C: "company", B: "individual", P: "partnership" };

const MEMBER_ROLES: Record<ClientKind, ClientMember["role"][]> = {
  company: ["director", "shareholder"],
  individual: ["spouse", "child"],
  partnership: ["partner"],
};

export function Onboard(props: {
  eng: Engagement;
  patch: Patch;
  clients: Client[];
  onClients: (next: Client[]) => void;
  notify: (t: { title: string; detail?: string; err?: boolean }) => void;
}): JSX.Element {
  const { eng, patch, clients, onClients, notify } = props;
  const client = clients.find((c) => c.id === eng.clientId) ?? null;
  const req = requiredDocsIn(eng.documents);
  const openCount = eng.openItems.filter((o) => !o.resolved).length;

  function setFormType(formType: FormType): void {
    patch({ formType, documents: ensureDocuments(eng.documents, formType) });
  }

  function linkClient(id: string): void {
    patch({ clientId: id });
  }

  function createClient(): void {
    const kind = KIND_FOR_FORM[eng.formType];
    const c: Client = {
      ...blankClient(kind),
      name: eng.companyName || blankClient(kind).name,
      regNo: eng.regNo,
    };
    onClients([c, ...clients]);
    patch({ clientId: c.id });
    notify({ title: "Client created", detail: `${c.name} linked to YA${eng.ya}.` });
  }

  function syncObtains(): void {
    const openItems = syncDocsToOpenItems(eng.documents, eng.openItems);
    const added = openItems.length - eng.openItems.length;
    patch({ openItems });
    notify({ title: "Synced to [TO OBTAIN]", detail: added > 0 ? `${added} missing doc(s) queued.` : "Nothing missing — all required docs in or waived." });
  }

  const roles = MEMBER_ROLES[client?.kind ?? KIND_FOR_FORM[eng.formType]];

  return (
    <div>
      <div className="card">
        <h3>Onboard — taxpayer + readiness</h3>
        <p className="hint">
          Who is being filed for, and is the file ready for numbers? Required documents{" "}
          {req.total === 0 ? "load from the checklist below" : `${req.done}/${req.total} in`} ·{" "}
          {openCount} unresolved [TO OBTAIN].
        </p>
        <div className="row3">
          <label className="f">Return type
            <select value={eng.formType} onChange={(e) => setFormType(e.target.value as FormType)} aria-label="Return type">
              {(Object.keys(FORM_LABEL) as FormType[]).map((f) => (
                <option key={f} value={f}>{FORM_LABEL[f]}</option>
              ))}
            </select>
          </label>
          <label className="f">Client master
            <select value={eng.clientId} onChange={(e) => linkClient(e.target.value)} aria-label="Linked client">
              <option value="">— not linked —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.kind})</option>
              ))}
            </select>
          </label>
          <div className="f">
            <span className="field-hint">Link or create</span>
            <button type="button" className="btn btn-xs" onClick={createClient}>
              {client ? "Re-create client from engagement" : "Create client from engagement"}
            </button>
          </div>
        </div>
        <div className="row3">
          <label className="f">Taxpayer name
            <input value={eng.companyName} onChange={(e) => patch({ companyName: e.target.value })} aria-label="Taxpayer name" />
          </label>
          <label className="f">ROC / ROB / TIN
            <input value={eng.regNo} onChange={(e) => patch({ regNo: e.target.value })} aria-label="Registration number" placeholder="C … / ROB … / TIN …" />
          </label>
          <label className="f">YA
            <input value={String(eng.ya)} inputMode="numeric" onChange={(e) => { const n = Number(e.target.value); if (Number.isInteger(n)) patch({ ya: n }); }} aria-label="Year of assessment" />
          </label>
        </div>
      </div>

      <div className="card">
        <h3>{client ? `Members — ${client.name}` : "Members — link or create a client first"}</h3>
        {client ? (
          <LineTable<ClientMember>
            data={client.members}
            onUpdate={(id, p) => onClients(clients.map((c) => (c.id === client.id ? { ...c, members: updateById(c.members, id, p) } : c)))}
            onRemove={(id) => onClients(clients.map((c) => (c.id === client.id ? { ...c, members: removeById(c.members, id) } : c)))}
            onAdd={() => onClients(clients.map((c) => (c.id === client.id ? { ...c, members: [...c.members, { id: uid(), role: roles[0] ?? "director", name: "", sharePct: "", icNo: "", note: "" }] } : c)))}
            addLabel="+ Member"
            describe={(m) => m.name || m.role}
            emptyTitle="No members"
            emptyHint={client.kind === "company" ? "Add directors + shareholders — Form C schedules need them." : client.kind === "individual" ? "Add spouse / children — reliefs depend on them." : "Add partners with profit-sharing %."}
            columns={[
              { header: "Role", cell: (m, set) => (
                <select value={m.role} onChange={(e) => set({ role: e.target.value as ClientMember["role"] })} aria-label="Role">
                  {roles.map((r) => (<option key={r} value={r}>{r}</option>))}
                </select>
              ) },
              { header: "Name", cell: (m, set) => (<input value={m.name} onChange={(e) => set({ name: e.target.value })} aria-label="Name" />) },
              { header: "%", cell: (m, set) => (<input value={m.sharePct} onChange={(e) => set({ sharePct: e.target.value })} aria-label="Share %" placeholder="0–100" />) },
              { header: "IC", cell: (m, set) => (<input value={m.icNo} onChange={(e) => set({ icNo: e.target.value })} aria-label="IC number" />) },
            ]}
          />
        ) : (
          <p className="hint">Members live on the client master so they roll across YAs — create the client to start adding them.</p>
        )}
      </div>

      <div className="card">
        <h3>Document checklist — {FORM_LABEL[eng.formType]}</h3>
        <div className="toolbar no-print">
          <button type="button" className="btn btn-xs" onClick={() => patch({ documents: ensureDocuments(eng.documents, eng.formType) })}>
            Load {eng.formType} checklist
          </button>
          <button type="button" className="btn btn-xs primary" onClick={syncObtains}>
            Sync missing → [TO OBTAIN]
          </button>
        </div>
        {eng.documents.length === 0 && <p className="hint">No checklist loaded yet — load it, then mark each doc received, missing, or waived.</p>}
        {docsFor(eng.formType).map((def) => {
          const slot = eng.documents.find((d) => d.code === def.code);
          return (
            <div key={def.code} className="vrow">
              <span>{slot?.label ?? def.label}{def.required && <span className="hint"> · required</span>}</span>
              <span className="detail">
                <select
                  value={slot?.status ?? "missing"}
                  onChange={(e) => patch({ documents: setDocStatus(eng.documents, def, e.target.value as DocSlot["status"]) })}
                  aria-label={`${def.label} status`}
                >
                  <option value="missing">Missing</option>
                  <option value="received">Received</option>
                  <option value="waived">Waived</option>
                </select>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
