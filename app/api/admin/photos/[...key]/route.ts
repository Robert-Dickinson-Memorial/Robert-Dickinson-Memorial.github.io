import { env } from "cloudflare:workers";
import { isEditorEmail, requestUserEmail } from "../../../../moderation";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ key: string[] }> }) {
  const email = requestUserEmail(request);
  if (!email || !await isEditorEmail(email) || !env.DB || !env.BUCKET) {
    return new Response("Not found", { status: 404 });
  }

  const { key } = await context.params;
  const objectKey = key.join("/");
  const pending = await env.DB.prepare(
    "SELECT id FROM memories WHERE photo_key = ? AND status = ? LIMIT 1"
  ).bind(objectKey, "pending").first();
  if (!pending) return new Response("Not found", { status: 404 });

  const object = await env.BUCKET.get(objectKey);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "private, no-store");
  return new Response(object.body, { headers });
}
