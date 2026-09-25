import { env } from "cloudflare:workers";
import { isEditorEmail, requestUserEmail } from "../../../moderation";

export const dynamic = "force-dynamic";

async function moderatorEmail(request: Request): Promise<string | null> {
  const email = requestUserEmail(request);
  return email && await isEditorEmail(email) ? email : null;
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanPublicUrl(value: unknown): string {
  const raw = clean(value, 1000);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : "";
  } catch {
    return "";
  }
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
    const name = clean(body.name, 100);
    const relationship = clean(body.relationship, 120);
    const title = clean(body.title, 160);
    const story = clean(body.story, 6000);
    const socialUrlRaw = clean(body.socialUrl, 1000);
    const socialUrl = cleanPublicUrl(socialUrlRaw);
    if (socialUrlRaw && !socialUrl) {
      return Response.json({ error: "Please enter a valid HTTPS public link." }, { status: 400 });
    }
    const current = await env.DB.prepare(
      "SELECT pdf_key AS pdfKey FROM memories WHERE id = ? AND status = 'approved'"
    ).bind(id).first<{ pdfKey: string | null }>();
    if (!current) return Response.json({ error: "Published memory not found." }, { status: 404 });
    if (name.length < 2 || relationship.length < 2 || title.length < 2) {
      return Response.json({ error: "Name, connection, and title are required." }, { status: 400 });
    }
    if (story && story.length < 20) {
      return Response.json({ error: "Memory text must be at least 20 characters, or left blank when a PDF or public link is present." }, { status: 400 });
    }
    if (!story && !current.pdfKey && !socialUrl) {
      return Response.json({ error: "Keep written text, a PDF, or a public link with this memory." }, { status: 400 });
    }
    const result = await env.DB.prepare(
      "UPDATE memories SET name = ?, relationship = ?, title = ?, story = ?, social_url = ? WHERE id = ? AND status = 'approved'"
    ).bind(name, relationship, title, story, socialUrl || null, id).run();
    if (!result.meta.changes) return Response.json({ error: "Published memory not found." }, { status: 404 });
    return Response.json({ ok: true, id, status: "approved" });
  }

  if (action !== "approve" && action !== "reject") {
    return Response.json({ error: "Invalid review action." }, { status: 400 });
  }

  const status = action === "approve" ? "approved" : "rejected";
  const memory = await env.DB.prepare(
    "SELECT photo_key AS photoKey, pdf_key AS pdfKey FROM memories WHERE id = ? AND status = ?"
  ).bind(id, "pending").first<{ photoKey: string | null; pdfKey: string | null }>();
  const result = await env.DB.prepare(
    "UPDATE memories SET status = ? WHERE id = ? AND status = ?"
  ).bind(status, id, "pending").run();

  if (!result.meta.changes) {
    return Response.json({ error: "This submission is no longer pending." }, { status: 409 });
  }
  if (action === "reject" && env.BUCKET) {
    if (memory?.photoKey) await env.BUCKET.delete(memory.photoKey);
    if (memory?.pdfKey) await env.BUCKET.delete(memory.pdfKey);
    await env.DB.prepare("UPDATE memories SET photo_key = NULL, photo_name = NULL, pdf_key = NULL, pdf_name = NULL WHERE id = ?").bind(id).run();
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
  if (!Number.isInteger(id) || id < 1 || !["text", "photo", "pdf", "link", "all"].includes(mode)) {
    return Response.json({ error: "Invalid memory." }, { status: 400 });
  }

  const memory = await env.DB.prepare(
    "SELECT story, photo_key AS photoKey, pdf_key AS pdfKey, social_url AS socialUrl FROM memories WHERE id = ? AND status = 'approved'"
  ).bind(id).first<{ story: string; photoKey: string | null; pdfKey: string | null; socialUrl: string | null }>();
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
    if (memory.pdfKey) await env.BUCKET.delete(memory.pdfKey);
    return Response.json({ ok: true, id, deleted: "text" });
  }

  if (mode === "photo") {
    if (!memory.photoKey) return Response.json({ error: "This memory has no photo." }, { status: 404 });
    await env.BUCKET.delete(memory.photoKey);
    await env.DB.prepare("UPDATE memories SET photo_key = NULL, photo_name = NULL WHERE id = ? AND status = 'approved'").bind(id).run();
    return Response.json({ ok: true, id, deleted: "photo" });
  }

  if (mode === "pdf") {
    if (!memory.pdfKey) return Response.json({ error: "This memory has no PDF." }, { status: 404 });
    if (!memory.story && !memory.socialUrl) return Response.json({ error: "This PDF is the only story content. Use Delete all to remove the memory." }, { status: 409 });
    await env.BUCKET.delete(memory.pdfKey);
    await env.DB.prepare("UPDATE memories SET pdf_key = NULL, pdf_name = NULL WHERE id = ? AND status = 'approved'").bind(id).run();
    return Response.json({ ok: true, id, deleted: "pdf" });
  }

  if (mode === "link") {
    if (!memory.socialUrl) return Response.json({ error: "This memory has no public link." }, { status: 404 });
    if (!memory.story && !memory.pdfKey) return Response.json({ error: "This link is the only story content. Use Delete all to remove the memory." }, { status: 409 });
    await env.DB.prepare("UPDATE memories SET social_url = NULL WHERE id = ? AND status = 'approved'").bind(id).run();
    return Response.json({ ok: true, id, deleted: "link" });
  }

  if (memory.photoKey) await env.BUCKET.delete(memory.photoKey);
  if (memory.pdfKey) await env.BUCKET.delete(memory.pdfKey);
  await env.DB.prepare("DELETE FROM memories WHERE id = ? AND status = 'approved'").bind(id).run();
  return Response.json({ ok: true, id, deleted: "memory" });
}
