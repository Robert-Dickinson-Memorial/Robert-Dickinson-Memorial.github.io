import { env } from "cloudflare:workers";
import { publicMediaResponse } from "../../../cors";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  if (!env.DB || !env.BUCKET) return publicMediaResponse("Not found", { status: 404 });
  const { key } = await context.params;
  const objectKey = key.join("/");
  const approved = await env.DB.prepare(
    "SELECT id, pdf_name AS pdfName FROM memories WHERE pdf_key = ? AND status = ? LIMIT 1"
  ).bind(objectKey, "approved").first<{ id: number; pdfName: string | null }>();
  if (!approved) return publicMediaResponse("Not found", { status: 404 });
  const object = await env.BUCKET.get(objectKey);
  if (!object) return publicMediaResponse("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-type", "application/pdf");
  headers.set("content-disposition", `inline; filename="${(approved.pdfName || "shared-memory.pdf").replace(/["\\]/g, "_")}"`);
  headers.set("cache-control", "public, max-age=3600");
  headers.set("etag", object.httpEtag);
  return publicMediaResponse(object.body, { headers });
}
