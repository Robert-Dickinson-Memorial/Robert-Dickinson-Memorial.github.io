import { Quote } from "lucide-react";
import { InteriorHero, SiteFooter, SiteNav } from "../site-chrome";
import { getSiteContent, type LifePhoto } from "../site-data";

export const dynamic = "force-dynamic";


function LifePhotograph({ photo }: { photo: LifePhoto }) {
  return <figure className="life-photo">
    <img src={`/api/life-photos/${photo.objectKey.split("/").map(encodeURIComponent).join("/")}`} alt={photo.alt} loading="lazy" />
    {(photo.date || photo.caption) && <figcaption>{photo.date && <span>{photo.date}</span>}{photo.caption && <p>{photo.caption}</p>}</figcaption>}
  </figure>;
}

export default async function LifePage() {
  const content = await getSiteContent();
  const copy = content.pageCopy;
  const earlyPhotos = content.lifePhotos.filter((photo) => !photo.milestoneId);
  const paragraphs = content.obituaryStory.split(/\n\s*\n/).filter(Boolean);
  return <main className="interior-page" data-body-font={content.bodyFont} data-heading-font={content.headingFont}>
    <SiteNav active="life" />
    <InteriorHero kicker={copy["life.heroKicker"]} title={copy["life.heroTitle"]} intro={copy["life.heroIntro"]} />
    <section className="story-section interior-story">
      <div className="story-grid life-story-grid">
        <aside className="life-photo-column" aria-labelledby="life-photos-title">
          <p className="section-kicker" id="life-photos-title">{copy["life.photosKicker"]}</p>
          {earlyPhotos.length ? <div className="life-photo-stack">{earlyPhotos.map((photo) => <LifePhotograph key={photo.id} photo={photo} />)}</div> : <p className="life-photos-empty">{copy["life.photosEmpty"]}</p>}
          <p className="story-aside">{copy["life.years"]}</p>
        </aside>
        <div className="prose">{paragraphs.map((paragraph, index) => <p className={index === 0 ? "lead" : undefined} key={index}>{paragraph}</p>)}</div>
      </div>
      <div className="timeline life-photo-timeline" aria-label="Education and career timeline">{content.lifeMilestones.map((item, index) => {
        const photo = content.lifePhotos.find((photo) => photo.milestoneId === (item.id || `life-period-${index}`));
        return <article key={item.id || index}><span>{item.year}</span><h3>{item.title}</h3><p>{item.text}</p>{photo && <LifePhotograph photo={photo} />}</article>;
      })}</div>
    </section>
    <section className="mentor-quote"><Quote size={36} strokeWidth={1.2} /><blockquote>{copy["life.mentorQuote"]}</blockquote><p>{copy["life.mentorText"]}</p></section>
    <section className="sources-section"><p>{copy["life.sourcesIntro"]}</p><div><a href={copy["life.sourceJacksonUrl"]} target="_blank" rel="noopener noreferrer">{copy["life.sourceJacksonLabel"]}</a><a href={copy["life.sourceNasUrl"]} target="_blank" rel="noopener noreferrer">{copy["life.sourceNasLabel"]}</a></div></section>
    <SiteFooter />
  </main>;
}
