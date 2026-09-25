"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FileText, Quote } from "lucide-react";

type Memory = { id: number; name: string; relationship: string; title: string; story: string; photoKey: string | null; pdfKey: string | null; pdfName: string | null; socialUrl: string | null };

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
      {memories.map((memory) => (
        <article className="memory-card" id={`memory-${memory.id}`} key={memory.id}>
          {memory.photoKey && <img src={`/api/photos/${memory.photoKey}`} alt="" />}
          <Quote size={24} strokeWidth={1.4} aria-hidden="true" />
          <h3>{memory.title}</h3>{memory.story && <p>{memory.story}</p>}
          {(memory.pdfKey || memory.socialUrl) && <div className="memory-attachments">
            {memory.pdfKey && <a href={`/api/memory-files/${memory.pdfKey.split("/").map(encodeURIComponent).join("/")}`} target="_blank" rel="noopener noreferrer"><FileText size={16} /> Read the shared PDF</a>}
            {memory.socialUrl && <a href={memory.socialUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> View the shared public post</a>}
          </div>}
          <footer><strong>{memory.name}</strong><span>{memory.relationship}</span></footer>
        </article>
      ))}
    </div>
  );
}
