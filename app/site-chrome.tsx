import Link from "next/link";
import { getChatGPTUser } from "./chatgpt-auth";
import { isEditorEmail, isOwnerEmail } from "./moderation";

const links = [
    { href: "/", label: "Home", key: "home" },
  { href: "/life", label: "His life", key: "life" },
  { href: "/legacy", label: "Scientific legacy", key: "legacy" },
  { href: "/events", label: "Events", key: "events" },
  { href: "/gallery", label: "Gallery", key: "gallery" },
  { href: "/memories", label: "Memories", key: "memories" },
];

export function SiteNav({ active }: { active?: string }) {
  return (
    <nav className="site-nav" aria-label="Main navigation">
            <Link className="wordmark" href="/" aria-label="Return to the Robert Dickinson memorial home" title="Memorial home"><span className="wordmark-mark">∞</span><span>Robert Dickinson</span></Link>
      <div className="nav-links">{links.map((link) => <Link className={active === link.key ? "active" : undefined} href={link.href} key={link.key}>{link.label}</Link>)}</div>
      <Link className="nav-cta" href="/memories#share">Share a memory</Link>
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
  return (
    <footer className="site-footer">
      <Link className="wordmark footer-mark" href="/"><span className="wordmark-mark">∞</span><span>Robert E. Dickinson</span></Link>
      <p>Created with love by his academic community.</p>
      <div className="footer-links"><ReviewLink /><Link href="/">Memorial home ↑</Link></div>
    </footer>
  );
}

export function InteriorHero({ kicker, title, intro }: { kicker: string; title: string; intro: string }) {
  return <header className="interior-hero"><p className="section-kicker light">{kicker}</p><h1>{title}</h1><p>{intro}</p></header>;
}
