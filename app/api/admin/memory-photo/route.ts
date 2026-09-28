import { env } from "cloudflare:workers";
import { isEditorRequest } from "../../../moderation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!await isEditorRequest(request)) return Response.json({ error: "Editor access is required." }, { status: 403 });
  if (!env.DB || !env.BUCKET) return Response.json({ error: "The memorial archive is unavailable." }, { status: 503 });

  const form = await request.formData();
  const id = Number(form.get("id"));
  const file = form.get("file");
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Invalid memory." }, { status: 400 });
  if (!(file instanceof File) || !file.size || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 12 * 1024 * 1024) {
    return Response.json({ error: "Choose a JPG, PNG, or WebP image up to 12 MB." }, { status: 400 });
  }

  const current = await env.DB.prepare("SELECT photo_key AS photoKey FROM memories WHERE id = ? AND status = 'approved'")
    .bind(id).first<{ photoKey: string | null }>();
  if (!current) return Response.json({ error: "Published memory not found." }, { status: 404 });

  const objectKey = `memory-photos/${crypto.randomUUID()}`;
  const photoName = file.name.trim().slice(0, 240) || "memory-photo";
  await env.BUCKET.put(objectKey, file.stream(), {
    httpMetadata: { contentType: file.type }, customMetadata: { originalName: photoName },
  });
  try {
    const result = await env.DB.prepare(
      "UPDATE memories SET photo_key = ?, photo_name = ? WHERE id = ? AND status = 'approved' AND (photo_key IS ? OR photo_key = ?)"
    ).bind(objectKey, photoName, id, current.photoKey, current.photoKey).run();
    if (!result.meta.changes) {
      await env.BUCKET.delete(objectKey);
      return Response.json({ error: "This memory changed while you were editing it. Reload and try again." }, { status: 409 });
    }
  } catch (error) {
    await env.BUCKET.delete(objectKey);
    throw error;
  }

  if (current.photoKey) {
    const stillUsed = await env.DB.prepare(
      "SELECT (SELECT COUNT(*) FROM memories WHERE photo_key = ?) + (SELECT COUNT(*) FROM gallery_items WHERE object_key = ?) AS count"
    ).bind(current.photoKey, current.photoKey).first<{ count: number }>();
    if (!stillUsed?.count) {
      try { await env.BUCKET.delete(current.photoKey); } catch (error) { console.warn("Previous memory photo cleanup failed", error); }
    }
  }
  return Response.json({ ok: true, id, photoKey: objectKey, photoName });
}
