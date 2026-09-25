import { env } from "cloudflare:workers";
import { isEditorRequest } from "../../../moderation";
import { getSiteContent, type SiteAssets } from "../../../site-data";

export const dynamic = "force-dynamic";

const allowedAssetIds = new Set(["portrait", "horizon", "lifePortrait"]);
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

async function saveAssets(assets: SiteAssets) {
  const now = new Date().toISOString();
  await env.DB!.prepare(
    `INSERT INTO site_content (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).bind("siteAssets", JSON.stringify(assets), now).run();
}

export async function POST(request: Request) {
  if (!await isEditorRequest(request)) return Response.json({ error: "Editor access is required." }, { status: 403 });
  if (!env.DB || !env.BUCKET) return Response.json({ error: "Photo storage is unavailable." }, { status: 503 });

  const form = await request.formData();
  const assetId = clean(form.get("assetId"), 40);
  const file = form.get("file");
  if (!allowedAssetIds.has(assetId)) return Response.json({ error: "Unknown site image." }, { status: 400 });
  if (!(file instanceof File) || !file.size || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 12 * 1024 * 1024) {
    return Response.json({ error: "Choose a JPG, PNG, or WebP image under 12 MB." }, { status: 400 });
  }

  const content = await getSiteContent();
  const current = content.siteAssets[assetId as keyof SiteAssets];
  const previousObjectKey = current.objectKey;
  const objectKey = `site/${assetId}/${crypto.randomUUID()}`;

  await env.BUCKET.put(objectKey, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: clean(file.name, 240) },
  });

  const assets: SiteAssets = {
    ...content.siteAssets,
    [assetId]: { ...current, objectKey },
  };

  try {
    await saveAssets(assets);
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

  const assetId = clean(new URL(request.url).searchParams.get("assetId"), 40);
  if (!allowedAssetIds.has(assetId)) return Response.json({ error: "Unknown site image." }, { status: 400 });

  const content = await getSiteContent();
  const current = content.siteAssets[assetId as keyof SiteAssets];
  const previousObjectKey = current.objectKey;
  const assets: SiteAssets = {
    ...content.siteAssets,
    [assetId]: { ...current, objectKey: null },
  };
  await saveAssets(assets);
  if (previousObjectKey) await env.BUCKET.delete(previousObjectKey);
  return Response.json({ ok: true });
}
