"use client";

import { useState } from "react";
import { Check, ExternalLink, FileText, X } from "lucide-react";

export type PendingMemory = {
  id: number;
  name: string;
  relationship: string;
  email: string | null;
  title: string;
  story: string;
  photoKey: string | null;
  photoName: string | null;
  pdfKey: string | null;
  pdfName: string | null;
  socialUrl: string | null;
  createdAt: string;
};

export default function ReviewQueue({ initialMemories }: { initialMemories: PendingMemory[] }) {
  const [memories, setMemories] = useState(initialMemories);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function review(id: number, action: "approve" | "reject") {
    setWorkingId(id);
    setError("");
    try {
      const response = await fetch("/api/admin/memories", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update this submission.");
      setMemories((items) => items.filter((item) => item.id !== id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Please try again.");
    } finally {
      setWorkingId(null);
    }
  }

  if (!memories.length) {
    return <div className="review-empty"><Check size={34} /><h2>You’re all caught up.</h2><p>There are no memories waiting for review.</p></div>;
  }

  return (
    <>
      {error && <p className="review-error" role="alert">{error}</p>}
      <div className="review-list">
        {memories.map((memory) => (
          <article className="review-card" key={memory.id}>
            {memory.photoKey && (
              <img src={`/api/admin/photos/${memory.photoKey}`} alt={memory.photoName || `Photo submitted by ${memory.name}`} />
            )}
            <div className="review-card-body">
              <div className="review-meta">
                <span>{memory.relationship}</span>
                <time dateTime={memory.createdAt}>{new Date(memory.createdAt).toLocaleString()}</time>
              </div>
              <h2>{memory.title}</h2>
              {memory.story && <p className="review-story">{memory.story}</p>}
              {(memory.pdfKey || memory.socialUrl) && <div className="review-attachments">
                {memory.pdfKey && <a href={`/api/admin/memory-files/${memory.pdfKey.split("/").map(encodeURIComponent).join("/")}`} target="_blank" rel="noopener noreferrer"><FileText size={17} /> Open submitted PDF{memory.pdfName ? ` · ${memory.pdfName}` : ""}</a>}
                {memory.socialUrl && <a href={memory.socialUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={17} /> Open shared public post</a>}
              </div>}
              <div className="review-submitter">
                <strong>{memory.name}</strong>
                {memory.email && <a href={`mailto:${memory.email}`}>{memory.email}</a>}
              </div>
              <div className="review-actions">
                <button className="approve-button" onClick={() => review(memory.id, "approve")} disabled={workingId === memory.id}>
                  <Check size={18} /> Approve and publish
                </button>
                <button className="reject-button" onClick={() => review(memory.id, "reject")} disabled={workingId === memory.id}>
                  <X size={18} /> Reject
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
