import { env } from "cloudflare:workers";
import { ArrowLeft, BookOpen, MessageSquareText } from "lucide-react";
import { requireChatGPTUser } from "../chatgpt-auth";
import { isModeratorEmail } from "../moderation";
import { GalleryItem, getSiteContent, MemorialEvent } from "../site-data";
import Manager from "./manager";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const user = await requireChatGPTUser("/manage");
  if (!isModeratorEmail(user.email)) {
    return <main className="review-shell"><a className="review-back" href="/"><ArrowLeft size={17} /> Return to the memorial</a><section className="review-denied"><h1>Editor access required</h1><p>This area is limited to approved memorial editors.</p></section></main>;
  }
  const content = await getSiteContent();
  const [eventResult, mediaResult] = env.DB ? await Promise.all([
    env.DB.prepare(`SELECT id, title, start_at AS startAt, end_at AS endAt, location, description, link_label AS linkLabel, link_url AS linkUrl FROM events ORDER BY start_at ASC`).all<MemorialEvent>(),
    env.DB.prepare(`SELECT id, kind, title, caption, object_key AS objectKey, external_url AS externalUrl, created_at AS createdAt FROM gallery_items ORDER BY created_at DESC`).all<GalleryItem>(),
  ]) : [{ results: [] }, { results: [] }];

  return (
    <main className="manage-shell">
      <header className="manage-header">
        <a className="review-back" href="/"><ArrowLeft size={17} /> Return to the memorial</a>
        <p className="section-kicker">Private memorial editor</p><h1>Manage the memorial</h1>
        <p>Edit the obituary, publish events, and add photographs or videos without changing the website code.</p>
        <nav className="manager-nav"><a href="#edit-story">Edit story</a><a href="#edit-events">Events</a><a href="#edit-gallery">Photos & videos</a><a href="/review"><MessageSquareText size={16} /> Review memories</a><a href="/memory-book"><BookOpen size={16} /> Preview book</a></nav>
      </header>
      <Manager content={content} events={eventResult.results ?? []} media={mediaResult.results ?? []} />
    </main>
  );
}
