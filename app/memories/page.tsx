import { BookOpen, Quote } from "lucide-react";
import Link from "next/link";
import ContributionForm from "../contribution-form";
import MemoryWall from "../memory-wall";
import { InteriorHero, SiteFooter, SiteNav } from "../site-chrome";

export const dynamic = "force-dynamic";

export default function MemoriesPage() {
  return <main className="interior-page"><SiteNav active="memories" /><InteriorHero kicker="From the community" title="Memories, in many voices" intro="Stories from Robert’s students, postdoctoral scholars, colleagues, friends, and family—shared here after review." />
    <section className="memories-section memories-page-wall"><div className="memories-heading"><div><p className="section-kicker">Remembering Robert</p><h2>Stories that carry forward</h2></div><Link className="book-button dark-book-button" href="/memory-book"><BookOpen size={17} /> Open the memory book</Link></div><MemoryWall /></section>
    <section id="share" className="share-section"><div className="share-copy"><Quote size={36} strokeWidth={1.4} /><p className="section-kicker light">Add your voice</p><h2>Share a memory</h2><p>A conversation after seminar. A line of code he helped untangle. The question that changed your research. Small stories often reveal the truest measure of a mentor’s life.</p><div className="moderation-note">Every submission and photograph is reviewed before appearing publicly.</div></div><ContributionForm /></section>
    <SiteFooter />
  </main>;
}
