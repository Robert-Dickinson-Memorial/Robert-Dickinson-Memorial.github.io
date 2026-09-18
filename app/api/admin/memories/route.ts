import { env } from "cloudflare:workers";
import { isModeratorEmail } from "../../../moderation";

export const dynamic = "force-dynamic";

function moderatorEmail(request: Request): string | null {
  const email = request.headers.get("oai-authenticated-user-email");
  return email && isModeratorEmail(email) ? email : null;
}

export async function PATCH(request: Request) {
  if (!moderatorEmail(request)) {
    return Response.json({ error: "Moderator access is required." }, { status: 403 });
  }
  if (!env.DB) {
    return Response.json({ error: "The memorial archive is unavailable." }, { status: 503 });
  }

  const body = await request.json() as { id?: unknown; action?: unknown };
  const id = Number(body.id);
  const action = body.action;
  if (!Number.isInteger(id) || id < 1 || (action !== "approve" && action !== "reject")) {
    return Response.json({ error: "Invalid review action." }, { status: 400 });
  }

  const status = action === "approve" ? "approved" : "rejected";
  const result = await env.DB.prepare(
    "UPDATE memories SET status = ? WHERE id = ? AND status = ?"
  ).bind(status, id, "pending").run();

  if (!result.meta.changes) {
    return Response.json({ error: "This submission is no longer pending." }, { status: 409 });
  }
  return Response.json({ ok: true, id, status });
}
