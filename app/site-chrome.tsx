import Link from "next/link";
import { getChatGPTUser } from "./chatgpt-auth";
import { isEditorEmail, isOwnerEmail } from "./moderation";
import { getSiteContent, type SiteAssets } from "./site-data";

export async function SiteNav({ active }: { active?: string }) {
  const content = await getSiteContent();
  const copy = content.pageCopy;
  const links = [
    { href: "/", label: copy["nav.home"], key: "home" },
    { href: "/life", label: copy["nav.life"], key: "life" },
    { href: "/legacy", label: copy["nav.legacy"], key: "legacy" },
    { href: "/events", label: copy["nav.events"], key: "events" },
    { href: "/gallery", label: copy["nav.gallery"], key: "gallery" },
    { href: "/memories/", label: copy["nav.memories"], key: "memories" },
    { href: "/tree", label: copy["nav.tree"], key: "tree" },
  ];
  return (
    <nav className="site-nav" aria-label="Main navigation">
      <Link className="wordmark" href="/" aria-label="Return to the Robert Dickinson memorial home" title="Memorial home"><span className="wordmark-mark" aria-hidden="true">∞</span><span>{copy["global.wordmark"]}</span></Link>
      <div className="nav-links">{links.map((link) => <Link className={[active === link.key ? "active" : "", link.key === "memories" ? "nav-memory-cta" : link.key === "tree" ? "nav-tree-cta" : ""].filter(Boolean).join(" ") || undefined} aria-current={active === link.key ? "page" : undefined} href={link.href} key={link.key}>{link.label}</Link>)}</div>
      <details className="mobile-nav"><summary>Menu <span aria-hidden="true">☰</span></summary><div className="mobile-nav-panel">{links.map((link) => <Link className={[active === link.key ? "active" : "", link.key === "memories" ? "nav-memory-cta" : link.key === "tree" ? "nav-tree-cta" : ""].filter(Boolean).join(" ") || undefined} aria-current={active === link.key ? "page" : undefined} href={link.href} key={link.key}>{link.label}</Link>)}</div></details>
    </nav>
  );
}

async function ReviewLink() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const editor = await isEditorEmail(user.email);
  const owner = isOwnerEmail(user.email);
  if (!editor && !owner) return null;
  return <>{editor && <a href="/manage">Manage memorial</a>}{owner && <a href="/review">Review submissions</a>}</>;
}

export async function SiteFooter() {
  const content = await getSiteContent();
  const copy = content.pageCopy;
  return (
    <footer className="site-footer">
      <Link className="wordmark footer-mark" href="/"><span className="wordmark-mark" aria-hidden="true">∞</span><span>{copy["global.footerName"]}</span></Link>
      <p>{copy["global.footerText"]}</p>
      <div className="footer-links"><ReviewLink /><Link href="/">{copy["global.footerHome"]}</Link><a href="#page-top">{copy["global.footerTop"]}</a></div>
    </footer>
  );
}

export function SharedHeroArt({ assets }: { assets: SiteAssets }) {
  const url = (asset: SiteAssets["portrait"]) => asset.objectKey
    ? `/api/site-assets/${asset.objectKey.split("/").map(encodeURIComponent).join("/")}`
    : `/${asset.asset.replace(/^\//, "")}`;
  return <><img className="shared-hero-background" src={url(assets.horizon)} alt="" aria-hidden="true" /><figure className="shared-hero-portrait"><img src={url(assets.portrait)} alt={assets.portrait.alt} fetchPriority="high" /></figure></>;
}

export function InteriorHero({ kicker, title, intro, assets }: { kicker: string; title: string; intro: string; assets?: SiteAssets }) {
  if (assets) return <header className="interior-hero shared-portrait-hero"><div className="shared-hero-inner"><div className="shared-hero-copy"><p className="section-kicker">{kicker}</p><h1>{title}</h1><p className="shared-hero-intro">{intro}</p></div><SharedHeroArt assets={assets} /></div></header>;
  return <header className="interior-hero"><p className="section-kicker light">{kicker}</p><h1>{title}</h1><p>{intro}</p></header>;
}
