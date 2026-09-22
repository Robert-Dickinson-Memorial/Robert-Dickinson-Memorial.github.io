import { ArrowRight, BookOpen, CalendarDays, CloudSun, Compass, Images, MessageSquareText, Sprout, Users } from "lucide-react";
import Link from "next/link";
import { SiteFooter, SiteNav } from "./site-chrome";
import { getPublishedEvents, getPublishedGallery, getSiteContent, type SiteAsset } from "./site-data";

const legacyIcons = [CloudSun, Compass, Users];

export const dynamic = "force-dynamic";

function assetUrl(asset: SiteAsset) {
  if (asset.objectKey) return `/api/site-assets/${asset.objectKey.split("/").map(encodeURIComponent).join("/")}`;
  return `/${asset.asset.replace(/^\//, "")}`;
}

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
  const copy = content.pageCopy;
  const introduction = content.obituaryStory.split(/\n\s*\n/).filter(Boolean).slice(0, 2);
  const eventsText = events.length
    ? (events.length === 1 ? copy["home.eventsCountOne"] : copy["home.eventsCountMany"].replace("{count}", String(events.length)))
    : copy["home.eventsEmpty"];
  const galleryText = gallery.length
    ? (gallery.length === 1 ? copy["home.galleryCountOne"] : copy["home.galleryCountMany"].replace("{count}", String(gallery.length)))
    : copy["home.galleryEmpty"];

  return (
    <main data-body-font={content.bodyFont} data-heading-font={content.headingFont}>
      <SiteNav active="home" />
      <header id="top" className="hero">
        <img className="hero-art" src={assetUrl(content.siteAssets.horizon)} alt={content.siteAssets.horizon.alt} aria-hidden={!content.siteAssets.horizon.alt} />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow">{copy["home.heroEyebrow"]}</p>
          <h1>{copy["home.heroNameLine1"]}<br /><em>{copy["home.heroNameLine2"]}</em></h1>
          <p className="life-dates">{copy["home.lifeDates"]}</p>
          <p className="hero-intro">{content.heroIntro}</p>
          <Link className="scroll-cue" href="/life">{copy["home.readStory"]} <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        <figure className="portrait-card">
          <img src={assetUrl(content.siteAssets.portrait)} alt={content.siteAssets.portrait.alt} />
          <blockquote>{copy["home.portraitQuote"]}</blockquote>
          <figcaption>{copy["home.portraitCaption"]}</figcaption>
        </figure>
      </header>

      <section className="home-story-preview">
        <div><p className="section-kicker">{copy["home.storyKicker"]}</p><h2>{copy["home.storyTitleLine1"]}<br />{copy["home.storyTitleLine2"]}</h2><span>{copy["home.storyYears"]}</span></div>
        <div className="home-story-copy">{introduction.map((paragraph, index) => <p className={index === 0 ? "lead" : undefined} key={paragraph.slice(0, 30)}>{paragraph}</p>)}<Link className="text-link" href="/life">{copy["home.storyReadLink"]} <ArrowRight size={16} /></Link></div>
      </section>

      <section className="tribute-actions" aria-labelledby="tribute-actions-title">
        <div className="tribute-actions-copy"><p className="section-kicker">{copy["home.tributeKicker"]}</p><h2 id="tribute-actions-title">{copy["home.tributeTitle"]}</h2><p>{copy["home.tributeIntro"]}</p></div>
        <div className="tribute-action-grid">
          <Link className="tribute-action-card tree-card" href="/tree"><span className="tribute-action-icon"><Sprout size={28} /></span><span><small>{copy["home.treeKicker"]}</small><strong>{copy["home.treeTitle"]}</strong><em>{copy["home.treeText"]}</em><b>{copy["home.treeCta"]}</b></span></Link>
          <Link className="tribute-action-card book-card" href="/memory-book"><span className="tribute-action-icon"><BookOpen size={28} /></span><span><small>{copy["home.bookKicker"]}</small><strong>{copy["home.bookTitle"]}</strong><em>{copy["home.bookText"]}</em><b>{copy["home.bookCta"]}</b></span></Link>
        </div>
      </section>

      <section className="home-legacy-preview">
        <div className="home-preview-heading"><div><p className="section-kicker light">{copy["home.legacyKicker"]}</p><h2>{copy["home.legacyTitle"]}</h2></div><p>{content.homeLegacyIntro}</p></div>
        <LegacyNetwork topics={content.homeLegacyTopics} />
        <div className="chapter-grid home-chapter-grid">{content.homeLegacyCards.map((card, index) => { const Icon = legacyIcons[index] ?? CloudSun; const number = String(index + 1).padStart(2, "0"); return <article className="chapter-card" key={`${index}-${card.title}`}><div className="chapter-top"><Icon size={24} /><span>{number}</span></div><h3>{card.title}</h3><p>{card.text}</p></article>; })}</div>
        <Link className="light-button" href="/legacy">{copy["home.legacyCta"]} <ArrowRight size={17} /></Link>
      </section>

      <section className="home-community">
        <div className="home-community-heading"><p className="section-kicker">{copy["home.communityKicker"]}</p><h2>{copy["home.communityTitle"]}</h2><p>{copy["home.communityIntro"]}</p></div>
        <div className="home-community-grid">
          <Link href="/events"><CalendarDays size={25} /><small>{copy["home.eventsKicker"]}</small><h3>{copy["home.eventsTitle"]}</h3><p>{eventsText}</p><b>{copy["home.eventsCta"]}</b></Link>
          <Link href="/gallery"><Images size={25} /><small>{copy["home.galleryKicker"]}</small><h3>{copy["home.galleryTitle"]}</h3><p>{galleryText}</p><b>{copy["home.galleryCta"]}</b></Link>
          <Link href="/memories"><MessageSquareText size={25} /><small>{copy["home.memoriesKicker"]}</small><h3>{copy["home.memoriesTitle"]}</h3><p>{copy["home.memoriesText"]}</p><b>{copy["home.memoriesCta"]}</b></Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
