import { InteriorHero, SiteFooter, SiteNav } from "../site-chrome";
import { getSiteContent, type LegacyChapterPhoto } from "../site-data";

export const dynamic = "force-dynamic";

function photoSrc(photo: LegacyChapterPhoto | null): string | null {
  if (!photo) return null;
  if (photo.objectKey) return `/api/chapter-photos/${photo.objectKey.split("/").map(encodeURIComponent).join("/")}`;
  if (photo.asset) return `/${photo.asset.replace(/^\//, "")}`;
  return null;
}

export default async function LegacyPage() {
  const content = await getSiteContent();
  const copy = content.pageCopy;
  return <main className="interior-page legacy-page" data-body-font={content.bodyFont} data-heading-font={content.headingFont}>
    <SiteNav active="legacy" />
    <InteriorHero kicker={copy["legacy.heroKicker"]} title={copy["legacy.heroTitle"]} intro={copy["legacy.heroIntro"]} />
    <section className="legacy-section legacy-page-content">
      <div className="legacy-scale-intro"><p className="section-kicker light">{copy["legacy.scaleKicker"]}</p><h3>{copy["legacy.scaleTitle"]}</h3><p>{copy["legacy.scaleIntro"]}</p></div>
      <ol className="legacy-scale legacy-scale-six" aria-label="Robert Dickinson's scientific journey">{content.legacyChapters.map((chapter) => <li key={chapter.id}><span>{chapter.number}</span><strong>{chapter.institution}</strong><small>{chapter.scale}</small></li>)}</ol>

      <div className="legacy-journey"><aside className="journey-rail"><p className="section-kicker light">{copy["legacy.chaptersLabel"]}</p><nav>{content.legacyChapters.map((chapter) => <a href={`#${chapter.id}`} key={chapter.id}><span>{chapter.number}</span><b>{chapter.institution}</b><small>{chapter.years}</small></a>)}</nav></aside>
        <div className="journey-chapters">{content.legacyChapters.map((chapter) => {
          const image = photoSrc(chapter.photo);
          return <article className="journey-chapter" id={chapter.id} key={chapter.id}>
            <header><div className="journey-number">{chapter.number}</div><div><p>{chapter.institution} <span>·</span> {chapter.years}</p><h3>{chapter.title}</h3></div><div className="journey-scale"><small>{copy["legacy.focusLabel"]}</small><strong>{chapter.scale}</strong></div></header>
            <p className="journey-summary">{chapter.summary}</p>
            <div className="journey-detail"><div><p className="journey-label">{copy["legacy.contributionsLabel"]}</p><ul>{chapter.contributions.map((item) => <li key={item}>{item}</li>)}</ul></div><blockquote><p className="journey-label">{copy["legacy.impactLabel"]}</p><span>{chapter.impact}</span></blockquote></div>
            {(image || chapter.publication) && <div className="journey-evidence">
              {image && chapter.photo && <figure><img src={image} alt={chapter.photo.alt} /><figcaption>{chapter.photo.caption}<small>{copy["legacy.photoCredit"]}</small></figcaption></figure>}
              {chapter.publication && <article className="landmark-publication"><p className="journey-label">{copy["legacy.publicationLabel"]} <span>·</span> {chapter.publication.year}</p><h4>{chapter.publication.title}</h4><cite>{chapter.publication.citation}</cite><p>{chapter.publication.note}</p></article>}
            </div>}
            <div className="journey-tags">{chapter.threads.map((thread) => <span key={thread}>{thread}</span>)}</div>
          </article>;
        })}</div>
      </div>

      <div className="enduring-threads">
        <div className="threads-heading"><div><p className="section-kicker light">{copy["legacy.threadsKicker"]}</p><h3>{copy["legacy.threadsTitle"]}</h3></div><p>{copy["legacy.threadsIntro"]}</p></div>
        <div className="thread-ledger">{content.legacyThreads.map((thread, index) => <article key={thread.id}><span>{String(index + 1).padStart(2, "0")}</span><h4>{thread.title}</h4><p>{thread.text}</p></article>)}</div>
      </div>

      <div className="legacy-frontiers">
        <div className="threads-heading"><div><p className="section-kicker light">{copy["legacy.frontiersKicker"]}</p><h3>{copy["legacy.frontiersTitle"]}</h3></div><p>{copy["legacy.frontiersIntro"]}</p></div>
        <div className="frontier-cloud">{content.secondaryLegacyTopics.map((topic) => <article key={topic.title}><span aria-hidden="true">•</span><div><h4>{topic.title}</h4><p>{topic.text}</p></div></article>)}</div>
      </div>

      <div className="honors-block"><p className="section-kicker light">{copy["legacy.honorsKicker"]}</p><div className="honors-grid honors-grid-detailed">{content.honors.map((honor) => <div className="honor-item" key={`${honor.year}-${honor.title}`}><span>{honor.year}</span><strong>{honor.title}</strong><small>{honor.detail}</small></div>)}</div><p className="honors-note">{content.honorsNote}</p></div>
    </section>
    <SiteFooter />
  </main>;
}
