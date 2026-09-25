import { env } from "cloudflare:workers";
import { isEditorRequest } from "../../../moderation";
import { getSiteContent, type LifePhoto } from "../../../site-data";

export const dynamic = "force-dynamic";
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
async function save(photos: LifePhoto[]) {
  await env.DB!.prepare(`INSERT INTO site_content (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
    .bind("lifePhotos", JSON.stringify(photos), new Date().toISOString()).run();
}
async function authorize(request: Request) {
  if (!await isEditorRequest(request)) return Response.json({ error: "Editor access is required." }, { status: 403 });
  if (!env.DB || !env.BUCKET) return Response.json({ error: "Photo storage is unavailable." }, { status: 503 });
  return null;
}
export async function POST(request: Request) {
  const denied = await authorize(request); if (denied) return denied;
  const form = await request.formData();
  const id = clean(form.get("id"), 100);
  const file = form.get("file");
  if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || !file.size || file.size > 12 * 1024 * 1024)
    return Response.json({ error: "Choose a JPG, PNG, or WebP image under 12 MB." }, { status: 400 });
  const { lifePhotos, lifeMilestones } = await getSiteContent();
  const previous = id ? lifePhotos.find((photo) => photo.id === id) : undefined;
  if (id && !previous) return Response.json({ error: "Photo not found. Refresh the editor." }, { status: 404 });
  const milestoneId = clean(form.get("milestoneId"), 100);
  if (milestoneId && !lifeMilestones.some((item, index) => (item.id || `life-period-${index}`) === milestoneId))
    return Response.json({ error: "Choose a valid career period." }, { status: 400 });
  if (milestoneId && lifePhotos.some((photo) => photo.milestoneId === milestoneId && photo.id !== id))
    return Response.json({ error: "That period already has a photo. Replace or remove it first." }, { status: 400 });
  const photoId = id || crypto.randomUUID();
  const objectKey = `life/${photoId}/${crypto.randomUUID()}`;
  await env.BUCKET!.put(objectKey, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { originalName: clean(file.name, 240) } });
  const photo: LifePhoto = { id: photoId, objectKey, milestoneId,
    caption: form.has("caption") ? clean(form.get("caption"), 2000) : previous?.caption || "",
    date: form.has("date") ? clean(form.get("date"), 100) : previous?.date || "",
    alt: (form.has("alt") ? clean(form.get("alt"), 500) : previous?.alt) || "Photograph of Robert Dickinson" };
  const photos = previous ? lifePhotos.map((item) => item.id === id ? photo : item) : [...lifePhotos, photo];
  try { await save(photos); }
  catch (error) { await env.BUCKET!.delete(objectKey); throw error; }
  // Retain replaced originals in storage so an earlier version can be recovered.
  return Response.json({ ok: true, photos });
}
export async function PATCH(request: Request) {
  const denied = await authorize(request); if (denied) return denied;
  const body = await request.json() as { id?: string; caption?: string; date?: string; alt?: string; milestoneId?: string };
  const { lifePhotos, lifeMilestones } = await getSiteContent();
  if (!lifePhotos.some((photo) => photo.id === body.id)) return Response.json({ error: "Photo not found." }, { status: 404 });
  const milestoneId = clean(body.milestoneId, 100);
  if (milestoneId && !lifeMilestones.some((item, index) => (item.id || `life-period-${index}`) === milestoneId))
    return Response.json({ error: "Choose a valid career period." }, { status: 400 });
  if (milestoneId && lifePhotos.some((photo) => photo.milestoneId === milestoneId && photo.id !== body.id))
    return Response.json({ error: "That period already has a photo. Replace or remove it first." }, { status: 400 });
  const photos = lifePhotos.map((photo) => photo.id === body.id ? { ...photo, milestoneId, caption: clean(body.caption, 2000), date: clean(body.date, 100), alt: clean(body.alt, 500) } : photo);
  await save(photos);
  return Response.json({ ok: true, photos });
}
export async function DELETE(request: Request) {
  const denied = await authorize(request); if (denied) return denied;
  const id = new URL(request.url).searchParams.get("id");
  const { lifePhotos, lifeMilestones } = await getSiteContent();
  if (!lifePhotos.some((photo) => photo.id === id)) return Response.json({ error: "Photo not found." }, { status: 404 });
  const photos = lifePhotos.filter((photo) => photo.id !== id);
  await save(photos);
  return Response.json({ ok: true, photos });
}
