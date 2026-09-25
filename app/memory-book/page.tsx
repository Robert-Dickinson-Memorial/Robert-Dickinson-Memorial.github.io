import { env } from "cloudflare:workers";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getPublishedGallery, getSiteContent, type GalleryItem, type LegacyChapterPhoto, type LegacyPublication, type LifePhoto, type SiteAsset } from "../site-data";
import PrintButton from "./print-button";

export const dynamic = "force-dynamic";

type BookMemory = { id: number; name: string; relationship: string; title: string; story: string; photoKey: string | null; pdfKey: string | null; pdfName: string | null; socialUrl: string | null };

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

function lifePhotoUrl(photo: LifePhoto) {
  return `/api/life-photos/${photo.objectKey.split("/").map(encodeURIComponent).join("/")}`;
}

function galleryPhotoUrl(item: GalleryItem) {
  return item.objectKey ? `/api/gallery/photos/${item.objectKey.split("/").map(encodeURIComponent).join("/")}` : null;
}

function publicationPreviewUrl(publication: LegacyPublication) {
  return publication.image ? `/${publication.image.replace(/^\//, "")}` : null;
}

export default async function MemoryBookPage() {
  const [content, gallery] = await Promise.all([getSiteContent(), getPublishedGallery()]);
  const copy = content.pageCopy;
  const result = env.DB ? await env.DB.prepare(
    `SELECT id, name, relationship, title, story, photo_key AS photoKey,
            pdf_key AS pdfKey, pdf_name AS pdfName, social_url AS socialUrl
     FROM memories WHERE status = ? ORDER BY created_at ASC, id ASC`
  ).bind("approved").all<BookMemory>() : { results: [] };

  const memories = result.results ?? [];
  const memorySpreads = Array.from({ length: Math.ceil(memories.length / 2) }, (_, index) => memories.slice(index * 2, index * 2 + 2));
  const lifePhotoSpreads = Array.from({ length: Math.ceil(content.lifePhotos.length / 3) }, (_, index) => content.lifePhotos.slice(index * 3, index * 3 + 3));
  const galleryPhotos = gallery.filter((item) => item.kind === "image" && item.objectKey);
  const gallerySpreads = Array.from({ length: Math.ceil(galleryPhotos.length / 4) }, (_, index) => galleryPhotos.slice(index * 4, index * 4 + 4));
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

        {lifePhotoSpreads.map((spread, index) => <section className="book-spread book-life-photo-spread" key={`life-photos-${index}`}>
          <p className="book-running-title">{copy["nav.life"]} · Photographs</p>
          <div className="book-photo-heading"><div><p className="book-label">{copy["life.photosKicker"] || "His life in photographs"}</p><h2>{index === 0 ? "A life beyond the timeline" : "His life, continued"}</h2></div><p>Photographs shared on the His Life page, carried into the memory book.</p></div>
          <div className={`book-life-photo-grid count-${spread.length}`}>{spread.map((photo) => <figure key={photo.id}><img src={lifePhotoUrl(photo)} alt={photo.alt} /><figcaption>{photo.date && <strong>{photo.date}</strong>}{photo.caption && <span>{photo.caption}</span>}</figcaption></figure>)}</div>
          <span className="book-page-number">His life · Photos {index + 1}</span>
        </section>)}

        <section className="book-spread book-timeline-spread">
          <p className="book-running-title">{copy["nav.life"]} · Education & career</p>
          <h2>Education & career timeline</h2>
          <div className="book-timeline-grid">{content.lifeMilestones.map((item) => <article key={`${item.year}-${item.title}`}><span>{item.year}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
          <span className="book-page-number">Timeline</span>
        </section>

        <section className="book-spread book-legacy-overview-spread book-legacy-map-spread">
          <p className="book-running-title">{copy["nav.legacy"]} · {copy["global.footerName"]}</p>
          <div className="book-legacy-map-heading">
            <div><p className="book-label">{copy["legacy.chaptersLabel"] || "Scientific Contribution Chronicle"}</p><h2>Broader <em>and</em> deeper</h2></div>
            <p>{copy["legacy.heroIntro"]}</p>
          </div>
          <div className="book-legacy-arc" aria-label="Robert Dickinson scientific contribution chronicle">
            {content.legacyChapters.map((chapter) => <article key={chapter.id}>
              <span>{chapter.number}</span>
              <small>{chapter.years}</small>
              <h3>{chapter.institution}</h3>
              <p>{chapter.scale}</p>
            </article>)}
          </div>
          <div className="book-legacy-direction"><strong>Broadening the scientific question →</strong><span>atmosphere · climate · land · vegetation · coupled Earth system</span></div>
          <div className="book-legacy-thread-ribbon">{content.legacyThreads.map((thread) => <span key={thread.id}>{thread.title}</span>)}</div>
          <span className="book-page-number">Scientific legacy</span>
        </section>

        {content.legacyChapters.map((chapter) => {
          const photo = chapterPhotoUrl(chapter.photo);
          const publications = chapter.publications?.length ? chapter.publications : chapter.publication ? [chapter.publication] : [];
          return <section className="book-spread book-legacy-chapter-spread" key={chapter.id}>
            <p className="book-running-title">{copy["nav.legacy"]} · {chapter.institution}</p>
            <header className="book-legacy-chapter-hero">
              <div className="book-legacy-number">{chapter.number}</div>
              <div className="book-legacy-chapter-title"><p className="book-label">{chapter.years} · {chapter.institution}</p><h2>{chapter.title}</h2><strong>{chapter.scale}</strong></div>
              {photo && chapter.photo && <figure><img src={photo} alt={chapter.photo.alt} /><figcaption>{chapter.photo.caption}</figcaption></figure>}
            </header>
            <p className="book-legacy-summary">{chapter.summary}</p>
            <div className="book-legacy-details">
              <div><h3>{copy["legacy.contributionsLabel"]}</h3><ul>{chapter.contributions.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <blockquote><span>Enduring legacy</span><p>{chapter.impact}</p></blockquote>
            </div>
            {publications.length > 0 && <div className={`book-landmark-grid count-${publications.length}`}>{publications.map((publication) => {
              const preview = publicationPreviewUrl(publication);
              return <article className="book-landmark-card" key={`${publication.year}-${publication.title}`}>
                {preview && <img src={preview} alt={publication.alt || `Publication preview for ${publication.title}`} />}
                <div><p className="book-label">{copy["legacy.publicationLabel"]} · {publication.year}</p><h3>{publication.title}</h3><cite>{publication.citation}</cite><p>{publication.note}</p></div>
              </article>;
            })}</div>}
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

        {gallerySpreads.map((spread, index) => <section className="book-spread book-gallery-photo-spread" key={`gallery-${index}`}>
          <p className="book-running-title">{copy["nav.gallery"]} · {copy["global.footerName"]}</p>
          <div className="book-photo-heading"><div><p className="book-label">{copy["gallery.sectionKicker"]}</p><h2>{index === 0 ? copy["gallery.sectionTitle"] : `${copy["gallery.sectionTitle"]} · ${index + 1}`}</h2></div><p>{copy["gallery.heroIntro"]}</p></div>
          <div className={`book-gallery-photo-grid count-${spread.length}`}>{spread.map((item) => {
            const src = galleryPhotoUrl(item);
            return src ? <figure key={item.id}><img src={src} alt={item.title} /><figcaption><strong>{item.title}</strong>{item.caption && <span>{item.caption}</span>}</figcaption></figure> : null;
          })}</div>
          <span className="book-page-number">Gallery · {index + 1}</span>
        </section>)}

        {memorySpreads.map((spread, index) => <section className="book-spread book-message-spread" key={`memory-spread-${index}`}><p className="book-running-title">{copy["nav.memories"]} · {copy["global.footerName"]}</p><h2>{copy["memories.sectionTitle"]}</h2><div className="book-message-grid">{spread.map((memory) => <article key={memory.id}>{memory.photoKey && <img src={`/api/photos/${memory.photoKey.split("/").map(encodeURIComponent).join("/")}`} alt={`Shared by ${memory.name}`} />}<p className="book-label">{copy["book.memoryPrefix"]} {memory.relationship}</p><h3>{memory.title}</h3>{memory.story && <p className="book-story">{memory.story}</p>}{(memory.pdfKey || memory.socialUrl) && <p className="book-memory-links">{memory.pdfKey && <a href={`/api/memory-files/${memory.pdfKey.split("/").map(encodeURIComponent).join("/")}`} target="_blank" rel="noopener noreferrer nofollow ugc">{copy["memories.pdfLink"] || "Read the shared PDF"} ↗</a>}{memory.socialUrl && <a href={memory.socialUrl} target="_blank" rel="noopener noreferrer nofollow ugc">{copy["memories.socialLink"] || "View the shared public post"} ↗</a>}</p>}<footer><strong>{memory.name}</strong><span>{memory.relationship}</span></footer></article>)}</div><span className="book-page-number">Memories {index + 1}</span></section>)}

        {!memories.length && <section className="book-spread book-empty"><h2>{copy["book.emptyTitle"]}</h2><p>{copy["memories.emptyText"]}</p></section>}
        <footer className="book-spread book-end-spread"><span>∞</span><h2>{copy["book.endTitle"]}</h2><p>{copy["book.endFooter"]}</p></footer>
      </article>
    </main>
  );
}
