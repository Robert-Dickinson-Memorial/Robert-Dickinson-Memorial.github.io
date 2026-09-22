import { Quote } from "lucide-react";
import { InteriorHero, SiteFooter, SiteNav } from "../site-chrome";
import { getSiteContent } from "../site-data";

export const dynamic = "force-dynamic";

export default async function LifePage() {
  const content = await getSiteContent();
  const paragraphs = content.obituaryStory.split(/\n\s*\n/).filter(Boolean);
  return <main className="interior-page" data-body-font={content.bodyFont} data-heading-font={content.headingFont}>
    <SiteNav active="life" />
    <InteriorHero kicker="His life" title="A curious mind. A generous spirit." intro="The story of a scientist who kept widening the questions he asked—and the circle of people he welcomed into them." />
    <section className="story-section interior-story">
      <div className="story-grid"><div><p className="story-aside">1940–2026</p></div><div className="prose">{paragraphs.map((paragraph, index) => <p className={index === 0 ? "lead" : undefined} key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}</div></div>
      <div className="timeline" aria-label="Education and career timeline">{content.lifeMilestones.map((item) => <article key={`${item.year}-${item.title}`}><span>{item.year}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
    </section>
    <section className="mentor-quote"><Quote size={36} strokeWidth={1.2} /><blockquote>For Robert, the people he collaborated with—from students and postdocs to colleagues at every career stage—were among the greatest highlights of his life in science.</blockquote><p>His influence continues through the questions they ask, the models they build, and the people they mentor in turn.</p></section>
    <section className="sources-section"><p>Biographical information was drawn from Robert’s curriculum vitae and institutional sources.</p><div><a href="https://www.jsg.utexas.edu/researcher/robert_dickinson/" target="_blank" rel="noopener noreferrer">Jackson School profile</a><a href="https://www.nasonline.org/directory-entry/robert-e-dickinson-75xqut/" target="_blank" rel="noopener noreferrer">National Academy of Sciences</a></div></section>
    <SiteFooter />
  </main>;
}
