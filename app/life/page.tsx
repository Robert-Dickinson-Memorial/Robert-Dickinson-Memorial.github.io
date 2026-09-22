import { Quote } from "lucide-react";
import { InteriorHero, SiteFooter, SiteNav } from "../site-chrome";
import { getSiteContent } from "../site-data";

const milestones = [
  { year: "1961–68", title: "MIT", text: "Earned his S.M. and Ph.D. in meteorology at MIT, then remained as a research associate through 1968." },
  { year: "1968–90", title: "A home at NCAR", text: "Joined the National Center for Atmospheric Research, rising from scientist to section head and deputy director." },
  { year: "1980s", title: "Land enters the climate system", text: "Pioneered the representation of vegetation and land-surface processes in global climate models." },
  { year: "1988", title: "National Academy of Sciences", text: "Elected to the U.S. National Academy of Sciences for foundational contributions to atmospheric and climate science." },
  { year: "1990–2008", title: "Arizona & Georgia Tech", text: "Served as Regents Professor at Arizona and later held the Georgia Power/Georgia Research Alliance Chair at Georgia Tech." },
  { year: "2008–18", title: "The University of Texas", text: "Joined the Jackson School of Geosciences, where his scholarship and close mentorship shaped a new generation of climate scientists." },
];

export const dynamic = "force-dynamic";

export default async function LifePage() {
  const content = await getSiteContent();
  const paragraphs = content.obituaryStory.split(/\n\s*\n/).filter(Boolean);
  return <main className="interior-page">
    <SiteNav active="life" />
    <InteriorHero kicker="His life" title="A curious mind. A generous spirit." intro="The story of a scientist who kept widening the questions he asked—and the circle of people he welcomed into them." />
    <section className="story-section interior-story">
      <div className="story-grid"><div><p className="story-aside">1940–2026</p></div><div className="prose">{paragraphs.map((paragraph, index) => <p className={index === 0 ? "lead" : undefined} key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}</div></div>
      <div className="timeline" aria-label="Career timeline">{milestones.map((item) => <article key={item.year}><span>{item.year}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
    </section>
    <section className="mentor-quote"><Quote size={36} strokeWidth={1.2} /><blockquote>For Robert, the people he collaborated with—from students and postdocs to colleagues at every career stage—were among the greatest highlights of his life in science.</blockquote><p>His influence continues through the questions they ask, the models they build, and the people they mentor in turn.</p></section>
    <section className="sources-section"><p>Biographical information was drawn from institutional sources.</p><div><a href="https://www.jsg.utexas.edu/news/2018/12/robert-dickinson-climate-giant/" target="_blank" rel="noopener noreferrer">Jackson School profile</a><a href="https://www.nasonline.org/directory-entry/robert-e-dickinson-75xqut/" target="_blank" rel="noopener noreferrer">National Academy of Sciences</a></div></section>
    <SiteFooter />
  </main>;
}
