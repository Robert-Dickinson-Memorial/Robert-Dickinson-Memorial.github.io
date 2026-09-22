import GallerySection from "../gallery-section";
import { InteriorHero, SiteFooter, SiteNav } from "../site-chrome";
import { getPublishedGallery } from "../site-data";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const gallery = await getPublishedGallery();
  return <main className="interior-page"><SiteNav active="gallery" /><InteriorHero kicker="Photos & film" title="A life remembered in images" intro="Photographs and recordings from Robert’s life, scientific work, collaborations, and community." /><GallerySection items={gallery} /><SiteFooter /></main>;
}
