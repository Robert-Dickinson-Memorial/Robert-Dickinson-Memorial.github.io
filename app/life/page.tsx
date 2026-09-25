import { Quote } from "lucide-react";
import { InteriorHero, SiteFooter, SiteNav } from "../site-chrome";
import { getSiteContent } from "../site-data";

export const dynamic = "force-dynamic";

export default async function LifePage() {
  const content = await getSiteContent();
  const copy = content.pageCopy;
  const paragraphs = content.obituaryStory.split(/\n\s*\n/).filter(Boolean);
  return <main className="interior-page" data-body-font={content.bodyFont} data-heading-font={content.headingFont}>
    <SiteNav active="life" />
    <InteriorHero kicker={copy["life.heroKicker"]} title={copy["life.heroTitle"]} intro={copy["life.heroIntro"]} />
    <section className="story-section interior-story">
      <div className="story-grid"><div><p className="story-aside">{copy["life.years"]}</p></div><div className="prose">{paragraphs.map((paragraph, index) => <p className={index === 0 ? "lead" : undefined} key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}</div></div>
      <section className="life-photos" aria-labelledby="life-photos-title">
        <p className="section-kicker">{copy["life.photosKicker"]}</p>
        <h2 id="life-photos-title">{copy["life.photosTitle"]}</h2>
        {content.lifePhotos.length ? <div className="life-photo-grid">{content.lifePhotos.map((photo) => <figure key={photo.id}>
          <img src={`/api/life-photos/${photo.objectKey.split("/").map(encodeURIComponent).join("/")}`} alt={photo.alt} loading="lazy" />
          {(photo.date || photo.caption) && <figcaption>{photo.date && <span>{photo.date}</span>}{photo.caption && <p>{photo.caption}</p>}</figcaption>}
        </figure>)}</div> : <p className="life-photos-empty">{copy["life.photosEmpty"]}</p>}
      </section>
      <div className="timeline" aria-label="Education and career timeline">{content.lifeMilestones.map((item) => <article key={`${item.year}-${item.title}`}><span>{item.year}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
    </section>
    <section className="mentor-quote"><Quote size={36} strokeWidth={1.2} /><blockquote>{copy["life.mentorQuote"]}</blockquote><p>{copy["life.mentorText"]}</p></section>
    <section className="sources-section"><p>{copy["life.sourcesIntro"]}</p><div><a href={copy["life.sourceJacksonUrl"]} target="_blank" rel="noopener noreferrer">{copy["life.sourceJacksonLabel"]}</a><a href={copy["life.sourceNasUrl"]} target="_blank" rel="noopener noreferrer">{copy["life.sourceNasLabel"]}</a></div></section>
    <SiteFooter />
  </main>;
}
