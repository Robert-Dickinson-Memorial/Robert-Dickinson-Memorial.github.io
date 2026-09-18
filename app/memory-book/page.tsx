import { env } from "cloudflare:workers";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getPublishedGallery, getSiteContent } from "../site-data";
import PrintButton from "./print-button";

export const dynamic = "force-dynamic";

type BookMemory = { id: number; name: string; relationship: string; title: string; story: string; photoKey: string | null };

export default async function MemoryBookPage() {
  const [galleryItems, content] = await Promise.all([getPublishedGallery(), getSiteContent()]);
  const gallery = galleryItems.filter((item) => item.kind === "image" && item.objectKey);
  const result = env.DB ? await env.DB.prepare(
    `SELECT id, name, relationship, title, story, photo_key AS photoKey
     FROM memories WHERE status = ? ORDER BY created_at ASC, id ASC`
  ).bind("approved").all<BookMemory>() : { results: [] };
  const memories = result.results ?? [];
  const memorySpreads = Array.from({ length: Math.ceil(memories.length / 2) }, (_, index) => memories.slice(index * 2, index * 2 + 2));
  const gallerySpreads = Array.from({ length: Math.ceil(gallery.length / 2) }, (_, index) => gallery.slice(index * 2, index * 2 + 2));
  const storyParagraphs = content.obituaryStory.split(/\n\s*\n/).filter(Boolean).slice(0, 3);

  return (
    <main className="book-shell">
      <div className="book-toolbar"><Link href="/"><ArrowLeft size={17} /> Return to memorial</Link><PrintButton /></div>
      <article className="memory-book editorial-book">
        <header className="book-spread book-cover-spread">
          <div className="book-cover-copy"><p>Community memories</p><h1>Robert E.<br />Dickinson</h1><span>1940–2026</span><small>A life in science, mentorship, and friendship</small></div>
          <img src="/robert-dickinson.jpg" alt="Robert E. Dickinson" />
        </header>
        <section className="book-spread book-profile-spread">
          <div className="book-profile-photos"><img src="/memorial-horizon.png" alt="Earth horizon artwork" /><img src="/robert-dickinson.jpg" alt="Robert E. Dickinson" /></div>
          <div className="book-profile-copy"><p className="book-running-title">Robert E. Dickinson · Community memories</p><p className="book-label">Robert E. Dickinson (1940–2026)</p><h2>Earth-system scientist, mentor, and friend</h2><div className="book-columns">{storyParagraphs.map((paragraph) => <p key={paragraph.slice(0, 28)}>{paragraph}</p>)}</div></div>
          <span className="book-page-number">1–2</span>
        </section>
        {gallerySpreads.map((spread, index) => <section className="book-spread book-photo-spread" key={`gallery-spread-${index}`}><p className="book-running-title">Robert E. Dickinson · A life in photographs</p><div className="book-photo-grid">{spread.map((item) => <figure key={item.id}><img src={`/api/gallery/photos/${item.objectKey}`} alt={item.title} /><figcaption><strong>{item.title}</strong>{item.caption && <span>{item.caption}</span>}</figcaption></figure>)}</div><span className="book-page-number">{index * 2 + 3}–{index * 2 + 4}</span></section>)}
        {memorySpreads.map((spread, index) => <section className="book-spread book-message-spread" key={`memory-spread-${index}`}><p className="book-running-title">Robert E. Dickinson · Community memories</p><h2>Messages from Robert’s community</h2><div className="book-message-grid">{spread.map((memory) => <article key={memory.id}>{memory.photoKey && <img src={`/api/photos/${memory.photoKey}`} alt={`Shared by ${memory.name}`} />}<p className="book-label">A memory from {memory.relationship}</p><h3>{memory.title}</h3><p className="book-story">{memory.story}</p><footer><strong>{memory.name}</strong><span>{memory.relationship}</span></footer></article>)}</div><span className="book-page-number">{gallerySpreads.length * 2 + index * 2 + 3}–{gallerySpreads.length * 2 + index * 2 + 4}</span></section>)}
        {!gallery.length && !memories.length && <section className="book-spread book-empty"><h2>The book is ready to grow.</h2><p>Approved stories and gallery photographs will automatically appear here.</p></section>}
        <footer className="book-spread book-end-spread"><span>∞</span><h2>His questions continue.</h2><p>Robert E. Dickinson Memorial · 1940–2026</p></footer>
      </article>
    </main>
  );
}
