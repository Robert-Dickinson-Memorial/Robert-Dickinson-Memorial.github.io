import { BookOpen, Quote } from "lucide-react";
import Link from "next/link";
import ContributionForm from "../contribution-form";
import MemoryWall from "../memory-wall";
import { InteriorHero, SiteFooter, SiteNav } from "../site-chrome";
import { getSiteContent } from "../site-data";

export const dynamic = "force-dynamic";

export default async function MemoriesPage() {
  const content = await getSiteContent();
  const copy = content.pageCopy;
  return <main className="interior-page" data-body-font={content.bodyFont} data-heading-font={content.headingFont}><SiteNav active="memories" /><InteriorHero kicker={copy["memories.heroKicker"]} title={copy["memories.heroTitle"]} intro={copy["memories.heroIntro"]} />
    <section className="memories-section memories-page-wall"><div className="memories-heading"><div><p className="section-kicker">{copy["memories.sectionKicker"]}</p><h2>{copy["memories.sectionTitle"]}</h2></div><Link className="book-button dark-book-button" href="/memory-book"><BookOpen size={17} /> {copy["memories.bookButton"]}</Link></div><MemoryWall copy={copy} /></section>
    <section id="share" className="share-section"><div className="share-copy"><Quote size={36} strokeWidth={1.4} /><p className="section-kicker light">{copy["memories.shareKicker"]}</p><h2>{copy["memories.shareTitle"]}</h2><p>{copy["memories.shareText"]}</p><div className="moderation-note">{copy["memories.moderation"]}</div></div><ContributionForm copy={copy} /></section>
    <SiteFooter />
  </main>;
}
