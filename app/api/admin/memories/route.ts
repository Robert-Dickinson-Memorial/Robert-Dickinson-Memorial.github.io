import { env } from "cloudflare:workers";
import { isEditorEmail, requestUserEmail } from "../../../moderation";

export const dynamic = "force-dynamic";

async function moderatorEmail(request: Request): Promise<string | null> {
  const email = requestUserEmail(request);
  return email && await isEditorEmail(email) ? email : null;
}

export async function PATCH(request: Request) {
  if (!await moderatorEmail(request)) {
    return Response.json({ error: "Moderator access is required." }, { status: 403 });
  }
  if (!env.DB) {
    return Response.json({ error: "The memorial archive is unavailable." }, { status: 503 });
  }

  const body = await request.json() as Record<string, unknown>;
  const id = Number(body.id);
  const action = body.action;
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Invalid memory." }, { status: 400 });

  if (action === "edit") {
    const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
    const name = clean(body.name, 100);
    const relationship = clean(body.relationship, 120);
    const title = clean(body.title, 160);
    const story = clean(body.story, 6000);
    const featuredQuote = body.featuredQuote === true || body.featuredQuote === "1" || body.featuredQuote === "on";
    const quoteExcerpt = clean(body.quoteExcerpt, 900);
    if (name.length < 2 || relationship.length < 2 || title.length < 2 || story.length < 20) {
      return Response.json({ error: "Name, connection, title, and story are required." }, { status: 400 });
    }
    if (featuredQuote && quoteExcerpt.length < 12) {
      return Response.json({ error: "Choose a short quotation before featuring this reflection in Scientific Legacy." }, { status: 400 });
    }
    const result = await env.DB.prepare(
      "UPDATE memories SET name = ?, relationship = ?, title = ?, story = ?, featured_quote = ?, quote_excerpt = ? WHERE id = ? AND status = 'approved'"
    ).bind(name, relationship, title, story, featuredQuote ? 1 : 0, quoteExcerpt || null, id).run();
    if (!result.meta.changes) return Response.json({ error: "Published memory not found." }, { status: 404 });
    return Response.json({ ok: true, id, status: "approved" });
  }

  if (action !== "approve" && action !== "reject") {
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

export async function DELETE(request: Request) {
  if (!await moderatorEmail(request)) {
    return Response.json({ error: "Owner access is required." }, { status: 403 });
  }
  if (!env.DB || !env.BUCKET) {
    return Response.json({ error: "The memorial archive is unavailable." }, { status: 503 });
  }

  const id = Number(new URL(request.url).searchParams.get("id"));
  const mode = new URL(request.url).searchParams.get("mode") || "all";
  if (!Number.isInteger(id) || id < 1 || !["text", "photo", "all"].includes(mode)) {
    return Response.json({ error: "Invalid memory." }, { status: 400 });
  }

  const memory = await env.DB.prepare(
    "SELECT photo_key AS photoKey FROM memories WHERE id = ? AND status = 'approved'"
  ).bind(id).first<{ photoKey: string | null }>();
  if (!memory) {
    return Response.json({ error: "Published memory not found." }, { status: 404 });
  }

  if (mode === "text") {
    if (memory.photoKey) {
      await env.DB.batch([
        env.DB.prepare(
          `INSERT INTO gallery_items (kind, title, caption, object_key, external_url, published, created_at)
           VALUES ('image', 'Community photograph', NULL, ?, NULL, 1, ?)`
        ).bind(memory.photoKey, new Date().toISOString()),
        env.DB.prepare("DELETE FROM memories WHERE id = ? AND status = 'approved'").bind(id),
      ]);
    } else {
      await env.DB.prepare("DELETE FROM memories WHERE id = ? AND status = 'approved'").bind(id).run();
    }
    return Response.json({ ok: true, id, deleted: "text" });
  }

  if (mode === "photo") {
    if (!memory.photoKey) return Response.json({ error: "This memory has no photo." }, { status: 404 });
    await env.BUCKET.delete(memory.photoKey);
    await env.DB.prepare("UPDATE memories SET photo_key = NULL, photo_name = NULL WHERE id = ? AND status = 'approved'").bind(id).run();
    return Response.json({ ok: true, id, deleted: "photo" });
  }

  if (memory.photoKey) await env.BUCKET.delete(memory.photoKey);
  await env.DB.prepare("DELETE FROM memories WHERE id = ? AND status = 'approved'").bind(id).run();
  return Response.json({ ok: true, id, deleted: "memory" });
}
