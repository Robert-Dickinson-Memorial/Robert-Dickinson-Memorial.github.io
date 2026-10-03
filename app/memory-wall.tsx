"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FileText, Quote } from "lucide-react";

type Memory = { id: number; name: string; relationship: string; title: string; story: string; createdAt: string; photo2Key: string | null; photo2Name: string | null; photo3Key: string | null; photo3Name: string | null; photoKey: string | null; videoKey: string | null; videoName: string | null; pdfKey: string | null; socialUrl: string | null };

function memoryPriority(memory: Memory) {
  if (memory.id === 11) return 0;
  return /^(haishan|hanshan) chen$/i.test(memory.name.trim().replace(/\s+/g, " ")) ? 1 :
          /^david schimel$/i.test(memory.name.trim().replace(/\s+/g, " ")) ? 2 :
          /^kaicun wang$/i.test(memory.name.trim().replace(/\s+/g, " ")) ? 3 : 4;
}

export default function MemoryWall({ copy }: { copy: Record<string, string> }) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/memories")
      .then((response) => response.ok ? response.json() : { memories: [] })
      .then((data) => setMemories(data.memories || []))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return <div className="memory-empty">{copy["memories.loading"]}</div>;
  if (!memories.length) {
    return (
      <div className="memory-empty">
        <Quote size={28} strokeWidth={1.4} aria-hidden="true" />
        <h3>{copy["memories.emptyTitle"]}</h3>
        <p>{copy["memories.emptyText"]}</p>
        <a href="#share">{copy["memories.emptyCta"]}</a>
      </div>
    );
  }

  return (
    <div className="memory-grid">
      {[...memories].sort((a, b) => memoryPriority(a) - memoryPriority(b) ||
        (a.createdAt || "").localeCompare(b.createdAt || "") || a.id - b.id).map((memory) => (
        <article className="memory-card" id={`memory-${memory.id}`} key={memory.id}>
          <header className="memory-author">
            <span className="memory-author-mark" aria-hidden="true">{memory.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("")}</span>
            <div><strong>{memory.name}</strong><span>{memory.relationship}</span></div>
          </header>
          {memory.videoKey && <video className="memory-video" controls playsInline preload="metadata" aria-label={memory.title} src={`/api/memory-videos/${memory.videoKey.split("/").map(encodeURIComponent).join("/")}`} />}
          {[memory.photoKey, memory.photo2Key, memory.photo3Key].filter(Boolean).map((key, index) => <img key={key} src={`/api/photos/${key}`} alt={`Photo ${index + 1} shared by ${memory.name}`} loading="lazy" />)}
          <h3>{memory.title}</h3>
          {memory.story && <p className={`memory-story${memory.story.length > 420 ? " is-collapsed" : ""}`}>{memory.story}</p>}
          {memory.story.length > 420 && <>
            <button type="button" className="memory-read-more" id={`memory-open-${memory.id}`} aria-haspopup="dialog" onClick={() => (document.getElementById(`memory-reader-${memory.id}`) as HTMLDialogElement | null)?.showModal()}>Read full memory</button>
            <dialog className="memory-reader" id={`memory-reader-${memory.id}`} aria-labelledby={`memory-reader-title-${memory.id}`} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }} onClose={() => (document.getElementById(`memory-open-${memory.id}`) as HTMLButtonElement | null)?.focus()}>
              <button type="button" className="memory-reader-close" onClick={(event) => event.currentTarget.closest("dialog")?.close()} aria-label="Close full memory">Close ×</button>
              <p className="memory-reader-author">{memory.name} · {memory.relationship}</p>
              <h2 id={`memory-reader-title-${memory.id}`}>{memory.title}</h2>
              <p className="memory-reader-story">{memory.story}</p>
            </dialog>
          </>}
          {(memory.pdfKey || memory.socialUrl) && <div className="memory-attachments">
            {memory.pdfKey && <a href={`/api/memory-files/${memory.pdfKey.split("/").map(encodeURIComponent).join("/")}`} target="_blank" rel="noopener noreferrer nofollow ugc"><FileText size={16} /> {copy["memories.pdfLink"] || "Read the shared PDF"}</a>}
            {memory.socialUrl && <a href={memory.socialUrl} target="_blank" rel="noopener noreferrer nofollow ugc"><ExternalLink size={16} /> {copy["memories.socialLink"] || "View the shared public post"}</a>}
          </div>}
        </article>
      ))}
    </div>
  );
}
