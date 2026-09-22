import { ArrowLeft, ExternalLink, Leaf, Sprout } from "lucide-react";
import Link from "next/link";
import { getSiteContent } from "../site-data";

export const dynamic = "force-dynamic";

export default async function TreeDedicationPage() {
  const content = await getSiteContent();
  const copy = content.pageCopy;
  return (
    <main className="tree-page" data-body-font={content.bodyFont} data-heading-font={content.headingFont}>
      <nav className="site-nav" aria-label="Main navigation">
        <Link className="wordmark" href="/#top" aria-label="Robert Dickinson memorial home"><span className="wordmark-mark">∞</span><span>{copy["global.wordmark"]}</span></Link>
        <div className="nav-links"><Link href="/life">{copy["nav.life"]}</Link><Link href="/legacy">{copy["nav.legacy"]}</Link><Link href="/events">{copy["nav.events"]}</Link><Link href="/gallery">{copy["nav.gallery"]}</Link><Link href="/memories">{copy["nav.memories"]}</Link></div>
      </nav>
      <header id="top" className="tree-page-hero">
        <div><p className="section-kicker light">{copy["tree.heroKicker"]}</p><h1>{copy["tree.heroTitle"]}</h1><p>{copy["tree.heroText"]}</p><a className="tree-primary-action" href={copy["tree.dedicationUrl"]} target="_blank" rel="noopener noreferrer"><Sprout size={19} /> {copy["tree.heroCta"]} <ExternalLink size={15} /></a><small>{copy["tree.heroNote"]}</small></div>
        <aside className="tree-hero-card"><Leaf size={42} aria-hidden="true" /><strong>{copy["tree.heroCardName"]}</strong><em>{copy["tree.heroCardDates"]}</em><p>{copy["tree.heroCardText"]}</p></aside>
      </header>
      <section className="tree-how" aria-labelledby="tree-how-title"><div className="tree-section-heading"><p className="section-kicker">{copy["tree.howKicker"]}</p><h2 id="tree-how-title">{copy["tree.howTitle"]}</h2><p>{copy["tree.howIntro"]}</p></div><div className="tree-step-grid"><article><span>01</span><h3>{copy["tree.step1Title"]}</h3><p>{copy["tree.step1Text"]}</p></article><article><span>02</span><h3>{copy["tree.step2Title"]}</h3><p>{copy["tree.step2Text"]}</p></article><article><span>03</span><h3>{copy["tree.step3Title"]}</h3><p>{copy["tree.step3Text"]}</p></article></div></section>
      <section className="tree-project"><div><p className="section-kicker light">{copy["tree.projectKicker"]}</p><h2>{copy["tree.projectTitle"]}</h2><p>{content.treeTribute} {content.treeDetail}</p><a href={copy["tree.projectUrl"]} target="_blank" rel="noopener noreferrer">{copy["tree.projectLink"]} <ExternalLink size={15} /></a></div><div className="tree-project-note"><strong>{copy["tree.noteTitle"]}</strong><p>{copy["tree.noteText"]}</p></div></section>
      <section className="tree-faq" aria-labelledby="tree-faq-title"><div className="tree-section-heading"><p className="section-kicker">{copy["tree.faqKicker"]}</p><h2 id="tree-faq-title">{copy["tree.faqTitle"]}</h2></div><details open><summary>{copy["tree.faq1Q"]}</summary><p>{copy["tree.faq1A"]}</p></details><details><summary>{copy["tree.faq2Q"]}</summary><p>{copy["tree.faq2A"]}</p></details><details><summary>{copy["tree.faq3Q"]}</summary><p>{copy["tree.faq3A"]}</p></details><details><summary>{copy["tree.faq4Q"]}</summary><p>{copy["tree.faq4A"]}</p></details></section>
      <section className="tree-final-cta"><Sprout size={42} aria-hidden="true" /><h2>{copy["tree.finalTitle"]}</h2><p>{copy["tree.finalText"]}</p><a className="tree-primary-action" href={copy["tree.dedicationUrl"]} target="_blank" rel="noopener noreferrer">{copy["tree.finalCta"]} <ExternalLink size={15} /></a></section>
      <footer className="site-footer"><div className="wordmark footer-mark"><span className="wordmark-mark">∞</span><span>{copy["global.footerName"]}</span></div><p>{copy["global.footerText"]}</p><div className="footer-links"><Link href="/"><ArrowLeft size={14} /> {copy["tree.footerReturn"]}</Link></div></footer>
    </main>
  );
}
