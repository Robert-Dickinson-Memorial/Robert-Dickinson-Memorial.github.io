import {
  ArrowDown,
  BookOpen,
  CloudSun,
  Compass,
  Leaf,
  Quote,
  Sprout,
  Users,
} from "lucide-react";
import ContributionForm from "./contribution-form";
import EventsSection from "./events-section";
import GallerySection from "./gallery-section";
import MemoryWall from "./memory-wall";
import { getChatGPTUser } from "./chatgpt-auth";
import { isEditorEmail, isOwnerEmail } from "./moderation";
import { getPublishedEvents, getPublishedGallery, getSiteContent } from "./site-data";

async function ReviewLink() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const editor = await isEditorEmail(user.email);
  const owner = isOwnerEmail(user.email);
  if (!editor && !owner) return null;
  return <>{editor && <a href="/manage">Manage memorial</a>}{owner && <a href="/review">Review submissions</a>}</>;
}

const milestones = [
  { year: "1961–66", title: "Harvard & MIT", text: "Studied chemistry and physics at Harvard, then earned master’s and doctoral degrees in meteorology at MIT." },
  { year: "1968", title: "A home at NCAR", text: "Joined the National Center for Atmospheric Research, beginning more than two decades of research and scientific leadership." },
  { year: "1980s", title: "Land enters the climate system", text: "Pioneered the representation of vegetation and land-surface processes in global climate models." },
  { year: "1988", title: "National Academy of Sciences", text: "Elected to the U.S. National Academy of Sciences for foundational contributions to atmospheric and climate science." },
  { year: "1990–2008", title: "Arizona & Georgia Tech", text: "Served as Regents Professor at the University of Arizona and later held the Georgia Power/Georgia Research Alliance Chair at Georgia Tech." },
  { year: "2008", title: "The University of Texas", text: "Joined the Jackson School of Geosciences, where his scholarship and close mentorship shaped a new generation of climate scientists." },
];

const chapters = [
  {
    icon: CloudSun,
    number: "01",
    title: "He changed climate models",
    text: "Robert was the first scientist to represent vegetation’s influence on climate in global models. His work transformed land from a passive boundary into a living, dynamic part of the climate system.",
  },
  {
    icon: Compass,
    number: "02",
    title: "He connected the Earth system",
    text: "His research spanned planetary waves, atmospheric dynamics, hydrology, drought, aerosols, remote sensing, the terrestrial carbon cycle, and the exchanges between land and atmosphere.",
  },
  {
    icon: Users,
    number: "03",
    title: "He multiplied possibility",
    text: "Students and postdoctoral scholars came from around the world to work with him. He remained a careful, hands-on mentor—down to reviewing code and questioning whether every modeled process made physical sense.",
  },
];

const honors = [
  "National Academy of Sciences · 1988",
  "Vetlesen Prize · 1996",
  "AGU Roger Revelle Medal · 1996",
  "AMS Carl-Gustaf Rossby Research Medal · 1997",
  "National Academy of Engineering · 2002",
  "President, American Geophysical Union · 2002–04",
  "Chinese Academy of Sciences · Foreign Member, 2006",
  "IPCC Fourth Assessment Report · Lead Author",
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const [content, events, gallery] = await Promise.all([getSiteContent(), getPublishedEvents(), getPublishedGallery()]);
  const obituaryParagraphs = content.obituaryStory.split(/\n\s*\n/).filter(Boolean);
  return (
    <main>
      <nav className="site-nav" aria-label="Main navigation">
        <a className="wordmark" href="#top" aria-label="Robert Dickinson memorial home"><span className="wordmark-mark">∞</span><span>Robert Dickinson</span></a>
        <div className="nav-links"><a href="#life">His life</a><a href="#legacy">Scientific legacy</a><a href="#events">Events</a><a href="#gallery">Gallery</a><a href="#memories">Memories</a></div>
        <a className="nav-cta" href="#share">Share a memory</a>
      </nav>

      <header id="top" className="hero">
        <img className="hero-art" src="/memorial-horizon.png" alt="" aria-hidden="true" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow">Celebrating a life in science</p>
          <h1>Robert E.<br /><em>Dickinson</em></h1>
          <p className="life-dates">March 26, 1940 – September 11, 2026</p>
          <p className="hero-intro">{content.heroIntro}</p>
          <a className="scroll-cue" href="#life">Read his story <ArrowDown size={17} aria-hidden="true" /></a>
        </div>
        <figure className="portrait-card">
          <img src="/robert-dickinson.jpg" alt="Robert E. Dickinson outdoors" />
          <blockquote>“The wonderful people I collaborated with” were among the great highlights of his career.</blockquote>
          <figcaption>Portrait courtesy of the Jackson School of Geosciences</figcaption>
        </figure>
      </header>

      <section className="tribute-actions" aria-labelledby="tribute-actions-title">
        <div className="tribute-actions-copy">
          <p className="section-kicker">Living tributes</p>
          <h2 id="tribute-actions-title">Two lasting ways to remember Robert</h2>
          <p>The main navigation now leads directly to his story, scientific legacy, events, gallery, and community memories.</p>
        </div>
        <div className="tribute-action-grid">
          <a className="tribute-action-card tree-card" href="/tree">
            <span className="tribute-action-icon"><Sprout size={28} aria-hidden="true" /></span>
            <span><small>Living tribute</small><strong>Plant a tree in his memory</strong><em>Dedicate trees, add a message, and receive a personalized certificate.</em><b>Begin a dedication →</b></span>
          </a>
          <a className="tribute-action-card book-card" href="/memory-book">
            <span className="tribute-action-icon"><BookOpen size={28} aria-hidden="true" /></span>
            <span><small>Community keepsake</small><strong>Turn memories into a book</strong><em>Read or print an editorial collection of approved stories and photographs.</em><b>Open the memory book →</b></span>
          </a>
        </div>
      </section>

      <section id="life" className="story-section">
        <div className="section-kicker">His story</div>
        <div className="story-grid">
          <div>
            <h2>A curious mind.<br />A generous spirit.</h2>
            <p className="story-aside">1940–2026</p>
          </div>
          <div className="prose">
            {obituaryParagraphs.map((paragraph, index) => <p className={index === 0 ? "lead" : undefined} key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}
          </div>
        </div>
        <div className="timeline" aria-label="Career timeline">
          {milestones.map((item) => (
            <article key={item.year}><span>{item.year}</span><h3>{item.title}</h3><p>{item.text}</p></article>
          ))}
        </div>
      </section>

      <section id="legacy" className="legacy-section">
        <div className="legacy-heading">
          <p className="section-kicker light">A climate giant</p>
          <h2>Science that changed how we see Earth</h2>
          <p>Robert’s work joined atmosphere, land, water, vegetation, and human influence into a more faithful picture of the climate system.</p>
        </div>
        <div className="chapter-grid">
          {chapters.map(({ icon: Icon, number, title, text }) => (
            <article className="chapter-card" key={number}>
              <div className="chapter-top"><Icon size={24} aria-hidden="true" /><span>{number}</span></div>
              <h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
        <div className="honors-block">
          <p className="section-kicker light">Selected honors & service</p>
          <div className="honors-grid">{honors.map((honor) => <div key={honor}>{honor}</div>)}</div>
          <p className="honors-note">As a lead author of the IPCC Fourth Assessment Report, Robert contributed to the body of work recognized when the IPCC and Al Gore received the 2007 Nobel Peace Prize.</p>
        </div>
      </section>

      <section className="mentor-quote">
        <Quote size={36} strokeWidth={1.2} aria-hidden="true" />
        <blockquote>For Robert, the people he collaborated with—from students and postdocs to colleagues at every career stage—were among the greatest highlights of his life in science.</blockquote>
        <p>His influence continues through the questions they ask, the models they build, and the people they mentor in turn.</p>
      </section>

      <section id="tree" className="tree-section">
        <div className="tree-rings" aria-hidden="true" />
        <div className="tree-content">
          <p className="section-kicker light">A living tribute</p>
          <h2>Plant a tree in Robert’s memory</h2>
          <p>{content.treeTribute}</p>
          <p className="tree-detail">{content.treeDetail}</p>
          <div className="tree-highlights" aria-label="Tree dedication features"><span>Personalized certificate</span><span>Custom memorial message</span><span>Native reforestation</span></div>
          <a className="tree-button" href="/tree"><Leaf size={18} aria-hidden="true" /> View the tree dedication</a>
          <small>Learn how the dedication works before continuing to the nonprofit provider.</small>
        </div>
      </section>

      <EventsSection events={events} />

      <GallerySection items={gallery} />

      <section id="memories" className="memories-section">
        <div className="memories-heading">
          <div><p className="section-kicker">From the community</p><h2>Memories, in many voices</h2></div>
          <p>Stories from Robert’s students, postdoctoral scholars, colleagues, friends, and family will appear here after review.</p>
        </div>
        <MemoryWall />
      </section>

      <section id="share" className="share-section">
        <div className="share-copy">
          <Quote size={36} strokeWidth={1.4} aria-hidden="true" />
          <p className="section-kicker light">Add your voice</p>
          <h2>Share a memory</h2>
          <p>A conversation after seminar. A line of code he helped untangle. The question that changed your research. Small stories often reveal the truest measure of a mentor’s life.</p>
          <div className="moderation-note">Every submission and photograph is reviewed before appearing publicly.</div>
        </div>
        <ContributionForm />
      </section>

      <section className="sources-section">
        <p>Biographical and scientific information was drawn from institutional sources.</p>
        <div>
          <a href="https://www.jsg.utexas.edu/news/2018/12/robert-dickinson-climate-giant/" target="_blank" rel="noopener noreferrer">Jackson School profile</a>
          <a href="https://www.jsg.utexas.edu/researcher/robert_dickinson/" target="_blank" rel="noopener noreferrer">UT faculty biography</a>
          <a href="https://www.nasonline.org/directory-entry/robert-e-dickinson-75xqut/" target="_blank" rel="noopener noreferrer">National Academy of Sciences</a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="wordmark footer-mark"><span className="wordmark-mark">∞</span><span>Robert E. Dickinson</span></div>
        <p>Created with love by his academic community.</p>
        <div className="footer-links"><ReviewLink /><a href="#top">Return to top ↑</a></div>
      </footer>
    </main>
  );
}
