import { BookOpen, Quote } from "lucide-react";
import Link from "next/link";
import MemorySharePanel from "../memory-share-panel";
import ContributionForm from "../contribution-form";
import MemoryWall from "../memory-wall";
import { InteriorHero, SiteFooter, SiteNav } from "../site-chrome";
import { getSiteContent } from "../site-data";

export const dynamic = "force-dynamic";

export default async function MemoriesPage() {
  const content = await getSiteContent();
  const copy = content.pageCopy;
  return <main className="interior-page memories-page memory-redesign" data-body-font={content.bodyFont} data-heading-font={content.headingFont}><SiteNav active="memories" /><header className="interior-hero memory-designed-hero"><div><p className="section-kicker light">{copy["memories.heroKicker"]}</p><h1>{copy["memories.heroTitle"]}</h1><p>{copy["memories.heroIntro"]}</p><a className="memory-stories-jump" href="#community-memories">{copy["memories.design.readStories"]} ↓</a></div><img src={content.siteAssets.portrait.objectKey ? `/api/site-assets/${content.siteAssets.portrait.objectKey}` : `/${content.siteAssets.portrait.asset}`} alt={content.siteAssets.portrait.alt} /></header>
    <MemorySharePanel><section className="share-section"><div className="share-copy"><Quote size={36} strokeWidth={1.4} /><p className="section-kicker light">{copy["memories.shareKicker"]}</p><h2>{copy["memories.shareTitle"]}</h2><p>{copy["memories.shareText"]}</p><div className="moderation-note">{copy["memories.moderation"]}</div></div><ContributionForm copy={copy} /></section></MemorySharePanel>
    <section id="community-memories" className="memories-section memories-page-wall"><div className="memories-heading"><div><p className="section-kicker">{copy["memories.sectionKicker"]}</p><h2>{copy["memories.sectionTitle"]}</h2></div><Link className="book-button dark-book-button" href="/memory-book"><BookOpen size={17} /> {copy["memories.bookButton"]}</Link></div><MemoryWall copy={copy} /></section>
    <SiteFooter />
  </main>;
}
