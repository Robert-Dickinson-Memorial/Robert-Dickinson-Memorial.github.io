import { ArrowRight, CalendarDays, Images, MessageSquareText, Sprout, Globe2, Waves, ChartNoAxesColumnIncreasing, Settings, Satellite, GraduationCap } from "lucide-react";
import Link from "next/link";
import { env } from "cloudflare:workers";
import { SiteFooter, SiteNav } from "./site-chrome";
import {
  getPublishedEvents,
  getPublishedGallery,
  getSiteContent,
  type HomeLegacyCard,
  type LegacyThread,
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
function HomeThreads({ threads, label, hint }: { threads: LegacyThread[]; label: string; hint: string }) {
  return <div className="home-earth-map">
    <div className="home-map-heading"><h3>{label}</h3><p>{hint}</p></div>
    <div className="home-earth-layout">
      <figure className="home-earth"><div className="home-earth-orbit"><img src="/home-earth.jpg" alt="Earth, NASA Blue Marble composite" loading="lazy" /></div><figcaption>NASA / Earth Observatory</figcaption></figure>
      {threads.map((thread,index) => {const Icon=threadIcons[index % threadIcons.length];return <article className={`home-thread-card home-thread-card-${index+1}`} key={thread.id}><span className="home-line-icon"><Icon size={28} strokeWidth={1.5}/></span><div><h4>{thread.title}</h4><p>{thread.text}</p></div></article>;})}
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
  const introduction = content.obituaryStory.split(/\n\s*\n/).filter(Boolean).slice(0, 2);
  const eventsText = events.length
    ? (events.length === 1 ? copy["home.eventsCountOne"] : copy["home.eventsCountMany"].replace("{count}", String(events.length)))
    : copy["home.eventsEmpty"];
  const galleryText = gallery.length
    ? (gallery.length === 1 ? copy["home.galleryCountOne"] : copy["home.galleryCountMany"].replace("{count}", String(gallery.length)))
    : copy["home.galleryEmpty"];

  return (
    <main className="home-redesign" data-body-font={content.bodyFont} data-heading-font={content.headingFont}>
      <SiteNav active="home" />
      <header id="top" className={`hero hero-portrait-${content.siteAssets.portrait.layout === "portrait" ? "portrait" : "landscape"}`}>
        <img className="hero-art" src={assetUrl(content.siteAssets.horizon)} alt={content.siteAssets.horizon.alt} aria-hidden={!content.siteAssets.horizon.alt} />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow">{copy["home.heroEyebrow"]}</p>
          <h1>{copy["home.heroNameLine1"]}{" "}<em>{copy["home.heroNameLine2"]}</em></h1>
          <p className="life-dates">{copy["home.lifeDates"]}</p>
          <p className="hero-intro">{content.heroIntro}</p>
          <Link className="scroll-cue" href="/life">{copy["home.readStory"]} <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        <figure className="portrait-card">
          <img src={assetUrl(content.siteAssets.portrait)} alt={content.siteAssets.portrait.alt} />

        </figure>
      </header>

      <section className="tribute-actions" aria-labelledby="tribute-actions-title">
        <div className="tribute-actions-copy"><p className="section-kicker">{copy["home.tributeKicker"]}</p><h2 id="tribute-actions-title">{copy["home.tributeTitle"]}</h2><p>{copy["home.tributeParticipationIntro"]}</p></div>
        <div className="tribute-action-grid">
          <Link className="tribute-action-card tree-card" href="/tree"><span className="tribute-action-icon"><Sprout size={28} /></span><span><small>{copy["home.treeKicker"]}</small><strong>{copy["home.treeTitle"]}</strong><em>{copy["home.treeText"]}</em>{participation && <span className="tribute-participation tribute-participation-prominent"><strong>{participation.trees}</strong> {participation.trees === 1 ? "tree dedicated" : "trees dedicated"} in Robert’s memory{participation.restorationGifts > 0 ? ` · ${participation.restorationGifts} additional restoration ${participation.restorationGifts === 1 ? "gift" : "gifts"}` : ""}</span>}<b>{copy["home.treeCta"]}</b></span></Link>
          <Link className="tribute-action-card memory-card-cta" href="/memories/#share"><span className="tribute-action-icon"><MessageSquareText size={28} /></span><span><small>{copy["home.shareMemoryKicker"]}</small><strong>{copy["home.shareMemoryTitle"]}</strong><em>{copy["home.shareMemoryText"]}</em>{participation && <span className="tribute-participation"><strong>{participation.memories}</strong> {participation.memories === 1 ? "memory shared" : "memories shared"}</span>}<b>{copy["home.shareMemoryCta"]}</b></span></Link>
        </div>
      </section>

      <figure className="home-quote-band"><blockquote>{copy["home.portraitQuote"]}</blockquote><figcaption>{copy["home.portraitCaption"]}</figcaption></figure>

      <section className="home-legacy-preview">
        <div className="home-preview-heading home-preview-heading-integrated">
          <div className="home-legacy-title-block"><p className="section-kicker light">{copy["home.legacyKicker"]}</p><h2>{copy["home.legacyTitle"]}</h2></div>
          <div className="home-legacy-copy-block">
            <div className="home-legacy-intro-block"><p>{content.homeLegacyIntro}</p></div>
          </div>
          <div className="home-thread-visual">
            <HomeThreads threads={content.legacyThreads} label={copy["home.legacyMapPrimary"]} hint={copy["home.legacyMapHint"]} />
            <OtherFrontiers topics={content.homeFrontierLabels} label={copy["home.legacyMapSecondary"]} />
          </div>
        </div>
        <ScientificLegacyStory highlights={content.homeLegacyCards} />
        <Link className="light-button" href="/legacy">{copy["home.legacyCta"]} <ArrowRight size={17} /></Link>
      </section>

      <section className="home-story-preview">
        <div><p className="section-kicker">{copy["home.storyKicker"]}</p><h2>{copy["home.storyTitleLine1"]}<br />{copy["home.storyTitleLine2"]}</h2><span>{copy["home.storyYears"]}</span></div>
        <div className="home-story-copy">{introduction.map((paragraph, index) => <p className={index === 0 ? "lead" : undefined} key={paragraph.slice(0, 30)}>{paragraph}</p>)}<Link className="text-link" href="/life">{copy["home.storyReadLink"]} <ArrowRight size={16} /></Link></div>
      </section>

      <section className="home-community">
        <div className="home-community-heading"><p className="section-kicker">{copy["home.communityKicker"]}</p><h2>{copy["home.communityTitle"]}</h2><p>{copy["home.communityIntro"]}</p></div>
        <div className="home-community-grid">
          <Link href="/events"><CalendarDays size={25} /><small>{copy["home.eventsKicker"]}</small><h3>{copy["home.eventsTitle"]}</h3><p>{eventsText}</p>{events[0] && <div className="home-event-preview"><time dateTime={events[0].startAt}>{new Intl.DateTimeFormat("en-US", {month:"short",day:"numeric",timeZone:"America/Los_Angeles"}).format(new Date(events[0].startAt))}</time><div><strong>{events[0].title}</strong><span>{events[0].location?.split("\n")[0]}</span></div></div>}<b>{copy["home.eventsCta"]}</b></Link>
          <Link href="/gallery"><Images size={25} /><small>{copy["home.galleryKicker"]}</small><h3>{copy["home.galleryTitle"]}</h3><p>{galleryText}</p><div className="home-gallery-strip">{gallery.filter(item => item.kind === "image" && item.objectKey).slice(0,4).map(item => <img key={item.id} src={`/api/gallery/photos/${item.objectKey!.split("/").map(encodeURIComponent).join("/")}`} alt={item.title} loading="lazy" />)}</div><b>{copy["home.galleryCta"]}</b></Link>
          <Link href="/memories"><MessageSquareText size={25} /><small>{copy["home.memoriesKicker"]}</small><h3>{copy["home.memoriesTitle"]}</h3><p>{copy["home.memoriesText"]}</p><b>{copy["home.memoriesCta"]}</b></Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
