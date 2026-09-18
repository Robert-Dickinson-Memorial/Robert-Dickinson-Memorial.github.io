import { env } from "cloudflare:workers";
import { ArrowLeft } from "lucide-react";
import { getPublishedGallery } from "../site-data";
import PrintButton from "./print-button";

export const dynamic = "force-dynamic";

type BookMemory = { id: number; name: string; relationship: string; title: string; story: string; photoKey: string | null };

export default async function MemoryBookPage() {
  const gallery = (await getPublishedGallery()).filter((item) => item.kind === "image" && item.objectKey);
  const result = env.DB ? await env.DB.prepare(
    `SELECT id, name, relationship, title, story, photo_key AS photoKey
     FROM memories WHERE status = ? ORDER BY created_at ASC, id ASC`
  ).bind("approved").all<BookMemory>() : { results: [] };
  const memories = result.results ?? [];

  return (
    <main className="book-shell">
      <div className="book-toolbar"><a href="/"><ArrowLeft size={17} /> Return to memorial</a><PrintButton /></div>
      <article className="memory-book">
        <header className="book-cover">
          <p>In loving memory</p><h1>Robert E.<br />Dickinson</h1><span>1940–2026</span>
          <img src="/robert-dickinson.jpg" alt="Robert E. Dickinson" />
        </header>
        <section className="book-introduction"><p>A collection of photographs and stories shared by Robert’s students, postdoctoral scholars, colleagues, friends, and family.</p></section>
        {gallery.map((item) => <figure className="book-photo-page" key={`gallery-${item.id}`}><img src={`/api/gallery/photos/${item.objectKey}`} alt={item.title} /><figcaption><strong>{item.title}</strong>{item.caption && <span>{item.caption}</span>}</figcaption></figure>)}
        {memories.map((memory) => (
          <section className="book-memory-page" key={memory.id}>
            {memory.photoKey && <img src={`/api/photos/${memory.photoKey}`} alt={`Shared by ${memory.name}`} />}
            <div><p className="book-label">A memory from {memory.relationship}</p><h2>{memory.title}</h2><p className="book-story">{memory.story}</p><footer>{memory.name}</footer></div>
          </section>
        ))}
        {!gallery.length && !memories.length && <section className="book-empty"><h2>The book is ready to grow.</h2><p>Approved stories and gallery photographs will automatically appear here.</p></section>}
        <footer className="book-end"><span>∞</span><p>Robert E. Dickinson Memorial</p></footer>
      </article>
    </main>
  );
}
