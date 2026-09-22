"use client";

import { useEffect, useState } from "react";
import { Quote } from "lucide-react";

type Memory = { id: number; name: string; relationship: string; title: string; story: string; photoKey: string | null };

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
        <article className="memory-card" key={memory.id}>
          {memory.photoKey && <img src={`/api/photos/${memory.photoKey}`} alt="" />}
          <Quote size={24} strokeWidth={1.4} aria-hidden="true" />
          <h3>{memory.title}</h3><p>{memory.story}</p>
          <footer><strong>{memory.name}</strong><span>{memory.relationship}</span></footer>
        </article>
      ))}
    </div>
  );
}
