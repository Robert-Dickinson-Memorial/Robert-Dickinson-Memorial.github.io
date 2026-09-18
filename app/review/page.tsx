import { env } from "cloudflare:workers";
import { ArrowLeft, Bell, BellOff } from "lucide-react";
import { requireChatGPTUser } from "../chatgpt-auth";
import { emailNotificationsConfigured, isModeratorEmail } from "../moderation";
import ReviewQueue, { PendingMemory } from "./review-queue";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const user = await requireChatGPTUser("/review");
  if (!isModeratorEmail(user.email)) {
    return (
      <main className="review-shell">
        <a className="review-back" href="/"><ArrowLeft size={17} /> Return to the memorial</a>
        <section className="review-denied"><h1>Moderator access required</h1><p>This review area is limited to approved memorial editors.</p></section>
      </main>
    );
  }

  const result = env.DB ? await env.DB.prepare(
    `SELECT id, name, relationship, email, title, story, photo_key AS photoKey,
            photo_name AS photoName, created_at AS createdAt
     FROM memories WHERE status = ? ORDER BY created_at ASC, id ASC`
  ).bind("pending").all<PendingMemory>() : { results: [] };
  const notificationsReady = emailNotificationsConfigured();

  return (
    <main className="review-shell">
      <header className="review-header">
        <a className="review-back" href="/"><ArrowLeft size={17} /> Return to the memorial</a>
        <p className="section-kicker">Private moderation</p>
        <h1>Review submitted memories</h1>
        <p>Approve a story to publish it on the memory wall, or reject it to keep it private.</p>
        <div className={`notification-status ${notificationsReady ? "ready" : "inactive"}`}>
          {notificationsReady ? <Bell size={18} /> : <BellOff size={18} />}
          {notificationsReady ? "Email notifications are active." : "Email notifications are awaiting mail-service activation."}
        </div>
      </header>
      <ReviewQueue initialMemories={result.results ?? []} />
    </main>
  );
}
