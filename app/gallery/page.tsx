import GallerySection from "../gallery-section";
import { SiteFooter, SiteNav } from "../site-chrome";
import { getPublishedGallery, getSiteContent } from "../site-data";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const [gallery, content] = await Promise.all([getPublishedGallery(), getSiteContent()]);
  const copy = content.pageCopy;
  return <main id="page-top" className="interior-page gallery-page gallery-redesign" data-body-font={content.bodyFont} data-heading-font={content.headingFont}><SiteNav active="gallery" />
    <header className="interior-hero"><div className="gallery-hero-meta"><p className="section-kicker light">{copy["gallery.heroKicker"]}</p><a className="book-button" href="/memory-book">▥ {copy["gallery.bookButton"]}</a></div><h1>{copy["gallery.heroTitle"]}</h1><p>{copy["gallery.heroIntro"]}</p></header>
    <GallerySection items={gallery} copy={copy} /><SiteFooter />
  </main>;
}
