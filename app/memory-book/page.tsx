import { env } from "cloudflare:workers";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getSiteContent, type LegacyChapterPhoto, type SiteAsset } from "../site-data";
import PrintButton from "./print-button";

export const dynamic = "force-dynamic";

type BookMemory = { id: number; name: string; relationship: string; title: string; story: string; photoKey: string | null };

function assetUrl(asset: SiteAsset) {
  if (asset.objectKey) return `/api/site-assets/${asset.objectKey.split("/").map(encodeURIComponent).join("/")}`;
  return `/${asset.asset.replace(/^\//, "")}`;
}

function chapterPhotoUrl(photo: LegacyChapterPhoto | null) {
  if (!photo) return null;
  if (photo.objectKey) return `/api/chapter-photos/${photo.objectKey.split("/").map(encodeURIComponent).join("/")}`;
  if (photo.asset) return `/${photo.asset.replace(/^\//, "")}`;
  return null;
}

export default async function MemoryBookPage() {
  const content = await getSiteContent();
  const copy = content.pageCopy;
  const result = env.DB ? await env.DB.prepare(
    `SELECT id, name, relationship, title, story, photo_key AS photoKey
     FROM memories WHERE status = ? ORDER BY created_at ASC, id ASC`
  ).bind("approved").all<BookMemory>() : { results: [] };
  const memories = result.results ?? [];
  const memorySpreads = Array.from({ length: Math.ceil(memories.length / 2) }, (_, index) => memories.slice(index * 2, index * 2 + 2));
  const honorSpreads = Array.from({ length: Math.ceil(content.honors.length / 12) }, (_, index) => content.honors.slice(index * 12, index * 12 + 12));
  const storyParagraphs = content.obituaryStory.split(/\n\s*\n/).filter(Boolean);
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

        <section className="book-spread book-home-spread">
          <div className="book-home-image"><img src={horizon} alt={content.siteAssets.horizon.alt} /><img src={portrait} alt={content.siteAssets.portrait.alt} /></div>
          <div className="book-home-copy">
            <p className="book-running-title">{copy["nav.home"]} · {copy["global.footerName"]}</p>
            <p className="book-label">{copy["home.heroEyebrow"]}</p>
            <h2>{copy["home.heroNameLine1"]} {copy["home.heroNameLine2"]}</h2>
            <p className="book-lead">{content.heroIntro}</p>
            <blockquote>{copy["home.portraitQuote"]}</blockquote>
            <div className="book-home-legacy">
              <h3>{copy["home.legacyTitle"]}</h3>
              <p>{content.homeLegacyIntro}</p>
              <div className="book-theme-grid">{content.legacyThreads.map((thread) => <article key={thread.id}><strong>{thread.title}</strong><span>{thread.text}</span></article>)}</div>
              <div className="book-home-card-grid">{content.homeLegacyCards.map((card) => <article key={card.title}><h4>{card.title}</h4><p>{card.text}</p></article>)}</div>
            </div>
          </div>
          <span className="book-page-number">Home</span>
        </section>

        <section className="book-spread book-life-spread">
          <p className="book-running-title">{copy["nav.life"]} · {copy["global.footerName"]}</p>
          <div className="book-section-heading"><p className="book-label">{copy["life.heroKicker"]}</p><h2>{copy["life.heroTitle"]}</h2><p>{copy["life.heroIntro"]}</p></div>
          <div className="book-life-story">{storyParagraphs.map((paragraph) => <p key={paragraph.slice(0, 40)}>{paragraph}</p>)}</div>
          <aside className="book-mentor-note"><blockquote>{copy["life.mentorQuote"]}</blockquote><p>{copy["life.mentorText"]}</p></aside>
          <span className="book-page-number">His life</span>
        </section>

        <section className="book-spread book-timeline-spread">
          <p className="book-running-title">{copy["nav.life"]} · Education & career</p>
          <h2>Education & career timeline</h2>
          <div className="book-timeline-grid">{content.lifeMilestones.map((item) => <article key={`${item.year}-${item.title}`}><span>{item.year}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
          <span className="book-page-number">Timeline</span>
        </section>

        <section className="book-spread book-legacy-overview-spread">
          <p className="book-running-title">{copy["nav.legacy"]} · {copy["global.footerName"]}</p>
          <div className="book-section-heading"><p className="book-label">{copy["legacy.heroKicker"]}</p><h2>{copy["legacy.heroTitle"]}</h2><p>{copy["legacy.heroIntro"]}</p></div>
          <div className="book-thread-grid">{content.legacyThreads.map((thread, index) => <article key={thread.id}><span>{String(index + 1).padStart(2, "0")}</span><h3>{thread.title}</h3><p>{thread.text}</p></article>)}</div>
          <div className="book-frontier-list">{content.secondaryLegacyTopics.map((topic) => <span key={topic.title}>{topic.title}</span>)}</div>
          <span className="book-page-number">Scientific legacy</span>
        </section>

        {content.legacyChapters.map((chapter) => {
          const photo = chapterPhotoUrl(chapter.photo);
          const publications = chapter.publications?.length ? chapter.publications : chapter.publication ? [chapter.publication] : [];
          return <section className="book-spread book-legacy-chapter-spread" key={chapter.id}>
            <p className="book-running-title">{copy["nav.legacy"]} · {chapter.institution}</p>
            <header><div><p className="book-label">{chapter.number} · {chapter.years}</p><h2>{chapter.title}</h2><strong>{chapter.institution} · {chapter.scale}</strong></div>{photo && chapter.photo && <figure><img src={photo} alt={chapter.photo.alt} /><figcaption>{chapter.photo.caption}</figcaption></figure>}</header>
            <p className="book-legacy-summary">{chapter.summary}</p>
            <div className="book-legacy-details"><div><h3>{copy["legacy.contributionsLabel"]}</h3><ul>{chapter.contributions.map((item) => <li key={item}>{item}</li>)}</ul></div><blockquote><h3>{copy["legacy.impactLabel"]}</h3><p>{chapter.impact}</p></blockquote></div>
            {publications.map((publication) => <div className="book-publication" key={`${publication.year}-${publication.title}`}><p className="book-label">{copy["legacy.publicationLabel"]} · {publication.year}</p><h3>{publication.title}</h3><cite>{publication.citation}</cite><p>{publication.note}</p></div>)}
            <div className="book-tags">{chapter.threads.map((thread) => <span key={thread}>{thread}</span>)}</div>
            <span className="book-page-number">{chapter.institution}</span>
          </section>;
        })}

        {honorSpreads.map((spread, index) => <section className="book-spread book-honors-spread" key={`honors-${index}`}>
          <p className="book-running-title">{copy["nav.legacy"]} · {copy["legacy.honorsKicker"]}</p>
          <h2>{copy["legacy.honorsKicker"]}{honorSpreads.length > 1 ? ` · ${index + 1}` : ""}</h2>
          <div className="book-honors-grid">{spread.map((honor) => <article key={`${honor.year}-${honor.title}`}><span>{honor.year}</span><h3>{honor.title}</h3><p>{honor.detail}</p></article>)}</div>
          {index === honorSpreads.length - 1 && <p className="book-honors-note">{content.honorsNote}</p>}
          <span className="book-page-number">Honors {index + 1}</span>
        </section>)}

        {memorySpreads.map((spread, index) => <section className="book-spread book-message-spread" key={`memory-spread-${index}`}><p className="book-running-title">{copy["nav.memories"]} · {copy["global.footerName"]}</p><h2>{copy["memories.sectionTitle"]}</h2><div className="book-message-grid">{spread.map((memory) => <article key={memory.id}>{memory.photoKey && <img src={`/api/photos/${memory.photoKey.split("/").map(encodeURIComponent).join("/")}`} alt={`Shared by ${memory.name}`} />}<p className="book-label">{copy["book.memoryPrefix"]} {memory.relationship}</p><h3>{memory.title}</h3><p className="book-story">{memory.story}</p><footer><strong>{memory.name}</strong><span>{memory.relationship}</span></footer></article>)}</div><span className="book-page-number">Memories {index + 1}</span></section>)}

        {!memories.length && <section className="book-spread book-empty"><h2>{copy["book.emptyTitle"]}</h2><p>{copy["memories.emptyText"]}</p></section>}
        <footer className="book-spread book-end-spread"><span>∞</span><h2>{copy["book.endTitle"]}</h2><p>{copy["book.endFooter"]}</p></footer>
      </article>
    </main>
  );
}
