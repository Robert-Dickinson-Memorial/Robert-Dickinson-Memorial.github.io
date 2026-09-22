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
  title: string;
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
    env.DB.prepare(`SELECT id, name, title, photo_key AS photoKey FROM memories WHERE status = 'approved' ORDER BY created_at DESC, id DESC`).all<PublishedMemory>(),
  ]) : [{ results: [] }, { results: [] }, { results: [] }, { results: [] }];

  return (
    <main className="manage-shell">
      <header className="manage-header">
        <Link className="review-back" href={PUBLIC_MEMORIAL_URL}><ArrowLeft size={17} /> Return to the memorial</Link>
        <p className="section-kicker">Private memorial editor</p><h1>Manage the memorial</h1>
        <p>Edit the public memorial directly: typography, biographical text, affiliations, scientific chapters, chapter photographs, honors, events, and gallery media.</p>
        <nav className="manager-nav"><a href="#edit-style">Typography</a><a href="#edit-story">Story</a><a href="#edit-home-legacy">Homepage legacy</a><a href="#edit-life">His Life</a><a href="#edit-legacy">Scientific chapters</a><a href="#edit-honors">Honors</a><a href="#edit-events">Events</a><a href="#edit-gallery">Photos & videos</a>{isOwnerEmail(user.email) && <a href="#edit-access">Editor access</a>}<a href="/review"><MessageSquareText size={16} /> Review memories</a><a href="/memory-book"><BookOpen size={16} /> Preview book</a></nav>
      </header>
      <Manager content={content} events={eventResult.results ?? []} media={mediaResult.results ?? []} publishedMemories={memoryResult.results ?? []} editors={editorResult.results ?? []} owner={isOwnerEmail(user.email)} />
    </main>
  );
}
