import { ArrowRight, BookOpen, CalendarDays, Images, MessageSquareText, Sprout } from "lucide-react";
import Link from "next/link";
import { SiteFooter, SiteNav } from "./site-chrome";
import { getPublishedEvents, getPublishedGallery, getSiteContent } from "./site-data";

export const dynamic = "force-dynamic";

function LegacyNetwork({ topics }: { topics: { title: string; note: string }[] }) {
  return (
    <div className="home-legacy-network" aria-label="Connected themes in Robert Dickinson's scientific legacy">
      <svg className="home-legacy-network-lines" viewBox="0 0 1000 440" preserveAspectRatio="none" aria-hidden="true">
        <path d="M500 220 C390 180 275 110 165 95" />
        <path d="M500 220 C610 165 735 105 850 100" />
        <path d="M500 220 C380 255 270 330 155 350" />
        <path d="M500 220 C625 260 735 330 855 350" />
        <path d="M165 95 C280 155 360 155 500 220" />
        <path d="M850 100 C790 205 785 285 855 350" />
        <path d="M155 350 C360 405 655 410 855 350" />
      </svg>
      {topics.map((topic, index) => (
        <article className={`home-legacy-node home-legacy-node-${index + 1}`} key={`${index}-${topic.title}`}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{topic.title}</strong>
          <small>{topic.note}</small>
        </article>
      ))}
    </div>
  );
}

export default async function Home() {
  const [content, events, gallery] = await Promise.all([getSiteContent(), getPublishedEvents(), getPublishedGallery()]);
  const introduction = content.obituaryStory.split(/\n\s*\n/).filter(Boolean).slice(0, 2);
  return (
    <main data-body-font={content.bodyFont} data-heading-font={content.headingFont}>
      <SiteNav active="home" />
      <header id="top" className="hero">
        <img className="hero-art" src="/memorial-horizon.png" alt="" aria-hidden="true" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow">Celebrating a life in science</p>
          <h1>Robert E.<br /><em>Dickinson</em></h1>
          <p className="life-dates">March 26, 1940 – September 11, 2026</p>
          <p className="hero-intro">{content.heroIntro}</p>
          <Link className="scroll-cue" href="/life">Read his story <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        <figure className="portrait-card">
          <img src="/robert-dickinson.jpg" alt="Robert E. Dickinson outdoors" />
          <blockquote>“The wonderful people I collaborated with” were among the great highlights of his career.</blockquote>
          <figcaption>Portrait courtesy of the Jackson School of Geosciences</figcaption>
        </figure>
      </header>

      <section className="home-story-preview">
        <div><p className="section-kicker">His story</p><h2>A curious mind.<br />A generous spirit.</h2><span>1940–2026</span></div>
        <div className="home-story-copy">{introduction.map((paragraph, index) => <p className={index === 0 ? "lead" : undefined} key={paragraph.slice(0, 30)}>{paragraph}</p>)}<Link className="text-link" href="/life">Read Robert’s full story <ArrowRight size={16} /></Link></div>
      </section>

      <section className="tribute-actions" aria-labelledby="tribute-actions-title">
        <div className="tribute-actions-copy"><p className="section-kicker">Living tributes</p><h2 id="tribute-actions-title">Two lasting ways to remember Robert</h2><p>Carry his memory into a living landscape, or preserve the community’s stories in a keepsake collection.</p></div>
        <div className="tribute-action-grid">
          <Link className="tribute-action-card tree-card" href="/tree"><span className="tribute-action-icon"><Sprout size={28} /></span><span><small>Living tribute</small><strong>Plant a tree in his memory</strong><em>Dedicate trees, add a message, and receive a personalized certificate.</em><b>Begin a dedication →</b></span></Link>
          <Link className="tribute-action-card book-card" href="/memory-book"><span className="tribute-action-icon"><BookOpen size={28} /></span><span><small>Community keepsake</small><strong>Turn memories into a book</strong><em>Read or print an editorial collection of approved stories and photographs.</em><b>Open the memory book →</b></span></Link>
        </div>
      </section>

      <section className="home-legacy-preview">
        <div className="home-preview-heading"><div><p className="section-kicker light">Scientific legacy</p><h2>Science that changed how we see Earth</h2></div><p>{content.homeLegacyIntro}</p></div>
        <LegacyNetwork topics={content.homeLegacyTopics} />
        <Link className="light-button" href="/legacy">Explore his scientific journey <ArrowRight size={17} /></Link>
      </section>

      <section className="home-community">
        <div className="home-community-heading"><p className="section-kicker">Explore the memorial</p><h2>A life remembered in many forms</h2><p>Visit each collection when you are ready. The homepage offers a quiet starting point rather than the entire archive at once.</p></div>
        <div className="home-community-grid">
          <Link href="/events"><CalendarDays size={25} /><small>Gather together</small><h3>Events</h3><p>{events.length ? `${events.length} memorial ${events.length === 1 ? "event" : "events"} currently listed.` : "Memorial gatherings and scientific tributes will be shared here."}</p><b>View events →</b></Link>
          <Link href="/gallery"><Images size={25} /><small>Photos & film</small><h3>Gallery</h3><p>{gallery.length ? `${gallery.length} photographs or videos in the public collection.` : "Photographs and videos tracing a life in science and community."}</p><b>Open the gallery →</b></Link>
          <Link href="/memories"><MessageSquareText size={25} /><small>From the community</small><h3>Memories</h3><p>Read approved stories from students, colleagues, friends, and family—and add your own.</p><b>Read or share memories →</b></Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
