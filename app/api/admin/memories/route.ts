import { env } from "cloudflare:workers";
import { isOwnerEmail, requestUserEmail } from "../../../moderation";

export const dynamic = "force-dynamic";

function moderatorEmail(request: Request): string | null {
  const email = requestUserEmail(request);
  return email && isOwnerEmail(email) ? email : null;
}

export async function PATCH(request: Request) {
  if (!moderatorEmail(request)) {
    return Response.json({ error: "Moderator access is required." }, { status: 403 });
  }
  if (!env.DB) {
    return Response.json({ error: "The memorial archive is unavailable." }, { status: 503 });
  }

  const body = await request.json() as { id?: unknown; action?: unknown };
  const id = Number(body.id);
  const action = body.action;
  if (!Number.isInteger(id) || id < 1 || (action !== "approve" && action !== "reject")) {
    return Response.json({ error: "Invalid review action." }, { status: 400 });
  }

  const status = action === "approve" ? "approved" : "rejected";
  const memory = await env.DB.prepare(
    "SELECT photo_key AS photoKey FROM memories WHERE id = ? AND status = ?"
  ).bind(id, "pending").first<{ photoKey: string | null }>();
  const result = await env.DB.prepare(
    "UPDATE memories SET status = ? WHERE id = ? AND status = ?"
  ).bind(status, id, "pending").run();

  if (!result.meta.changes) {
    return Response.json({ error: "This submission is no longer pending." }, { status: 409 });
  }
  if (action === "reject" && memory?.photoKey && env.BUCKET) {
    await env.BUCKET.delete(memory.photoKey);
    await env.DB.prepare("UPDATE memories SET photo_key = NULL, photo_name = NULL WHERE id = ?").bind(id).run();
  }
  return Response.json({ ok: true, id, status });
}
