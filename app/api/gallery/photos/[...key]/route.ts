import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  if (!env.DB || !env.BUCKET) return new Response("Not found", { status: 404 });
  const { key } = await context.params;
  const objectKey = key.join("/");
  const published = await env.DB.prepare(
    "SELECT id FROM gallery_items WHERE object_key = ? AND published = 1 LIMIT 1"
  ).bind(objectKey).first();
  if (!published) return new Response("Not found", { status: 404 });
  const object = await env.BUCKET.get(objectKey);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "public, max-age=3600");
  headers.set("etag", object.httpEtag);
  return new Response(object.body, { headers });
}
