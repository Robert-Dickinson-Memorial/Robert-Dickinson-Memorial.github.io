import { env } from "cloudflare:workers";
import { isAllowedPublicOrigin, publicJson, publicMediaResponse, publicOptions } from "../../cors";
import { pendingMemory } from "../../memory-preview";

export const dynamic = "force-dynamic";
export const OPTIONS = publicOptions;

export async function GET(request: Request) {
  if (!isAllowedPublicOrigin(request)) return publicJson({ error: "This source is not allowed." }, { status: 403 });
  const url = new URL(request.url);
  const memory = await pendingMemory(Number(url.searchParams.get("id")), request.headers.get("authorization")?.replace(/^Bearer /i, "") || "");
  if (!memory) return publicJson({ error: "This private preview is unavailable. It may already have been reviewed." }, { status: 404 });
  const kind = url.searchParams.get("media");
  if (!kind) {
    const { photo2Key: _photo2Key, photo3Key: _photo3Key, photoKey: _photoKey, pdfKey: _pdfKey, videoKey: _videoKey, ...safe } = memory;
    return publicJson({ memory: safe }, { headers: { "cache-control": "no-store" } });
  }
  const key = kind === "photo2" ? memory.photo2Key : kind === "photo3" ? memory.photo3Key : kind === "photo" ? memory.photoKey : kind === "pdf" ? memory.pdfKey : kind === "video" ? memory.videoKey : null;
  if (!key || !env.BUCKET) return publicJson({ error: "Attachment not found." }, { status: 404 });
  const object = await env.BUCKET.get(key);
  if (!object) return publicJson({ error: "Attachment not found." }, { status: 404 });
  const headers = new Headers({ "cache-control": "no-store", "x-content-type-options": "nosniff" });
  object.writeHttpMetadata(headers);
  if (kind === "pdf") headers.set("content-type", "application/pdf");
  return publicMediaResponse(object.body, { headers });
}
