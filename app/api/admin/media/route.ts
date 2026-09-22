import { env } from "cloudflare:workers";
import { isEditorRequest } from "../../../moderation";

export const dynamic = "force-dynamic";
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

function safeUrl(value: unknown): string | null {
  const text = clean(value, 1000);
  if (!text) return null;
  try { const url = new URL(text); return ["http:", "https:"].includes(url.protocol) ? url.toString() : null; } catch { return null; }
}

export async function POST(request: Request) {
  if (!await isEditorRequest(request)) return Response.json({ error: "Editor access is required." }, { status: 403 });
  if (!env.DB || !env.BUCKET) return Response.json({ error: "Media storage is unavailable." }, { status: 503 });
  const form = await request.formData();
  const id = Number(form.get("id"));
  const kind = clean(form.get("kind"), 20);
  const title = clean(form.get("title"), 180);
  const caption = clean(form.get("caption"), 1200) || null;
  if (!title || !["image", "video"].includes(kind)) return Response.json({ error: "A title and media type are required." }, { status: 400 });

  const existing = Number.isInteger(id) && id > 0
    ? await env.DB.prepare("SELECT kind, object_key AS objectKey, external_url AS externalUrl FROM gallery_items WHERE id = ?").bind(id).first<{ kind: string; objectKey: string | null; externalUrl: string | null }>()
    : null;
  if (Number.isInteger(id) && id > 0 && !existing) return Response.json({ error: "Gallery item not found." }, { status: 404 });

  let objectKey: string | null = existing?.objectKey ?? null;
  let externalUrl: string | null = existing?.externalUrl ?? null;
  let newObjectKey: string | null = null;

  if (kind === "image") {
    const file = form.get("file");
    if (file instanceof File && file.size > 0) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 12 * 1024 * 1024) {
        return Response.json({ error: "Choose a JPG, PNG, or WebP image under 12 MB." }, { status: 400 });
      }
      newObjectKey = `gallery/${crypto.randomUUID()}`;
      await env.BUCKET.put(newObjectKey, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { originalName: clean(file.name, 240) } });
      objectKey = newObjectKey;
    } else if (!existing?.objectKey) {
      return Response.json({ error: "Choose a JPG, PNG, or WebP image under 12 MB." }, { status: 400 });
    }
    externalUrl = null;
  } else {
    externalUrl = safeUrl(form.get("externalUrl"));
    if (!externalUrl) return Response.json({ error: "Enter a valid YouTube or Vimeo URL." }, { status: 400 });
    objectKey = null;
  }

  try {
    if (existing) {
      await env.DB.prepare(
        "UPDATE gallery_items SET kind = ?, title = ?, caption = ?, object_key = ?, external_url = ? WHERE id = ?"
      ).bind(kind, title, caption, objectKey, externalUrl, id).run();
      if (newObjectKey && existing.objectKey) await env.BUCKET.delete(existing.objectKey);
      if (kind === "video" && existing.objectKey) await env.BUCKET.delete(existing.objectKey);
      return Response.json({ ok: true, id });
    }

    const result = await env.DB.prepare(
      `INSERT INTO gallery_items (kind, title, caption, object_key, external_url, published, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?)`
    ).bind(kind, title, caption, objectKey, externalUrl, new Date().toISOString()).run();
    return Response.json({ ok: true, id: result.meta.last_row_id }, { status: 201 });
  } catch (error) {
    if (newObjectKey) await env.BUCKET.delete(newObjectKey);
    throw error;
  }
}

export async function DELETE(request: Request) {
  if (!await isEditorRequest(request)) return Response.json({ error: "Editor access is required." }, { status: 403 });
  if (!env.DB || !env.BUCKET) return Response.json({ error: "Media storage is unavailable." }, { status: 503 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Invalid media item." }, { status: 400 });
  const row = await env.DB.prepare("SELECT object_key AS objectKey FROM gallery_items WHERE id = ?").bind(id).first<{ objectKey: string | null }>();
  await env.DB.prepare("DELETE FROM gallery_items WHERE id = ?").bind(id).run();
  if (row?.objectKey) await env.BUCKET.delete(row.objectKey);
  return Response.json({ ok: true });
}
