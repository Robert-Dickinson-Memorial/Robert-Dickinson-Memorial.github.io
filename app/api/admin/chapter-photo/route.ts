import { env } from "cloudflare:workers";
import { isEditorRequest } from "../../../moderation";
import { getSiteContent, type LegacyChapter } from "../../../site-data";

export const dynamic = "force-dynamic";

const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

async function saveChapters(chapters: LegacyChapter[]) {
  const now = new Date().toISOString();
  await env.DB!.prepare(
    `INSERT INTO site_content (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).bind("legacyChapters", JSON.stringify(chapters), now).run();
}

export async function POST(request: Request) {
  if (!await isEditorRequest(request)) return Response.json({ error: "Editor access is required." }, { status: 403 });
  if (!env.DB || !env.BUCKET) return Response.json({ error: "Photo storage is unavailable." }, { status: 503 });

  const form = await request.formData();
  const chapterId = clean(form.get("chapterId"), 100);
  const file = form.get("file");
  if (!chapterId) return Response.json({ error: "Choose a scientific chapter." }, { status: 400 });
  if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 12 * 1024 * 1024) {
    return Response.json({ error: "Choose a JPG, PNG, or WebP image under 12 MB." }, { status: 400 });
  }

  const content = await getSiteContent();
  const chapterIndex = content.legacyChapters.findIndex((chapter) => chapter.id === chapterId);
  if (chapterIndex < 0) return Response.json({ error: "Scientific chapter not found." }, { status: 404 });

  const chapter = content.legacyChapters[chapterIndex];
  const previousObjectKey = chapter.photo?.objectKey ?? null;
  const objectKey = `chapters/${chapterId}/${crypto.randomUUID()}`;
  await env.BUCKET.put(objectKey, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: clean(file.name, 240) },
  });

  const chapters = content.legacyChapters.map((item, index) => index === chapterIndex ? {
    ...item,
    photo: {
      asset: null,
      objectKey,
      alt: item.photo?.alt || `${item.institution} period photograph of Robert Dickinson`,
      caption: item.photo?.caption || `Robert Dickinson during his ${item.institution} years.`,
    },
  } : item);

  try {
    await saveChapters(chapters);
    if (previousObjectKey) await env.BUCKET.delete(previousObjectKey);
    return Response.json({ ok: true, objectKey });
  } catch (error) {
    await env.BUCKET.delete(objectKey);
    throw error;
  }
}

export async function DELETE(request: Request) {
  if (!await isEditorRequest(request)) return Response.json({ error: "Editor access is required." }, { status: 403 });
  if (!env.DB || !env.BUCKET) return Response.json({ error: "Photo storage is unavailable." }, { status: 503 });
  const chapterId = clean(new URL(request.url).searchParams.get("chapterId"), 100);
  if (!chapterId) return Response.json({ error: "Choose a scientific chapter." }, { status: 400 });

  const content = await getSiteContent();
  const chapterIndex = content.legacyChapters.findIndex((chapter) => chapter.id === chapterId);
  if (chapterIndex < 0) return Response.json({ error: "Scientific chapter not found." }, { status: 404 });
  const previousObjectKey = content.legacyChapters[chapterIndex].photo?.objectKey ?? null;
  const chapters = content.legacyChapters.map((item, index) => index === chapterIndex ? { ...item, photo: null } : item);
  await saveChapters(chapters);
  if (previousObjectKey) await env.BUCKET.delete(previousObjectKey);
  return Response.json({ ok: true });
}
