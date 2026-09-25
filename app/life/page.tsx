import { Quote } from "lucide-react";
import { SiteFooter, SiteNav } from "../site-chrome";
import { getSiteContent, type LifePhoto } from "../site-data";
import LifeTimelineMotion from "./timeline-motion";

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
  const portrait = content.siteAssets.portrait;
  const portraitSrc = portrait.objectKey
    ? `/api/site-assets/${portrait.objectKey.split("/").map(encodeURIComponent).join("/")}`
    : `/assets/${portrait.asset.replace(/^\//, "")}`;
  const paragraphs = content.obituaryStory.split(/\n\s*\n/).filter(Boolean);

  return <main className="interior-page life-reference-page" data-body-font={content.bodyFont} data-heading-font={content.headingFont}>
    <SiteNav active="life" />
    <header className="life-reference-hero">
      <div className="life-reference-hero-inner">
        <div className="life-reference-hero-copy">
          <p className="section-kicker">{copy["life.heroKicker"]}</p>
          <h1>{copy["life.heroKicker"]}</h1>
          <h2>{copy["life.heroTitle"]}</h2>
          <p className="life-reference-hero-intro">{copy["life.heroIntro"]}</p>
          <span className="life-reference-years">{copy["life.years"]}</span>
        </div>
        <figure className="life-reference-portrait"><img src={portraitSrc} alt={portrait.alt} /></figure>
      </div>
    </header>
    <section className="life-reference-timeline" aria-label="Robert Dickinson's life in chronological order">
      <LifeTimelineMotion />
      <div className="life-reference-track">
        <article className="life-scroll-entry life-reference-entry">
          <div className="life-reference-date"><span>{copy["life.photosKicker"]}</span></div>
          <div className="life-reference-card life-reference-childhood">
            <div className="life-reference-card-copy">
              <h3>{copy["life.photosKicker"]}</h3>
              <p>{copy["life.childhoodSummary"]}</p>
            </div>
            {earlyPhotos.length
              ? <div className="life-reference-card-media life-reference-early-photos">{earlyPhotos.map((photo) => <LifePhotograph key={photo.id} photo={photo} />)}</div>
              : <p className="life-photos-empty">{copy["life.photosEmpty"]}</p>}
          </div>
        </article>
        {content.lifeMilestones.map((item, index) => {
          const photo = content.lifePhotos.find((candidate) => candidate.milestoneId === (item.id || `life-period-${index}`));
          return <article className="life-scroll-entry life-reference-entry" key={item.id || index}>
            <div className="life-reference-date"><span>{item.year}</span></div>
            <div className={`life-reference-card${photo ? "" : " life-reference-no-photo"}`}>
              <div className="life-reference-card-copy"><h3>{item.title}</h3><p>{item.text}</p></div>
              {photo && <div className="life-reference-card-media"><LifePhotograph photo={photo} /></div>}
            </div>
          </article>;
        })}
      </div>
    </section>
    <section className="life-reference-story">
      <h2>{copy["life.storyHeading"]}</h2>
      <div className="prose">{paragraphs.map((paragraph, index) => <p className={index === 0 ? "lead" : undefined} key={index}>{paragraph}</p>)}</div>
    </section>
    <section className="mentor-quote"><Quote size={36} strokeWidth={1.2} /><blockquote>{copy["life.mentorQuote"]}</blockquote><p>{copy["life.mentorText"]}</p></section>
    <section className="sources-section"><p>{copy["life.sourcesIntro"]}</p><div><a href={copy["life.sourceJacksonUrl"]} target="_blank" rel="noopener noreferrer">{copy["life.sourceJacksonLabel"]}</a><a href={copy["life.sourceNasUrl"]} target="_blank" rel="noopener noreferrer">{copy["life.sourceNasLabel"]}</a></div></section>
    <SiteFooter />
  </main>;
}
