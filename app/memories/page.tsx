import { BookOpen } from "lucide-react";
import Link from "next/link";
import ContributionForm from "../contribution-form";
import MemoryWall from "../memory-wall";
import { SiteFooter, SiteNav } from "../site-chrome";
import { getSiteContent, type SiteAsset } from "../site-data";

export const dynamic = "force-dynamic";

function assetUrl(asset: SiteAsset) {
  if (asset.objectKey) return `/api/site-assets/${asset.objectKey.split("/").map(encodeURIComponent).join("/")}`;
  return `/${asset.asset.replace(/^\//, "")}`;
}

export default async function MemoriesPage() {
  const content = await getSiteContent();
  const copy = content.pageCopy;

  return <main className="interior-page memories-page" data-body-font={content.bodyFont} data-heading-font={content.headingFont}>
    <SiteNav active="memories" />

    <header id="top" className="memory-hero">
      <img
        className="memory-hero-bg"
        src={assetUrl(content.siteAssets.horizon)}
        alt={content.siteAssets.horizon.alt}
        aria-hidden={!content.siteAssets.horizon.alt}
      />
      <div className="memory-hero-shade" />
      <div className="memory-hero-inner">
        <div className="memory-hero-copy">
          <p className="section-kicker light">{copy["memories.heroKicker"]}</p>
          <h1>{copy["memories.heroTitle"]}</h1>
          <p>{copy["memories.heroIntro"]}</p>
        </div>
        <img
          className="memory-hero-portrait"
          src={assetUrl(content.siteAssets.portrait)}
          alt={content.siteAssets.portrait.alt}
        />
      </div>
    </header>

    <section id="share" className="memory-share-simple">
      <div className="memory-share-heading">
        <p className="section-kicker">{copy["memories.shareKicker"]}</p>
        <h2>{copy["memories.shareTitle"]}</h2>
        <p>{copy["memories.shareText"]}</p>
        <div className="moderation-note">{copy["memories.moderation"]}</div>
      </div>
      <ContributionForm copy={copy} />
    </section>

    <section className="memories-section memories-page-wall">
      <div className="memories-heading">
        <div>
          <p className="section-kicker">{copy["memories.sectionKicker"]}</p>
          <h2>{copy["memories.sectionTitle"]}</h2>
        </div>
        <Link className="book-button dark-book-button" href="/memory-book">
          <BookOpen size={17} /> {copy["memories.bookButton"]}
        </Link>
      </div>
      <MemoryWall copy={copy} />
    </section>

    <SiteFooter />
  </main>;
}
