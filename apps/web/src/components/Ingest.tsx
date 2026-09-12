import { useMemo, useState } from "react";
import { formatRM } from "@formc/engine";
import { hintFor, parseTrialBalance } from "../lib/ingest.js";
import { SECTIONS } from "../lib/types.js";
import { senToRMString } from "../lib/rm.js";
import { uid } from "../lib/lists.js";
import type { Engagement } from "../lib/types.js";

type Patch = (p: Partial<Engagement>) => void;

export function Ingest(props: { eng: Engagement; patch: Patch }): JSX.Element {
  const { eng, patch } = props;
  const [assign, setAssign] = useState<Record<string, string>>({});
  const proposals = useMemo(() => parseTrialBalance(eng.ingestText), [eng.ingestText]);

  function apply(id: string): void {
    const line = proposals.find((p) => p.id === id);
    if (!line) return;
    const mode = assign[id] ?? "ignore";
    if (mode === "ignore") return;
    if (mode.startsWith("add:")) {
      const section = mode.slice(4);
      if (!(SECTIONS as string[]).includes(section)) return;
      patch({
        addBacks: [
          ...eng.addBacks,
          { id: uid(), description: line.label, amountRM: senToRMString(line.amountSen), section: section as (typeof SECTIONS)[number] },
        ],
      });
    } else if (mode === "credit") {
      patch({
        credits: [
          ...eng.credits,
          { id: uid(), description: line.label, amountRM: senToRMString(line.amountSen), basis: "" },
        ],
      });
    }
    setAssign((prev) => ({ ...prev, [id]: "posted" }));
  }

  return (
    <div className="card">
      <h3>Ingest — trial balance paste</h3>
      <p className="hint">
        Paste TB lines as <span className="mono">Account name … amount</span>, one per line.
        Nothing posts until you assign each line. Parentheses = credit.
      </p>
      <label className="f" htmlFor="tb-paste">Trial balance lines</label>
      <textarea
        id="tb-paste"
        rows={8}
        value={eng.ingestText}
        onChange={(e) => patch({ ingestText: e.target.value })}
        placeholder={"Depreciation 50,000.00\nEntertainment 20,000.00\nSales (1,200,000.00)"}
      />
      {proposals.length > 0 && (
        <div className="tscroll proposals">
        <table className="w">
          <thead>
            <tr>
              <th>TB line</th>
              <th className="num-h">Amount</th>
              <th>Hint</th>
              <th>Assign</th>
              <th><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((p) => {
              const state = assign[p.id] ?? "ignore";
              return (
                <tr key={p.id}>
                  <td>{p.label}</td>
                  <td className="rm">{formatRM(p.amountSen)}</td>
                  <td className="hint">{hintFor(p.label)}</td>
                  <td>
                    {state === "posted" ? (
                      <span className="ok">Posted ✓</span>
                    ) : (
                      <select aria-label={`Assign ${p.label} to section`} value={state} onChange={(e) => setAssign((prev) => ({ ...prev, [p.id]: e.target.value }))}>
                        <option value="ignore">Ignore / dealt with</option>
                        <option value="credit">Non-taxable credit</option>
                        {SECTIONS.map((s) => (
                          <option key={s} value={`add:${s}`}>
                            Add-back {s}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    {state !== "posted" && state !== "ignore" && (
                      <button className="btn" onClick={() => apply(p.id)}>
                        Post
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
