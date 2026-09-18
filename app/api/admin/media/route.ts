import { env } from "cloudflare:workers";
import { isModeratorRequest } from "../../../moderation";

export const dynamic = "force-dynamic";
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

function safeUrl(value: unknown): string | null {
  const text = clean(value, 1000);
  if (!text) return null;
  try { const url = new URL(text); return ["http:", "https:"].includes(url.protocol) ? url.toString() : null; } catch { return null; }
}

export async function POST(request: Request) {
  if (!isModeratorRequest(request)) return Response.json({ error: "Editor access is required." }, { status: 403 });
  if (!env.DB || !env.BUCKET) return Response.json({ error: "Media storage is unavailable." }, { status: 503 });
  const form = await request.formData();
  const kind = clean(form.get("kind"), 20);
  const title = clean(form.get("title"), 180);
  const caption = clean(form.get("caption"), 1200) || null;
  if (!title || !["image", "video"].includes(kind)) return Response.json({ error: "A title and media type are required." }, { status: 400 });

  let objectKey: string | null = null;
  let externalUrl: string | null = null;
  if (kind === "image") {
    const file = form.get("file");
    if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 12 * 1024 * 1024) {
      return Response.json({ error: "Choose a JPG, PNG, or WebP image under 12 MB." }, { status: 400 });
    }
    objectKey = `gallery/${crypto.randomUUID()}`;
    await env.BUCKET.put(objectKey, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { originalName: clean(file.name, 240) } });
  } else {
    externalUrl = safeUrl(form.get("externalUrl"));
    if (!externalUrl) return Response.json({ error: "Enter a valid YouTube or Vimeo URL." }, { status: 400 });
  }

  try {
    const result = await env.DB.prepare(
      `INSERT INTO gallery_items (kind, title, caption, object_key, external_url, published, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?)`
    ).bind(kind, title, caption, objectKey, externalUrl, new Date().toISOString()).run();
    return Response.json({ ok: true, id: result.meta.last_row_id }, { status: 201 });
  } catch (error) {
    if (objectKey) await env.BUCKET.delete(objectKey);
    throw error;
  }
}

export async function DELETE(request: Request) {
  if (!isModeratorRequest(request)) return Response.json({ error: "Editor access is required." }, { status: 403 });
  if (!env.DB || !env.BUCKET) return Response.json({ error: "Media storage is unavailable." }, { status: 503 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Invalid media item." }, { status: 400 });
  const row = await env.DB.prepare("SELECT object_key AS objectKey FROM gallery_items WHERE id = ?").bind(id).first<{ objectKey: string | null }>();
  await env.DB.prepare("DELETE FROM gallery_items WHERE id = ?").bind(id).run();
  if (row?.objectKey) await env.BUCKET.delete(row.objectKey);
  return Response.json({ ok: true });
}
