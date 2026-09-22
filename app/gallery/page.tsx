import GallerySection from "../gallery-section";
import { InteriorHero, SiteFooter, SiteNav } from "../site-chrome";
import { getPublishedGallery, getSiteContent } from "../site-data";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const [gallery, content] = await Promise.all([getPublishedGallery(), getSiteContent()]);
  const copy = content.pageCopy;
  return <main className="interior-page" data-body-font={content.bodyFont} data-heading-font={content.headingFont}><SiteNav active="gallery" /><InteriorHero kicker={copy["gallery.heroKicker"]} title={copy["gallery.heroTitle"]} intro={copy["gallery.heroIntro"]} /><GallerySection items={gallery} copy={copy} /><SiteFooter /></main>;
}
