import { env } from "cloudflare:workers";
import { isEditorRequest } from "../../../moderation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!await isEditorRequest(request)) return Response.json({ error: "Editor access is required." }, { status: 403 });
  if (!env.DB || !env.BUCKET) return Response.json({ error: "The memorial archive is unavailable." }, { status: 503 });

  const form = await request.formData();
  const id = Number(form.get("id"));
  const slot = Number(form.get("slot") || 1);
  if (![1, 2, 3, 4, 5].includes(slot)) return Response.json({ error: "Invalid photo slot." }, { status: 400 });
  const keyColumn = slot === 1 ? "photo_key" : `photo${slot}_key`;
  const nameColumn = slot === 1 ? "photo_name" : `photo${slot}_name`;
  const file = form.get("file");
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Invalid memory." }, { status: 400 });
  if (!(file instanceof File) || !file.size || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 12 * 1024 * 1024) {
    return Response.json({ error: "Choose a JPG, PNG, or WebP image up to 12 MB." }, { status: 400 });
  }
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => header[index] === byte);
  const webp = String.fromCharCode(...header.slice(0, 4)) === "RIFF" && String.fromCharCode(...header.slice(8, 12)) === "WEBP";
  if (!(file.type === "image/jpeg" && jpeg || file.type === "image/png" && png || file.type === "image/webp" && webp)) {
    return Response.json({ error: "This file does not match its JPG, PNG, or WebP format. Choose a supported photograph." }, { status: 400 });
  }

  const current = await env.DB.prepare(`SELECT ${keyColumn} AS photoKey FROM memories WHERE id = ? AND status = 'approved'`)
    .bind(id).first<{ photoKey: string | null }>();
  if (!current) return Response.json({ error: "Published memory not found." }, { status: 404 });
  const expectedKey = form.get("expectedPhotoKey");
  if (typeof expectedKey === "string" && expectedKey !== (current.photoKey || "")) {
    return Response.json({ error: "This photograph changed since you opened the editor. Reload and try again." }, { status: 409 });
  }

  const objectKey = `memory-photos/${crypto.randomUUID()}`;
  const photoName = file.name.trim().slice(0, 240) || "memory-photo";
  try {
    await env.BUCKET.put(objectKey, file.stream(), {
      httpMetadata: { contentType: file.type }, customMetadata: { originalName: photoName },
    });
    const result = await env.DB.prepare(
      `UPDATE memories SET ${keyColumn} = ?, ${nameColumn} = ? WHERE id = ? AND status = 'approved' AND ${keyColumn} IS ?`
    ).bind(objectKey, photoName, id, current.photoKey).run();
    if (!result.meta.changes) {
      await env.BUCKET.delete(objectKey);
      return Response.json({ error: "This memory changed while you were editing it. Reload and try again." }, { status: 409 });
    }
  } catch {
    try { await env.BUCKET.delete(objectKey); } catch {}
    return Response.json({ error: "The photograph could not be saved. The previous photo is still available." }, { status: 500 });
  }

  if (current.photoKey) {
    const stillUsed = await env.DB.prepare(
      "SELECT (SELECT COUNT(*) FROM memories WHERE photo_key = ? OR photo2_key = ? OR photo3_key = ? OR photo4_key = ? OR photo5_key = ?) + (SELECT COUNT(*) FROM gallery_items WHERE object_key = ?) AS count"
    ).bind(current.photoKey, current.photoKey, current.photoKey, current.photoKey, current.photoKey, current.photoKey).first<{ count: number }>();
    if (!stillUsed?.count) {
      try { await env.BUCKET.delete(current.photoKey); } catch (error) { console.warn("Previous memory photo cleanup failed", error); }
    }
  }
  return Response.json({ ok: true, id, slot, photoKey: objectKey, photoName });
}
