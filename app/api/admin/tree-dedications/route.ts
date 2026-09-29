import { env } from "cloudflare:workers";
import { isEditorRequest } from "../../../moderation";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  if (!await isEditorRequest(request)) return Response.json({ error: "Editor access is required." }, { status: 403 });
  if (!env.DB) return Response.json({ error: "The memorial archive is unavailable." }, { status: 503 });
  const body = await request.json() as Record<string, unknown>;
  const id = Number(body.id);
  if (!Number.isInteger(id) || id < 1 || (body.action !== "approve" && body.action !== "reject")) {
    return Response.json({ error: "Invalid review action." }, { status: 400 });
  }
  const result = await env.DB.prepare("UPDATE tree_dedications SET status = ? WHERE id = ? AND status = 'pending'")
    .bind(body.action === "approve" ? "approved" : "rejected", id).run();
  if (!result.meta.changes) return Response.json({ error: "This dedication is no longer pending." }, { status: 409 });
  return Response.json({ ok: true, id });
}

export async function DELETE(request: Request) {
  if (!await isEditorRequest(request)) return Response.json({ error: "Editor access is required." }, { status: 403 });
  if (!env.DB) return Response.json({ error: "The memorial archive is unavailable." }, { status: 503 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Invalid dedication." }, { status: 400 });
  const result = await env.DB.prepare("UPDATE tree_dedications SET status = 'voided' WHERE id = ? AND status = 'approved'").bind(id).run();
  if (!result.meta.changes) return Response.json({ error: "Approved dedication not found." }, { status: 404 });
  return Response.json({ ok: true, id, status: "voided" });
}
