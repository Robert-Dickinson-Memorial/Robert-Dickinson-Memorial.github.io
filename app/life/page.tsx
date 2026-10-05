import { SharedHeroArt, SiteFooter, SiteNav } from "../site-chrome";
import { siteImageVariables } from "../site-chrome";
import { getSiteContent, type LifePhoto } from "../site-data";
import LifeTimelineMotion from "./timeline-motion";

export const dynamic = "force-dynamic";

function LifePhotograph({ photo, caption = true }: { photo: LifePhoto; caption?: boolean }) {
  return <figure className="life-photo">
    <img src={`/api/life-photos/${photo.objectKey.split("/").map(encodeURIComponent).join("/")}`} alt={photo.alt} loading="lazy" />
    {caption && (photo.date || photo.caption) && <figcaption>{photo.date && <span>{photo.date}</span>}{photo.caption && <p>{photo.caption}</p>}</figcaption>}
  </figure>;
}

export default async function LifePage() {
  const content = await getSiteContent();
  const copy = content.pageCopy;
  const earlyPhotos = content.lifePhotos.filter((photo) => !photo.milestoneId);

  return <main style={siteImageVariables(content.siteAssets)} id="page-top" className="interior-page life-reference-page life-page-active" data-body-font={content.bodyFont} data-heading-font={content.headingFont}>
    <SiteNav active="life" />
    <header className="life-reference-hero shared-portrait-hero">
      <div className="life-reference-hero-inner shared-hero-inner">
        <div className="life-reference-hero-copy shared-hero-copy">
          <p className="section-kicker">{copy["life.heroKicker"]}</p>
          <p className="life-reference-name">{copy["life.heroName"]}</p>
          <span className="life-reference-years">{copy["life.years"]}</span>
          <h1>{copy["life.heroTitle"].replace(/\.\s+(?=A generous spirit)/i, ".\n")}</h1>
          <p className="life-reference-hero-intro">{copy["life.heroIntro"]}</p>
        </div>
        <SharedHeroArt assets={content.siteAssets} />
      </div>
    </header>
    <div className="life-reference-body">
    <aside className="life-reference-qualities" aria-labelledby="life-qualities-heading">
      <h2 id="life-qualities-heading">{copy["life.qualitiesHeading"]}</h2>
      <ul><li>{copy["life.qualityCuriosity"]}</li><li>{copy["life.qualityHumility"]}</li><li>{copy["life.qualityKindness"]}</li><li>{copy["life.qualityMentorship"]}</li><li>{copy["life.qualityLeadership"]}</li><li>{copy["life.qualityFriendship"]}</li></ul>
      <a className="text-link" href="/memory-book/">{copy["life.fullStoryLink"]}</a>
    </aside>
    <section className="life-reference-timeline" aria-label="Robert Dickinson's life in chronological order">
      <LifeTimelineMotion />
      <div className="life-reference-track">
        <article className="life-scroll-entry life-reference-entry">
          <div className="life-reference-date"><span>{copy["life.timelineChildhoodLabel"]}</span></div>
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
              {photo && <div className={`life-reference-card-media${(item.id || `life-period-${index}`) === "life-period-6" ? " life-reference-card-media--ucla" : ""}`}><LifePhotograph photo={photo} /></div>}
            </div>
          </article>;
        })}
      </div>
    </section>
    </div>
    <SiteFooter />
  </main>;
}
