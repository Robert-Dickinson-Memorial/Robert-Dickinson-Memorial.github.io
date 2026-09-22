import { ArrowRight, BookOpen, CalendarDays, Images, MessageSquareText, Sprout } from "lucide-react";
import Link from "next/link";
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

const primaryPositions = [
  { x: 59, y: 12 },
  { x: 83, y: 16 },
  { x: 71, y: 34 },
  { x: 58, y: 57 },
  { x: 86, y: 59 },
  { x: 73, y: 80 },
];

const secondaryPositions = [
  { x: 48, y: 4 },
  { x: 48, y: 69 },
  { x: 94, y: 35 },
  { x: 66, y: 94 },
  { x: 50, y: 88 },
  { x: 96, y: 7 },
  { x: 43, y: 78 },
  { x: 94, y: 23 },
];

const highlightAnchors = [
  { x: 38, y: 14 },
  { x: 38, y: 36 },
  { x: 38, y: 59 },
  { x: 38, y: 82 },
];

function ScientificStoryMap({
  threads,
  highlights,
  secondaryTopics,
  primaryLabel,
  secondaryLabel,
  hint,
}: {
  threads: LegacyThread[];
  highlights: HomeLegacyCard[];
  secondaryTopics: SecondaryLegacyTopic[];
  primaryLabel: string;
  secondaryLabel: string;
  hint: string;
}) {
  const positionById = new Map(threads.map((thread, index) => [thread.id, primaryPositions[index % primaryPositions.length]]));
  const coreLinks = [
    [0, 2], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5], [1, 5],
  ];

  return <div className="home-science-story">
    <svg className="science-story-lines" viewBox="0 0 1000 900" preserveAspectRatio="none" aria-hidden="true">
      {coreLinks.map(([fromIndex, toIndex]) => {
        const from = primaryPositions[fromIndex];
        const to = primaryPositions[toIndex];
        if (!from || !to || !threads[fromIndex] || !threads[toIndex]) return null;
        return <path className="science-core-line" d={`M ${from.x * 10} ${from.y * 9} C ${(from.x + to.x) * 5} ${from.y * 9}, ${(from.x + to.x) * 5} ${to.y * 9}, ${to.x * 10} ${to.y * 9}`} key={`core-${fromIndex}-${toIndex}`} />;
      })}
      {highlights.slice(0, 4).flatMap((highlight, highlightIndex) => {
        const anchor = highlightAnchors[highlightIndex];
        if (!anchor) return [];
        return highlight.threadIds.map((threadId) => {
          const target = positionById.get(threadId);
          if (!target) return null;
          return <path className={`science-highlight-line science-highlight-line-${highlightIndex + 1}`} d={`M ${anchor.x * 10} ${anchor.y * 9} C 470 ${anchor.y * 9}, 500 ${target.y * 9}, ${target.x * 10} ${target.y * 9}`} key={`highlight-${highlightIndex}-${threadId}`} />;
        });
      })}
      {secondaryTopics.map((topic, index) => {
        const secondary = secondaryPositions[index % secondaryPositions.length];
        const primary = topic.threadIds.map((id) => positionById.get(id)).find(Boolean);
        if (!primary) return null;
        return <path className="science-satellite-line" d={`M ${secondary.x * 10} ${secondary.y * 9} Q ${(secondary.x + primary.x) * 5} ${(secondary.y + primary.y) * 4.5} ${primary.x * 10} ${primary.y * 9}`} key={`satellite-${index}`} />;
      })}
    </svg>

    <div className="science-highlight-stream">
      {highlights.map((highlight, index) => <article className={`science-highlight science-highlight-${index + 1}`} key={`${index}-${highlight.title}`}>
        <span className="science-highlight-dot" aria-hidden="true" />
        <div><h3>{highlight.title}</h3><p>{highlight.text}</p></div>
      </article>)}
    </div>

    <div className="science-constellation" aria-label="Scientific themes connected across Robert Dickinson's work">
      <div className="science-map-heading"><span>{primaryLabel}</span><p>{hint}</p></div>
      {threads.map((thread, index) => {
        const position = primaryPositions[index % primaryPositions.length];
        return <article className="science-thread-node" key={thread.id} style={{ left: `${position.x}%`, top: `${position.y}%` }}>
          <strong>{thread.title}</strong><small>{thread.text}</small>
        </article>;
      })}
      <span className="science-secondary-label">{secondaryLabel}</span>
      {secondaryTopics.map((topic, index) => {
        const position = secondaryPositions[index % secondaryPositions.length];
        return <span className="science-satellite-node" key={`${index}-${topic.title}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} title={topic.text}>{topic.title}</span>;
      })}
    </div>
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
        <div className="home-preview-heading"><div><p className="section-kicker light">{copy["home.legacyKicker"]}</p><h2>{copy["home.legacyTitle"]}</h2></div><p>{content.homeLegacyIntro}</p></div>
        <ScientificStoryMap
          threads={content.legacyThreads}
          highlights={content.homeLegacyCards}
          secondaryTopics={content.secondaryLegacyTopics}
          primaryLabel={copy["home.legacyMapPrimary"]}
          secondaryLabel={copy["home.legacyMapSecondary"]}
          hint={copy["home.legacyMapHint"]}
        />
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
