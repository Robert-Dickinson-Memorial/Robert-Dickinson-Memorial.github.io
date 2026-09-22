import { env } from "cloudflare:workers";
import { publicMediaResponse } from "../../../cors";
import { getSiteContent } from "../../../site-data";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  if (!env.BUCKET) return publicMediaResponse("Not found", { status: 404 });
  const { key } = await context.params;
  const objectKey = key.join("/");
  const content = await getSiteContent();
  const published = content.legacyChapters.some((chapter) => chapter.photo?.objectKey === objectKey);
  if (!published) return publicMediaResponse("Not found", { status: 404 });

  const object = await env.BUCKET.get(objectKey);
  if (!object) return publicMediaResponse("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", "public, max-age=3600");
  headers.set("etag", object.httpEtag);
  return publicMediaResponse(object.body, { headers });
}
