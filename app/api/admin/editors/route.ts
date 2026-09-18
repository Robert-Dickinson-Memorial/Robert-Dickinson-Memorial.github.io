import { env } from "cloudflare:workers";
import { isOwnerRequest } from "../../../moderation";

export const dynamic = "force-dynamic";

function cleanEmail(value: unknown): string {
  const email = typeof value === "string" ? value.trim().toLowerCase().slice(0, 254) : "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export async function POST(request: Request) {
  if (!isOwnerRequest(request)) return Response.json({ error: "Owner access is required." }, { status: 403 });
  if (!env.DB) return Response.json({ error: "The memorial archive is unavailable." }, { status: 503 });
  const body = await request.json() as { email?: unknown; displayName?: unknown };
  const email = cleanEmail(body.email);
  const displayName = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 120) : "";
  if (!email) return Response.json({ error: "Enter a valid editor email address." }, { status: 400 });
  await env.DB.prepare(
    `INSERT INTO memorial_editors (email, display_name, created_at) VALUES (?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name`
  ).bind(email, displayName || null, new Date().toISOString()).run();
  return Response.json({ ok: true, email }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!isOwnerRequest(request)) return Response.json({ error: "Owner access is required." }, { status: 403 });
  if (!env.DB) return Response.json({ error: "The memorial archive is unavailable." }, { status: 503 });
  const email = cleanEmail(new URL(request.url).searchParams.get("email"));
  if (!email) return Response.json({ error: "Invalid editor email address." }, { status: 400 });
  await env.DB.prepare("DELETE FROM memorial_editors WHERE lower(email) = ?").bind(email).run();
  return Response.json({ ok: true });
}
