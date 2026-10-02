import { env } from "cloudflare:workers";
import { ArrowLeft, Bell, BellOff } from "lucide-react";
import Link from "next/link";
import { requireChatGPTUser } from "../chatgpt-auth";
import { emailNotificationsConfigured, isEditorEmail } from "../moderation";
import ReviewQueue, { PendingMemory } from "./review-queue";
import TreeReview, { TreeDedication } from "./tree-review";

export const dynamic = "force-dynamic";

const PUBLIC_MEMORIAL_URL = "https://robert-dickinson-memorial.github.io/";

export default async function ReviewPage() {
  const user = await requireChatGPTUser("/review");
  if (!await isEditorEmail(user.email)) {
    return (
      <main className="review-shell">
        <Link className="review-back" href={PUBLIC_MEMORIAL_URL}><ArrowLeft size={17} /> Return to the memorial</Link>
        <section className="review-denied"><h1>Editor access required</h1><p>Only approved memorial editors can review submissions.</p></section>
      </main>
    );
  }

  const result = env.DB ? await env.DB.prepare(
    `SELECT id, name, relationship, email, title, story, photo2_key AS photo2Key, photo2_name AS photo2Name, photo3_key AS photo3Key, photo3_name AS photo3Name, photo_key AS photoKey,
            photo_name AS photoName, video_key AS videoKey, video_name AS videoName, pdf_key AS pdfKey, pdf_name AS pdfName,
            social_url AS socialUrl, created_at AS createdAt
     FROM memories WHERE status = ? ORDER BY created_at ASC, id ASC`
  ).bind("pending").all<PendingMemory>() : { results: [] };
  const treeResult = env.DB ? await env.DB.prepare("SELECT id, name, email, project, provider, contribution_type AS contributionType, reported_tree_count AS reportedTreeCount, count_basis AS countBasis, geographic_scope AS geographicScope, geographic_label AS geographicLabel, confirmation_ref AS confirmationRef, payment_confirmed AS paymentConfirmed, status, created_at AS createdAt FROM tree_dedications WHERE status IN ('pending', 'approved') ORDER BY created_at DESC, id DESC")
    .all<TreeDedication & { status: string }>() : { results: [] };
  const notificationsReady = emailNotificationsConfigured();

  return (
    <main className="review-shell">
      <header className="review-header">
        <Link className="review-back" href={PUBLIC_MEMORIAL_URL}><ArrowLeft size={17} /> Return to the memorial</Link>
        <p className="section-kicker">Private moderation</p>
        <h1>Review submitted memories</h1>
        <p>Approve a submission to publish it on the memory wall, or reject it to keep it private. This queue shows pending submissions. Approved memories, including extracted PDF text and images, are editable in <a href="/manage#edit-memories">Published community memories →</a>.</p>
        <div className={`notification-status ${notificationsReady ? "ready" : "inactive"}`}>
          {notificationsReady ? <Bell size={18} /> : <BellOff size={18} />}
          {notificationsReady ? "Email notifications are active." : "Email notifications are awaiting mail-service activation."}
        </div>
      </header>
      <ReviewQueue initialMemories={result.results ?? []} />
      <TreeReview pending={(treeResult.results ?? []).filter((item) => item.status === "pending")} approved={(treeResult.results ?? []).filter((item) => item.status === "approved")} />
    </main>
  );
}
