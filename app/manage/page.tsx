import { env } from "cloudflare:workers";
import { ArrowLeft, BookOpen, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { requireChatGPTUser } from "../chatgpt-auth";
import { isEditorEmail, isOwnerEmail } from "../moderation";
import { GalleryItem, getSiteContent, MemorialEvent } from "../site-data";
import Manager from "./manager";

export const dynamic = "force-dynamic";

const PUBLIC_MEMORIAL_URL = "https://robert-dickinson-memorial.github.io/";

type PublishedMemory = {
  id: number;
  name: string;
  relationship: string;
  title: string;
  story: string;
  photoKey: string | null;
};

export default async function ManagePage() {
  const user = await requireChatGPTUser("/manage");
  if (!await isEditorEmail(user.email)) {
    return <main className="review-shell"><Link className="review-back" href={PUBLIC_MEMORIAL_URL}><ArrowLeft size={17} /> Return to the memorial</Link><section className="review-denied"><h1>Editor access required</h1><p>This area is limited to approved memorial editors.</p></section></main>;
  }
  const content = await getSiteContent();
  const [eventResult, mediaResult, editorResult, memoryResult] = env.DB ? await Promise.all([
    env.DB.prepare(`SELECT id, title, start_at AS startAt, end_at AS endAt, location, description, link_label AS linkLabel, link_url AS linkUrl FROM events ORDER BY start_at ASC`).all<MemorialEvent>(),
    env.DB.prepare(`SELECT id, kind, title, caption, object_key AS objectKey, external_url AS externalUrl, created_at AS createdAt FROM gallery_items ORDER BY created_at DESC`).all<GalleryItem>(),
    env.DB.prepare(`SELECT email, display_name AS displayName, created_at AS createdAt FROM memorial_editors ORDER BY created_at ASC`).all<{ email: string; displayName: string | null; createdAt: string }>(),
    env.DB.prepare(`SELECT id, name, relationship, title, story, photo_key AS photoKey
                    FROM memories WHERE status = 'approved' ORDER BY created_at DESC, id DESC`).all<PublishedMemory>(),
  ]) : [{ results: [] }, { results: [] }, { results: [] }, { results: [] }];

  return (
    <main id="manage-top" className="manage-shell">
      <header className="manage-header">
        <Link className="review-back" href={PUBLIC_MEMORIAL_URL}><ArrowLeft size={17} /> Return to the memorial</Link>
        <p className="section-kicker">Private memorial editor</p><h1>Manage the memorial</h1>
        <p>Use the same page names and section names as the public memorial below. Choose a public page first, then edit its text, images, or structured content.</p>
      </header>
      <div className="manager-nav-dock" aria-label="Management sections">
        <nav className="manager-nav"><a href="#edit-home">Home</a><a href="#edit-life">His life</a><a href="#edit-legacy">Scientific legacy</a><a href="#edit-events">Events</a><a href="#edit-gallery">Gallery</a><a href="#edit-memories">Memories</a><a href="#edit-tree-content">Living tribute</a><a href="#edit-memory-book"><BookOpen size={16} /> Memory book</a><a href="#edit-style">Site-wide settings</a>{isOwnerEmail(user.email) && <a href="#edit-access">Editor access</a>}<a href="/review"><MessageSquareText size={16} /> Review memories</a></nav>
      </div>
      <Manager content={content} events={eventResult.results ?? []} media={mediaResult.results ?? []} publishedMemories={memoryResult.results ?? []} editors={editorResult.results ?? []} owner={isOwnerEmail(user.email)} />
      <a className="manager-return-top" href="#manage-top">Return to top ↑</a>
    </main>
  );
}
