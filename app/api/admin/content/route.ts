import { env } from "cloudflare:workers";
import { isModeratorRequest } from "../../../moderation";

export const dynamic = "force-dynamic";
const allowedKeys = new Set(["heroIntro", "obituaryStory", "treeTribute", "treeDetail"]);

export async function PATCH(request: Request) {
  if (!isModeratorRequest(request)) return Response.json({ error: "Editor access is required." }, { status: 403 });
  if (!env.DB) return Response.json({ error: "The memorial archive is unavailable." }, { status: 503 });
  const body = await request.json() as { values?: Record<string, unknown> };
  const values = Object.entries(body.values ?? {}).filter(([key, value]) => allowedKeys.has(key) && typeof value === "string");
  if (!values.length) return Response.json({ error: "No editable content was supplied." }, { status: 400 });
  const now = new Date().toISOString();
  await env.DB.batch(values.map(([key, value]) => env.DB!.prepare(
    `INSERT INTO site_content (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).bind(key, String(value).trim().slice(0, 20000), now)));
  return Response.json({ ok: true });
}
