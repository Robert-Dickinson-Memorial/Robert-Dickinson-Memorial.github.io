import { env } from "cloudflare:workers";
import { isEditorRequest } from "../../../moderation";

export const dynamic = "force-dynamic";

const stringKeys = new Set([
  "heroIntro",
  "obituaryStory",
  "treeTribute",
  "treeDetail",
  "bodyFont",
  "headingFont",
  "homeLegacyIntro",
  "honorsNote",
]);

const jsonKeys = new Set([
  "homeLegacyTopics",
  "homeLegacyCards",
  "homeFrontierLabels",
  "secondaryLegacyTopics",
  "lifeMilestones",
  "legacyThreads",
  "communityQuotes",
  "pageCopy",
  "siteAssets",
  "legacyChapters",
  "honors",
]);

function encodeValue(key: string, value: unknown): string | null {
  if (stringKeys.has(key) && typeof value === "string") return value.trim().slice(0, 100000);
  if (jsonKeys.has(key) && (Array.isArray(value) || (value && typeof value === "object"))) {
    return JSON.stringify(value).slice(0, 200000);
  }
  return null;
}

export async function PATCH(request: Request) {
  if (!await isEditorRequest(request)) return Response.json({ error: "Editor access is required." }, { status: 403 });
  if (!env.DB) return Response.json({ error: "The memorial archive is unavailable." }, { status: 503 });
  const body = await request.json() as { values?: Record<string, unknown> };
  const values = Object.entries(body.values ?? {})
    .map(([key, value]) => [key, encodeValue(key, value)] as const)
    .filter((entry): entry is readonly [string, string] => entry[1] !== null);
  if (!values.length) return Response.json({ error: "No editable content was supplied." }, { status: 400 });

  const now = new Date().toISOString();
  await env.DB.batch(values.map(([key, value]) => env.DB!.prepare(
    `INSERT INTO site_content (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).bind(key, value, now)));
  return Response.json({ ok: true });
}
