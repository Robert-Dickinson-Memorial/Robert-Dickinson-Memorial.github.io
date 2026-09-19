import { env } from "cloudflare:workers";
import { publicMediaResponse } from "../../../cors";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  if (!env.DB || !env.BUCKET) return publicMediaResponse("Not found", { status: 404 });
  const { key } = await context.params;
  const objectKey = key.join("/");
  const approved = await env.DB.prepare(
    "SELECT id FROM memories WHERE photo_key = ? AND status = ? LIMIT 1"
  ).bind(objectKey, "approved").first();
  if (!approved) return publicMediaResponse("Not found", { status: 404 });
  const object = await env.BUCKET.get(objectKey);
  if (!object) return publicMediaResponse("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "public, max-age=3600");
  headers.set("etag", object.httpEtag);
  return publicMediaResponse(object.body, { headers });
}
