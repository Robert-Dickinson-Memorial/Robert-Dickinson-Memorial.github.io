import { InteriorHero, SiteFooter, SiteNav } from "../site-chrome";
import { getSiteContent, type LegacyChapterPhoto } from "../site-data";

export const dynamic = "force-dynamic";

const threads = [
  { title: "Atmospheric dynamics", text: "Planetary waves, circulation, radiation, and the physics that set atmospheres in motion." },
  { title: "Climate change", text: "Physical understanding of how greenhouse gases and feedbacks reshape the climate system." },
  { title: "Climate modeling", text: "Models used not merely to predict, but to reveal how interacting processes create climate." },
  { title: "Land–atmosphere interactions", text: "Vegetation, soils, water, snow, roots, and surface energy made active parts of the climate system." },
  { title: "Observation from space", text: "Remote sensing used to confront models with the changing temperature and condition of land." },
  { title: "A coupled Earth", text: "Water, energy, carbon, ecosystems, and human influence brought into one scientific picture." },
];

function photoSrc(photo: LegacyChapterPhoto | null): string | null {
  if (!photo) return null;
  if (photo.objectKey) return `/api/chapter-photos/${photo.objectKey.split("/").map(encodeURIComponent).join("/")}`;
  if (photo.asset) return `/${photo.asset.replace(/^\//, "")}`;
  return null;
}

export default async function LegacyPage() {
  const content = await getSiteContent();
  return <main className="interior-page legacy-page" data-body-font={content.bodyFont} data-heading-font={content.headingFont}>
    <SiteNav active="legacy" />
    <InteriorHero kicker="Scientific legacy" title="Science that changed how we see Earth" intro="A chronological journey through the institutions, questions, and enduring ideas that shaped Robert’s work." />
    <section className="legacy-section legacy-page-content">
      <div className="legacy-scale-intro"><p className="section-kicker light">A widening scientific horizon</p><h3>He repeatedly changed the scale of the problem.</h3><p>Across six decades, each question opened into a larger one—without losing the physical clarity of the question that came before it.</p></div>
      <ol className="legacy-scale legacy-scale-six" aria-label="Robert Dickinson's scientific journey">{content.legacyChapters.map((chapter) => <li key={chapter.id}><span>{chapter.number}</span><strong>{chapter.institution}</strong><small>{chapter.scale}</small></li>)}</ol>

      <div className="legacy-journey"><aside className="journey-rail"><p className="section-kicker light">Career chapters</p><nav>{content.legacyChapters.map((chapter) => <a href={`#${chapter.id}`} key={chapter.id}><span>{chapter.number}</span><b>{chapter.institution}</b><small>{chapter.years}</small></a>)}</nav></aside>
        <div className="journey-chapters">{content.legacyChapters.map((chapter) => {
          const image = photoSrc(chapter.photo);
          return <article className="journey-chapter" id={chapter.id} key={chapter.id}>
            <header><div className="journey-number">{chapter.number}</div><div><p>{chapter.institution} <span>·</span> {chapter.years}</p><h3>{chapter.title}</h3></div><div className="journey-scale"><small>Scientific focus</small><strong>{chapter.scale}</strong></div></header>
            <p className="journey-summary">{chapter.summary}</p>
            <div className="journey-detail"><div><p className="journey-label">Key contributions</p><ul>{chapter.contributions.map((item) => <li key={item}>{item}</li>)}</ul></div><blockquote><p className="journey-label">Legacy</p><span>{chapter.impact}</span></blockquote></div>
            {(image || chapter.publication) && <div className="journey-evidence">
              {image && chapter.photo && <figure><img src={image} alt={chapter.photo.alt} /><figcaption>{chapter.photo.caption}<small>Photo shared for the Robert E. Dickinson memorial.</small></figcaption></figure>}
              {chapter.publication && <article className="landmark-publication"><p className="journey-label">Landmark publication <span>·</span> {chapter.publication.year}</p><h4>{chapter.publication.title}</h4><cite>{chapter.publication.citation}</cite><p>{chapter.publication.note}</p></article>}
            </div>}
            <div className="journey-tags">{chapter.threads.map((thread) => <span key={thread}>{thread}</span>)}</div>
          </article>;
        })}</div>
      </div>

      <div className="enduring-threads"><div className="threads-heading"><div><p className="section-kicker light">Across every institution</p><h3>Enduring research threads</h3></div><p>The affiliations mark chapters in Robert’s career. These ideas reveal the deeper continuity running through them.</p></div><div className="thread-grid">{threads.map((thread, index) => <article key={thread.title}><span>{String(index + 1).padStart(2, "0")}</span><h4>{thread.title}</h4><p>{thread.text}</p></article>)}</div></div>

      <div className="honors-block"><p className="section-kicker light">Honors, awards & recognition</p><div className="honors-grid honors-grid-detailed">{content.honors.map((honor) => <div className="honor-item" key={`${honor.year}-${honor.title}`}><span>{honor.year}</span><strong>{honor.title}</strong><small>{honor.detail}</small></div>)}</div><p className="honors-note">{content.honorsNote}</p></div>
    </section>
    <SiteFooter />
  </main>;
}
