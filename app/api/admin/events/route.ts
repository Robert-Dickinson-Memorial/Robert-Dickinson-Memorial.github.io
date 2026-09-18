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
  if (!env.DB) return Response.json({ error: "The memorial archive is unavailable." }, { status: 503 });
  const body = await request.json() as Record<string, unknown>;
  const title = clean(body.title, 180);
  const startAt = clean(body.startAt, 50);
  if (title.length < 2 || Number.isNaN(Date.parse(startAt))) return Response.json({ error: "Title and a valid start date are required." }, { status: 400 });
  const id = Number(body.id);
  const values = [title, startAt, clean(body.endAt, 50) || null, clean(body.location, 300) || null, clean(body.description, 4000) || null, clean(body.linkLabel, 100) || null, safeUrl(body.linkUrl)];
  if (Number.isInteger(id) && id > 0) {
    await env.DB.prepare(
      `UPDATE events SET title=?, start_at=?, end_at=?, location=?, description=?, link_label=?, link_url=? WHERE id=?`
    ).bind(...values, id).run();
    return Response.json({ ok: true, id });
  }
  const result = await env.DB.prepare(
    `INSERT INTO events (title, start_at, end_at, location, description, link_label, link_url, published, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`
  ).bind(...values, new Date().toISOString()).run();
  return Response.json({ ok: true, id: result.meta.last_row_id }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!await isEditorRequest(request)) return Response.json({ error: "Editor access is required." }, { status: 403 });
  if (!env.DB) return Response.json({ error: "The memorial archive is unavailable." }, { status: 503 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Invalid event." }, { status: 400 });
  await env.DB.prepare("DELETE FROM events WHERE id = ?").bind(id).run();
  return Response.json({ ok: true });
}
