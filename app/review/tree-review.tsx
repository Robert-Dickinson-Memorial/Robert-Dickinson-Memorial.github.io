"use client";

import { useState } from "react";

export type TreeDedication = {
  id: number;
  name: string;
  email: string | null;
  project: string;
  provider: string;
  contributionType: "tree" | "restoration";
  reportedTreeCount: number | null;
  countBasis: string | null;
  confirmationRef: string | null;
  paymentConfirmed: boolean | number;
  createdAt: string;
};

export default function TreeReview({ pending, approved }: { pending: TreeDedication[]; approved: TreeDedication[] }) {
  const [queue, setQueue] = useState(pending);
  const [published, setPublished] = useState(approved);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function update(item: TreeDedication, action: "approve" | "reject" | "void") {
    if (action === "void" && !window.confirm(`Void ${item.name}'s recorded contribution? The historical record will be retained but removed from public totals.`)) return;
    setBusy(item.id); setError("");
    try {
      const response = await fetch(action === "void" ? `/api/admin/tree-dedications?id=${item.id}` : "/api/admin/tree-dedications", {
        method: action === "void" ? "DELETE" : "PATCH",
        ...(action === "void" ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify({ id: item.id, action }) }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to save this change.");
      if (action === "void") setPublished((items) => items.filter((entry) => entry.id !== item.id));
      else {
        setQueue((items) => items.filter((entry) => entry.id !== item.id));
        if (action === "approve") setPublished((items) => [item, ...items]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const approvedTrees = published.reduce((sum, item) => sum + (item.contributionType === "tree" ? Number(item.reportedTreeCount ?? 0) : 0), 0);
  const approvedRestorationGifts = published.filter((item) => item.contributionType === "restoration").length;

  const recordDetails = (item: TreeDedication) => <>
    <span>{item.project} · {item.provider}</span>
    <span>{item.contributionType === "tree" ? `${item.reportedTreeCount ?? 0} ${item.reportedTreeCount === 1 ? "tree" : "trees"}` : "restoration gift"}</span>
    {item.countBasis && <small>{item.countBasis}</small>}
    {item.confirmationRef && <small>Confirmation: {item.confirmationRef}</small>}
    {item.email && <small>{item.email}</small>}
  </>;

  return <section className="tree-review" aria-labelledby="tree-review-title">
    <h2 id="tree-review-title">Living tribute reports</h2>
    <p>These are honor-system reports of completed payments made directly to outside organizations. Approve only a plausible entry. Exact provider-reported tree quantities enter the public tree total; restoration gifts are preserved separately. The memorial stores no card or banking information.</p>
    {error && <p role="alert" className="review-error">{error}</p>}

    <h3>Waiting for review ({queue.length})</h3>
    {queue.length ? <div className="tree-review-list">{queue.map((item) => <article key={item.id}>
      <strong>{item.name}</strong>
      {recordDetails(item)}
      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
      <div><button disabled={busy === item.id} onClick={() => update(item, "approve")}>Approve</button><button disabled={busy === item.id} onClick={() => update(item, "reject")}>Reject</button></div>
    </article>)}</div> : <p>No living-tribute reports waiting for review.</p>}

    <h3>Approved ({approvedTrees} {approvedTrees === 1 ? "tree" : "trees"} · {approvedRestorationGifts} restoration {approvedRestorationGifts === 1 ? "gift" : "gifts"})</h3>
    {published.length ? <div className="tree-review-list">{published.map((item) => <article key={item.id}>
      <strong>{item.name}</strong>
      {recordDetails(item)}
      <div><button disabled={busy === item.id} onClick={() => update(item, "void")}>Void record</button></div>
    </article>)}</div> : <p>No living-tribute contributions have been approved yet.</p>}
  </section>;
}
