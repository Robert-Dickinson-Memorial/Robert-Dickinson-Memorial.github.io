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
    "SELECT id, pdf_name AS pdfName FROM memories WHERE pdf_key = ? AND status = ? LIMIT 1"
  ).bind(objectKey, "pending").first<{ id: number; pdfName: string | null }>();
  if (!pending) return new Response("Not found", { status: 404 });
  const object = await env.BUCKET.get(objectKey);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-type", "application/pdf");
  const safeName = (pending.pdfName || "shared-memory.pdf").replace(/[^A-Za-z0-9._ -]/g, "_").slice(0, 180);
  headers.set("content-disposition", `inline; filename="${safeName}"`);
  headers.set("x-content-type-options", "nosniff");
  headers.set("cache-control", "private, no-store");
  return new Response(object.body, { headers });
}
