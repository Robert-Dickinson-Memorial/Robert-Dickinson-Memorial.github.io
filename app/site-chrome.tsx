import Link from "next/link";
import { getChatGPTUser } from "./chatgpt-auth";
import { isEditorEmail, isOwnerEmail } from "./moderation";
import { getSiteContent } from "./site-data";

export async function SiteNav({ active }: { active?: string }) {
  const content = await getSiteContent();
  const copy = content.pageCopy;
  const links = [
    { href: "/", label: copy["nav.home"], key: "home" },
    { href: "/life", label: copy["nav.life"], key: "life" },
    { href: "/legacy", label: copy["nav.legacy"], key: "legacy" },
    { href: "/tree", label: copy["nav.tree"], key: "tree" },
    { href: "/events", label: copy["nav.events"], key: "events" },
    { href: "/gallery", label: copy["nav.gallery"], key: "gallery" },
    { href: "/memories", label: copy["nav.memories"], key: "memories" },
  ];
  return (
    <nav className="site-nav" aria-label="Main navigation">
      <Link className="wordmark" href="/" aria-label="Return to the Robert Dickinson memorial home" title="Memorial home"><span className="wordmark-mark">∞</span><span>{copy["global.wordmark"]}</span></Link>
      <div className="nav-links">{links.map((link) => <Link className={active === link.key ? "active" : undefined} href={link.href} key={link.key}>{link.label}</Link>)}</div>
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
      <Link className="wordmark footer-mark" href="/"><span className="wordmark-mark">∞</span><span>{copy["global.footerName"]}</span></Link>
      <p>{copy["global.footerText"]}</p>
      <div className="footer-links"><ReviewLink /><Link href="/">{copy["global.footerHome"]}</Link></div>
    </footer>
  );
}

export function InteriorHero({ kicker, title, intro }: { kicker: string; title: string; intro: string }) {
  return <header className="interior-hero"><p className="section-kicker light">{kicker}</p><h1>{title}</h1><p>{intro}</p></header>;
}
