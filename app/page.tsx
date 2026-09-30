import { ArrowRight, CalendarDays, Images, MessageSquareText, Sprout, Globe2, Waves, Settings, Satellite, ChartNoAxesColumnIncreasing, GraduationCap } from "lucide-react";
import Link from "next/link";
import { env } from "cloudflare:workers";
import { SharedHeroArt, SiteFooter, SiteNav } from "./site-chrome";
import {
  getPublishedEvents,
  getPublishedGallery,
  getSiteContent,
  type HomeLegacyCard,
  type LegacyThread,
} from "./site-data";

export const dynamic = "force-dynamic";

function ScientificLegacyStory({
  highlights,
}: {
  highlights: HomeLegacyCard[];
}) {
  return <div className="home-science-story">
    <div className="science-highlight-stream">
      {highlights.map((highlight, index) => {const Icon = contributionIcons[index % contributionIcons.length]; return <article className="science-highlight" key={`${index}-${highlight.title}`}>
        <Icon className="home-contribution-icon" size={32} strokeWidth={1.5} aria-hidden="true" />
        <h3>{highlight.title}</h3>
        <p>{highlight.text}</p>
      </article>;})}
    </div>

  </div>;
}

const threadIcons = [Waves, ChartNoAxesColumnIncreasing, Settings, Sprout, Satellite, Globe2];
const contributionIcons = [Globe2, ChartNoAxesColumnIncreasing, Sprout, GraduationCap];
function HomeThreads({ threads }: { threads: LegacyThread[] }) {
  return <div className="home-earth-map">
    <div className="home-earth-layout">
      <figure className="home-earth"><div className="home-earth-orbit"><svg className="home-thread-ring" viewBox="0 0 300 300" aria-hidden="true"><circle className="thread-orbit-line" cx="150" cy="150" r="140" /><circle className="thread-orbit-dot" cx="42.75" cy="60" r="4" /><circle className="thread-orbit-dot" cx="10" cy="150" r="4" /><circle className="thread-orbit-dot" cx="42.75" cy="240" r="4" /><circle className="thread-orbit-dot" cx="257.25" cy="60" r="4" /><circle className="thread-orbit-dot" cx="290" cy="150" r="4" /><circle className="thread-orbit-dot" cx="257.25" cy="240" r="4" /></svg><img src="/home-earth.jpg" alt="Earth, NASA Blue Marble composite" loading="lazy" /></div></figure>
      {threads.map((thread,index) => {const Icon=threadIcons[index % threadIcons.length];return <article className={`home-thread-card home-thread-card-${index+1}`} key={thread.id}><span className="home-line-icon" aria-hidden="true"><Icon size={28} strokeWidth={1.5} /></span><div><h4>{thread.title}</h4><p>{thread.text}</p></div></article>;})}
    </div>
  </div>;
}

function OtherFrontiers({ topics, label }: { topics: string[]; label: string }) {
  return <div className="science-secondary-band science-secondary-band-home">
    <div className="science-secondary-intro"><span className="science-secondary-label">{label === "Other frontiers" ? "Other frontiers with pioneer contribution" : label}</span></div>
    <div className="science-secondary-terms">
      {topics.filter((topic) => topic.trim()).map((topic, index) => <span key={index}>{topic}</span>)}
    </div>
  </div>;
}


export default async function Home() {
  const [content, events, gallery, participation] = await Promise.all([getSiteContent(), getPublishedEvents(), getPublishedGallery(), (async () => {
    try {
      if (!env.DB) return null;
      const [memories, trees, restorationGifts] = await Promise.all([
        env.DB.prepare("SELECT COUNT(*) AS total FROM memories WHERE status = 'approved'").first<{ total: number }>(),
        env.DB.prepare("SELECT COALESCE(SUM(reported_tree_count), 0) AS total FROM tree_dedications WHERE status = 'approved' AND contribution_type = 'tree' AND payment_confirmed = 1").first<{ total: number }>(),
        env.DB.prepare("SELECT COUNT(*) AS total FROM tree_dedications WHERE status = 'approved' AND contribution_type = 'restoration' AND payment_confirmed = 1").first<{ total: number }>(),
      ]);
      return { memories: Number(memories?.total ?? 0), trees: Number(trees?.total ?? 0), restorationGifts: Number(restorationGifts?.total ?? 0) };
    } catch { return null; }
  })()]);
  const copy = content.pageCopy;

  return (
    <main id="page-top" className="home-redesign" data-body-font={content.bodyFont} data-heading-font={content.headingFont}>
      <SiteNav active="home" />
      <header id="top" className="hero shared-portrait-hero"><div className="shared-hero-inner">
        <div className="hero-copy shared-hero-copy">
          <p className="eyebrow">{copy["home.heroEyebrow"]}</p>
          <h1>{copy["home.heroNameLine1"]}{" "}<em>{copy["home.heroNameLine2"]}</em></h1>
          <p className="life-dates">{copy["home.lifeDates"]}</p>
          <p className="hero-intro">{content.heroIntro}</p>
          <Link className="scroll-cue" href="/life">{copy["home.readStory"]} <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        <SharedHeroArt assets={content.siteAssets} />
      <figure className="home-quote-band"><blockquote>{copy["home.portraitQuote"]}</blockquote><figcaption>{copy["home.portraitCaption"]}</figcaption></figure>
      </div>      </header>

      <section className="tribute-actions" aria-labelledby="tribute-actions-title">
        <div className="tribute-actions-copy"><p className="section-kicker">{copy["home.tributeKicker"]}</p><h2 id="tribute-actions-title">{copy["home.tributeTitle"]}</h2></div>
        <div className="tribute-action-grid">
          <Link className="tribute-action-card tree-card" href="/tree"><span className="tribute-action-icon"><Sprout size={28} /></span><span><small>{copy["home.treeKicker"]}</small><strong>{copy["home.treeTitle"]}</strong><em>{copy["home.treeText"]}</em>{participation && <span className="tribute-participation tribute-participation-prominent"><strong>{participation.trees}</strong> {participation.trees === 1 ? "tree dedicated" : "trees dedicated"} in Robert’s memory{participation.restorationGifts > 0 ? ` · ${participation.restorationGifts} additional restoration ${participation.restorationGifts === 1 ? "gift" : "gifts"}` : ""}</span>}<b>{copy["home.treeCta"]}</b></span></Link>
          <Link className="tribute-action-card memory-card-cta" href="/memories/#share"><span className="tribute-action-icon"><MessageSquareText size={28} /></span><span><small>{copy["home.shareMemoryKicker"]}</small><strong>{copy["home.shareMemoryTitle"]}</strong><em>{copy["home.shareMemoryText"]}</em>{participation && <span className="tribute-participation"><strong>{participation.memories}</strong> {participation.memories === 1 ? "memory shared" : "memories shared"}</span>}<b>{copy["home.shareMemoryCta"]}</b></span></Link>
        </div>
      </section>


      <section className="home-legacy-preview">
        <div className="home-preview-heading home-preview-heading-integrated">
          <div className="home-legacy-title-block"><p className="section-kicker light">{copy["home.legacyKicker"]}</p><h2>{copy["home.legacyTitle"]}</h2></div>
          <div className="home-legacy-copy-block">
            <div className="home-legacy-intro-block"><p>{content.homeLegacyIntro}</p></div>
          </div>
          <div className="home-map-heading"><h3>{copy["home.legacyIdeasTitle"]}</h3><p>{copy["home.legacyMapHint"]}</p></div>
          <div className="home-thread-visual">
            <HomeThreads threads={content.legacyThreads} />
            <OtherFrontiers topics={content.homeFrontierLabels} label={copy["home.legacyMapSecondary"]} />
          </div>
        </div>
        <h3 className="home-impact-heading">{copy["home.legacyImpactTitle"]}</h3>
        <ScientificLegacyStory highlights={content.homeLegacyCards} />
        <Link className="light-button" href="/legacy">{copy["home.legacyCta"]} <ArrowRight size={17} /></Link>
      </section>

      <section className="home-community">
        <div className="home-community-grid">
          <Link href="/events"><div className="home-preview-header"><CalendarDays size={25} /><div><h3>{copy["home.eventsPreviewTitle"]}</h3><p>{copy["home.eventsPreviewIntro"]}</p></div><b>{copy["home.previewViewAll"]}</b></div>{events[0] ? <div className="home-event-preview"><time dateTime={events[0].startAt}>{["month", "day", "year"].map(part => <span key={part} className={`calendar-${part}`}>{new Intl.DateTimeFormat("en-US", { [part]: part === "month" ? "short" : "numeric", timeZone:"America/Los_Angeles" }).format(new Date(events[0].startAt))}</span>)}</time><div><strong>{events[0].title}</strong><span>{events[0].location?.split("\n")[0]}</span></div><ArrowRight size={16} /></div> : <p>{copy["home.eventsEmpty"]}</p>}</Link>
          <Link href="/gallery"><div className="home-preview-header"><Images size={25} /><div><h3>{copy["home.galleryTitle"]}</h3><p>{copy["home.galleryPreviewIntro"]}</p></div><b>{copy["home.previewViewAll"]}</b></div><div className="home-gallery-strip">{gallery.filter(item => item.kind === "image" && item.objectKey).slice(0,4).map(item => <img key={item.id} src={`/api/gallery/photos/${item.objectKey!.split("/").map(encodeURIComponent).join("/")}`} alt={item.title} loading="lazy" />)}</div></Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
