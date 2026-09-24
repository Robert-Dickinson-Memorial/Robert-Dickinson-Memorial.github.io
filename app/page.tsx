import { ArrowRight, BookOpen, CalendarDays, Images, MessageSquareText, Sprout } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { SiteFooter, SiteNav } from "./site-chrome";
import {
  getPublishedEvents,
  getPublishedGallery,
  getSiteContent,
  type HomeLegacyCard,
  type LegacyThread,
  type SecondaryLegacyTopic,
  type SiteAsset,
} from "./site-data";

export const dynamic = "force-dynamic";

function assetUrl(asset: SiteAsset) {
  if (asset.objectKey) return `/api/site-assets/${asset.objectKey.split("/").map(encodeURIComponent).join("/")}`;
  return `/${asset.asset.replace(/^\//, "")}`;
}

function ScientificLegacyStory({
  highlights,
}: {
  highlights: HomeLegacyCard[];
}) {
  return <div className="home-science-story">
    <div className="science-highlight-stream">
      {highlights.map((highlight, index) => <article className="science-highlight" key={`${index}-${highlight.title}`}>
        <span className="science-highlight-dot" aria-hidden="true" />
        <h3>{highlight.title}</h3>
        <p>{highlight.text}</p>
      </article>)}
    </div>

  </div>;
}

function OtherFrontiers({ topics, label }: { topics: SecondaryLegacyTopic[]; label: string }) {
  return <div className="science-secondary-band science-secondary-band-home">
    <div className="science-secondary-intro"><span className="science-secondary-label">{label}</span></div>
    <div className="science-secondary-terms">
      {topics.map((topic, index) => <span key={`${index}-${topic.title}`} title={topic.text}>{topic.title}</span>)}
    </div>
  </div>;
}

function ScienceImpactDiagram({ threads, title, artwork }: { threads: LegacyThread[]; title: string; artwork: string }) {
  return <div className="science-impact-diagram" role="group" aria-label="Connected scientific impacts" style={{ "--impact-art": `url("${artwork}")`, "--impact-photos": 'url("/legacy-science-reference.webp")' } as CSSProperties}>
    <svg className="science-impact-lines" viewBox="0 0 1200 520" preserveAspectRatio="none" aria-hidden="true">
      <path d="M 210 110 Q 390 30 585 85 Q 810 20 1000 120 Q 1130 270 1000 375 Q 790 470 590 410 Q 350 485 205 375 Q 90 255 210 110 Z" />
      <path d="M 210 110 Q 395 280 590 410 M 585 85 Q 740 320 1000 375 M 205 375 Q 590 130 1000 120 M 210 110 Q 715 420 1000 375" />
    </svg>
    <strong className="science-impact-center">{title}</strong>
    {threads.map((thread) => <div className={`science-impact-node science-impact-node--${thread.id}`} key={thread.id} title={thread.text}>
      <span className={`science-impact-photo science-impact-photo--${thread.id}`} aria-hidden="true" />
      <span className="science-impact-node-label">{thread.title}</span>
    </div>)}
  </div>;
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
        <div className="home-preview-heading home-preview-heading-integrated">
          <div className="home-legacy-title-block"><p className="section-kicker light">{copy["home.legacyKicker"]}</p><h2>{copy["home.legacyTitle"]}</h2></div>
          <div className="home-legacy-copy-block">
            <div className="home-legacy-intro-block"><p>{content.homeLegacyIntro}</p></div>
          </div>
          <div className="home-thread-visual">
            <ScienceImpactDiagram threads={content.legacyThreads} title={copy["home.legacyMapPrimary"]} artwork={assetUrl(content.siteAssets.horizon)} />
            <OtherFrontiers topics={content.homeFrontiers} label={copy["home.legacyMapSecondary"]} />
          </div>
        </div>
        <ScientificLegacyStory highlights={content.homeLegacyCards} />
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
