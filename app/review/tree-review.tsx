"use client";

import { useState } from "react";

export type TreeDedication = { id: number; name: string; email: string | null; project: string; createdAt: string };

export default function TreeReview({ pending, approved }: { pending: TreeDedication[]; approved: TreeDedication[] }) {
  const [queue, setQueue] = useState(pending);
  const [published, setPublished] = useState(approved);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function update(item: TreeDedication, action: "approve" | "reject" | "delete") {
    if (action === "delete" && !window.confirm(`Remove ${item.name}'s recorded dedication?`)) return;
    setBusy(item.id); setError("");
    try {
      const response = await fetch(action === "delete" ? `/api/admin/tree-dedications?id=${item.id}` : "/api/admin/tree-dedications", {
        method: action === "delete" ? "DELETE" : "PATCH",
        ...(action === "delete" ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify({ id: item.id, action }) }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to save this change.");
      if (action === "delete") setPublished((items) => items.filter((entry) => entry.id !== item.id));
      else { setQueue((items) => items.filter((entry) => entry.id !== item.id)); if (action === "approve") setPublished((items) => [item, ...items]); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Please try again."); }
    finally { setBusy(null); }
  }

  return <section className="tree-review" aria-labelledby="tree-review-title">
    <h2 id="tree-review-title">Tree dedication reports</h2>
    <p>These are self-reported gifts through outside organizations. Approve only a plausible entry; the site counts each approved name once. Names and emails are never shown publicly.</p>
    {error && <p role="alert" className="review-error">{error}</p>}
    <h3>Waiting for review ({queue.length})</h3>
    {queue.length ? <div className="tree-review-list">{queue.map((item) => <article key={item.id}><strong>{item.name}</strong><span>{item.project} · {new Date(item.createdAt).toLocaleDateString()}</span>{item.email && <small>{item.email}</small>}<div><button disabled={busy === item.id} onClick={() => update(item, "approve")}>Approve</button><button disabled={busy === item.id} onClick={() => update(item, "reject")}>Reject</button></div></article>)}</div> : <p>No tree dedications waiting for review.</p>}
    <h3>Approved ({published.length} reports)</h3>
    {published.length ? <div className="tree-review-list">{published.map((item) => <article key={item.id}><strong>{item.name}</strong><span>{item.project}</span>{item.email && <small>{item.email}</small>}<div><button disabled={busy === item.id} onClick={() => update(item, "delete")}>Remove</button></div></article>)}</div> : <p>No dedications have been recorded yet.</p>}
  </section>;
}
