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
    <InteriorHero kicker={copy["legacy.heroKicker"]} title={copy["home.legacyTitle"]} intro={copy["legacy.heroIntro"]} />
    <section className="legacy-section legacy-page-content">
      <div className="legacy-personal-quotes">{["2018", "1996"].map((year) => <blockquote key={year}><p>{copy[`legacy.quote${year}Text`]}</p><footer>{copy[`legacy.quote${year}Attribution`]}</footer></blockquote>)}</div>

      <div className="legacy-journey"><aside className="journey-rail"><p className="section-kicker light">{copy["legacy.chaptersLabel"]}</p><nav>{content.legacyChapters.map((chapter) => <a href={`#${chapter.id}`} key={chapter.id}><span>{chapter.number}</span><b>{chapter.scale}</b><small>{chapter.institution} · {chapter.years}</small></a>)}</nav></aside>
        <div className="journey-chapters">{content.legacyChapters.map((chapter) => {
          const image = photoSrc(chapter.photo);
          const publications = chapter.publications?.length ? chapter.publications : chapter.publication ? [chapter.publication] : [];
          return <article className="journey-chapter" id={chapter.id} key={chapter.id}>
            <header><div className="journey-number">{chapter.number}</div><div><p>{chapter.institution} <span>·</span> {chapter.years}</p><h3>{chapter.title}</h3></div><div className="journey-scale"><small>{copy["legacy.focusLabel"]}</small><strong>{chapter.scale}</strong></div></header>
            <p className="journey-summary">{chapter.summary}</p>
            <div className="journey-detail"><div><p className="journey-label">{copy["legacy.contributionsLabel"]}</p><ul>{chapter.contributions.map((item) => <li key={item}>{item}</li>)}</ul></div><blockquote><p className="journey-label">{copy["legacy.impactLabel"]}</p><span>{chapter.impact}</span></blockquote></div>
            {image && chapter.photo && <figure className="journey-chapter-photo"><img src={image} alt={chapter.photo.alt} /><figcaption>{chapter.photo.caption}<small>{copy["legacy.photoCredit"]}</small></figcaption></figure>}
            {publications.length > 0 && <section className="landmark-work" aria-label={`Landmark work from ${chapter.institution}`}>
              <p className="journey-label">Landmark work</p>
              <div className={`landmark-grid ${publications.length === 1 ? "single" : ""}`}>
                {publications.map((publication) => <a className="landmark-paper-card" href={publication.url || "#"} target={publication.url ? "_blank" : undefined} rel={publication.url ? "noopener noreferrer" : undefined} key={`${publication.year}-${publication.title}`}>
                  {publication.image && <img src={`/${publication.image.replace(/^\\/+/, "")}`} alt={publication.alt || `Publication preview for ${publication.title}`} loading="lazy" />}
                  <div className="landmark-paper-copy">
                    <p className="journey-label">{copy["legacy.publicationLabel"] || "Landmark publication"} <span>·</span> {publication.year}</p>
                    <h4>{publication.title}</h4>
                    <cite>{publication.citation}</cite>
                    <p>{publication.note}</p>
                    {publication.url && <span className="landmark-paper-link">Read the publication ↗</span>}
                  </div>
                </a>)}
              </div>
            </section>}
            <div className="journey-tags">{chapter.threads.map((thread) => <span key={thread}>{thread}</span>)}</div>
          </article>;
        })}</div>
      </div>

      <section className="legacy-service" aria-labelledby="legacy-service-title"><p id="legacy-service-title" className="section-kicker light">{copy["legacy.serviceKicker"]}</p><ul>{["Leadership", "Advice", "Collaboration", "Publishing"].map((area) => <li key={area}><h4>{copy[`legacy.service${area}Title`]}</h4><p>{copy[`legacy.service${area}Text`]}</p></li>)}</ul></section>

      <div className="honors-block"><p className="section-kicker light">{copy["legacy.honorsKicker"]}</p><div className="honors-grid honors-grid-detailed">{content.honors.map((honor) => <div className="honor-item" key={`${honor.year}-${honor.title}`}><span>{honor.year}</span><strong>{honor.title}</strong><small>{honor.detail}</small></div>)}</div></div>
    </section>
    <SiteFooter />
  </main>;
}
