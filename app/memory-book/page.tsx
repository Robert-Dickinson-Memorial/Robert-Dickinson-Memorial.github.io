import { env } from "cloudflare:workers";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getPublishedGallery, getSiteContent, type SiteAsset } from "../site-data";
import PrintButton from "./print-button";

export const dynamic = "force-dynamic";

type BookMemory = { id: number; name: string; relationship: string; title: string; story: string; photoKey: string | null };

function assetUrl(asset: SiteAsset) {
  if (asset.objectKey) return `/api/site-assets/${asset.objectKey.split("/").map(encodeURIComponent).join("/")}`;
  return `/${asset.asset.replace(/^\//, "")}`;
}

export default async function MemoryBookPage() {
  const [galleryItems, content] = await Promise.all([getPublishedGallery(), getSiteContent()]);
  const copy = content.pageCopy;
  const gallery = galleryItems.filter((item) => item.kind === "image" && item.objectKey);
  const result = env.DB ? await env.DB.prepare(
    `SELECT id, name, relationship, title, story, photo_key AS photoKey
     FROM memories WHERE status = ? ORDER BY created_at ASC, id ASC`
  ).bind("approved").all<BookMemory>() : { results: [] };
  const memories = result.results ?? [];
  const memorySpreads = Array.from({ length: Math.ceil(memories.length / 2) }, (_, index) => memories.slice(index * 2, index * 2 + 2));
  const gallerySpreads = Array.from({ length: Math.ceil(gallery.length / 2) }, (_, index) => gallery.slice(index * 2, index * 2 + 2));
  const storyParagraphs = content.obituaryStory.split(/\n\s*\n/).filter(Boolean).slice(0, 3);
  const portrait = assetUrl(content.siteAssets.portrait);
  const horizon = assetUrl(content.siteAssets.horizon);

  return (
    <main className="book-shell" data-body-font={content.bodyFont} data-heading-font={content.headingFont}>
      <div className="book-toolbar"><Link href="/"><ArrowLeft size={17} /> {copy["book.toolbarReturn"]}</Link><PrintButton label={copy["book.print"]} /></div>
      <article className="memory-book editorial-book">
        <header className="book-spread book-cover-spread">
          <div className="book-cover-copy"><p>{copy["book.coverKicker"]}</p><h1>{copy["book.coverNameLine1"]}<br />{copy["book.coverNameLine2"]}</h1><span>{copy["book.coverDates"]}</span><small>{copy["book.coverSubtitle"]}</small></div>
          <img src={portrait} alt={content.siteAssets.portrait.alt} />
        </header>
        <section className="book-spread book-profile-spread">
          <div className="book-profile-photos"><img src={horizon} alt={content.siteAssets.horizon.alt} /><img src={portrait} alt={content.siteAssets.portrait.alt} /></div>
          <div className="book-profile-copy"><p className="book-running-title">{copy["book.profileRunning"]}</p><p className="book-label">{copy["book.profileLabel"]}</p><h2>{copy["book.profileTitle"]}</h2><div className="book-columns">{storyParagraphs.map((paragraph) => <p key={paragraph.slice(0, 28)}>{paragraph}</p>)}</div></div>
          <span className="book-page-number">1–2</span>
        </section>
        {gallerySpreads.map((spread, index) => <section className="book-spread book-photo-spread" key={`gallery-spread-${index}`}><p className="book-running-title">{copy["book.galleryRunning"]}</p><div className="book-photo-grid">{spread.map((item) => <figure key={item.id}><img src={`/api/gallery/photos/${item.objectKey}`} alt={item.title} /><figcaption><strong>{item.title}</strong>{item.caption && <span>{item.caption}</span>}</figcaption></figure>)}</div><span className="book-page-number">{index * 2 + 3}–{index * 2 + 4}</span></section>)}
        {memorySpreads.map((spread, index) => <section className="book-spread book-message-spread" key={`memory-spread-${index}`}><p className="book-running-title">{copy["book.memoryRunning"]}</p><h2>{copy["book.messagesTitle"]}</h2><div className="book-message-grid">{spread.map((memory) => <article key={memory.id}>{memory.photoKey && <img src={`/api/photos/${memory.photoKey}`} alt={`Shared by ${memory.name}`} />}<p className="book-label">{copy["book.memoryPrefix"]} {memory.relationship}</p><h3>{memory.title}</h3><p className="book-story">{memory.story}</p><footer><strong>{memory.name}</strong><span>{memory.relationship}</span></footer></article>)}</div><span className="book-page-number">{gallerySpreads.length * 2 + index * 2 + 3}–{gallerySpreads.length * 2 + index * 2 + 4}</span></section>)}
        {!gallery.length && !memories.length && <section className="book-spread book-empty"><h2>{copy["book.emptyTitle"]}</h2><p>{copy["book.emptyText"]}</p></section>}
        <footer className="book-spread book-end-spread"><span>∞</span><h2>{copy["book.endTitle"]}</h2><p>{copy["book.endFooter"]}</p></footer>
      </article>
    </main>
  );
}
