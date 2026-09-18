"use client";

import { useEffect, useState } from "react";
import { Quote } from "lucide-react";

type Memory = { id: number; name: string; relationship: string; title: string; story: string; photoKey: string | null };

export default function MemoryWall() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/memories")
      .then((response) => response.ok ? response.json() : { memories: [] })
      .then((data) => setMemories(data.memories || []))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return <div className="memory-empty">Gathering stories…</div>;
  if (!memories.length) {
    return (
      <div className="memory-empty">
        <Quote size={28} strokeWidth={1.4} aria-hidden="true" />
        <h3>The first stories are being gathered.</h3>
        <p>Be among the first to share a memory with the community.</p>
        <a href="#share">Share a memory</a>
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
