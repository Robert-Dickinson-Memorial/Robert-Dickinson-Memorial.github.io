"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, FileText, Quote } from "lucide-react";

type Memory = { id: number; name: string; relationship: string; title: string; story: string; createdAt: string; photo2Key: string | null; photo2Name: string | null; photo3Key: string | null; photo4Key: string | null; photo5Key: string | null; photo3Name: string | null; photo4Name: string | null; photo5Name: string | null; photoKey: string | null; videoKey: string | null; videoName: string | null; pdfKey: string | null; socialUrl: string | null };

// Pin Liming Zhou and Haishan Chen; everyone else follows original upload time.
const memoryPriority = (memory: Memory) => memory.id === 11 ? 0 : memory.id === 12 ? 1 : 2;

export default function MemoryWall({ copy }: { copy: Record<string, string> }) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [sortOrder, setSortOrder] = useState("oldest");
  const [loaded, setLoaded] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Shared by the app and Pages; reused after navigation and list refreshes.
    if (!document.querySelector("script[data-memory-reader-media]")) {
      const script = document.createElement("script");
      script.type = "module";
      script.src = "/memory-reader-media.js?v=20261006-photos1";
      script.dataset.memoryReaderMedia = "";
      document.head.append(script);
    }
  }, []);

  useEffect(() => {
    fetch("/api/memories")
      .then((response) => response.ok ? response.json() : { memories: [] })
      .then((data) => setMemories(data.memories || []))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    const spaces = [...(gridRef.current?.querySelectorAll<HTMLElement>(".memory-story-space") || [])];
    let active = true;
    const fitSnippet = (space: HTMLElement) => {
      const story = space.querySelector<HTMLElement>(".memory-story");
      if (!active || !story) return;
      const lineHeight = parseFloat(getComputedStyle(story).lineHeight);
      const action = space.querySelector<HTMLElement>(".memory-read-more");
      const actionHeight = action ? action.getBoundingClientRect().height + 8 : 0;
      const lines = Math.max(1, Math.floor((space.getBoundingClientRect().height - actionHeight - 0.5) / lineHeight));
      story.style.webkitLineClamp = String(lines);
    };
    const observer = new ResizeObserver(entries => entries.forEach(entry => fitSnippet(entry.target as HTMLElement)));
    spaces.forEach(space => { fitSnippet(space); observer.observe(space); });
    document.fonts.ready.then(() => spaces.forEach(fitSnippet));
    return () => { active = false; observer.disconnect(); };
  }, [memories, loaded]);

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
    <>
    <label className="memory-sort">Sort memories <select aria-label="Sort memories" value={sortOrder} onChange={event => setSortOrder(event.target.value)}><option value="oldest">Oldest to newest</option><option value="newest">Newest to oldest</option></select></label>
    <div className="memory-grid" ref={gridRef}>
      {[...memories].sort((a, b) => memoryPriority(a) - memoryPriority(b) || (sortOrder === "newest" ? -1 : 1) * ((a.createdAt || "").localeCompare(b.createdAt || "") || a.id - b.id)).map((memory) => (
        <article className="memory-card" id={`memory-${memory.id}`} key={memory.id}>
          <header className="memory-author">
            <span className="memory-author-mark" aria-hidden="true">{memory.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("")}</span>
            <div><strong>{memory.name}</strong><span>{memory.relationship}</span></div>
          </header>
          {(memory.videoKey || memory.photoKey || memory.photo2Key || memory.photo3Key || memory.photo4Key || memory.photo5Key) && <div className="memory-card-media">
          {memory.videoKey
            ? <video className="memory-video" controls playsInline preload="metadata" aria-label={memory.title} src={`/api/memory-videos/${memory.videoKey.split("/").map(encodeURIComponent).join("/")}`} />
            : [memory.photoKey, memory.photo2Key, memory.photo3Key, memory.photo4Key, memory.photo5Key].filter(Boolean).map((key, index) => <img key={key} src={`/api/photos/${key}`} alt={`Photo ${index + 1} shared by ${memory.name}`} loading="lazy" />)}
          </div>}
          <h3>{memory.title}</h3>
          {memory.story && <div className="memory-story-space"><p className="memory-story">{memory.story}</p>
            <button type="button" className="memory-read-more" id={`memory-open-${memory.id}`} aria-haspopup="dialog" onClick={() => (document.getElementById(`memory-reader-${memory.id}`) as HTMLDialogElement | null)?.showModal()}>Read full story</button>
            <dialog className="memory-reader" id={`memory-reader-${memory.id}`} aria-labelledby={`memory-reader-title-${memory.id}`} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }} onClose={() => (document.getElementById(`memory-open-${memory.id}`) as HTMLButtonElement | null)?.focus()}>
              <button type="button" className="memory-reader-close" onClick={(event) => event.currentTarget.closest("dialog")?.close()} aria-label="Close full memory">Close ×</button>
              <p className="memory-reader-author">{memory.name} · {memory.relationship}</p>
              <h2 id={`memory-reader-title-${memory.id}`}>{memory.title}</h2>
              {(memory.videoKey || memory.photoKey || memory.photo2Key || memory.photo3Key || memory.photo4Key || memory.photo5Key) && <div className="memory-reader-media">
                {memory.videoKey
                  ? <video className="memory-reader-video" controls playsInline preload="metadata" aria-label={memory.title} src={`/api/memory-videos/${memory.videoKey.split("/").map(encodeURIComponent).join("/")}`} />
                  : [memory.photoKey, memory.photo2Key, memory.photo3Key, memory.photo4Key, memory.photo5Key].filter((key): key is string => Boolean(key)).map((key, index) => {
                      const src = `/api/photos/${key.split("/").map(encodeURIComponent).join("/")}`;
                      return <a className="memory-reader-photo-link" href={src} target="_blank" rel="noopener noreferrer" key={key} aria-label={`Open photo ${index + 1} at full size`}>
                        <img src={src} alt={`Photo ${index + 1} shared by ${memory.name}`} loading="lazy" />
                      </a>;
                    })}
              </div>}
              <p className="memory-reader-story">{memory.story}</p>
            </dialog>
          </div>}
          {(memory.pdfKey || memory.socialUrl) && <div className="memory-attachments">
            {memory.pdfKey && <a href={`/api/memory-files/${memory.pdfKey.split("/").map(encodeURIComponent).join("/")}`} target="_blank" rel="noopener noreferrer nofollow ugc"><FileText size={16} /> {copy["memories.pdfLink"] || "Read the shared PDF"}</a>}
            {memory.socialUrl && <a href={memory.socialUrl} target="_blank" rel="noopener noreferrer nofollow ugc"><ExternalLink size={16} /> {copy["memories.socialLink"] || "View the shared public post"}</a>}
          </div>}
        </article>
      ))}
    </div>
    </>
  );
}
