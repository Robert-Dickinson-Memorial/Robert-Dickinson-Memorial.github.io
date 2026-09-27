import { env } from "cloudflare:workers";

// A single byte range allows browsers to seek without downloading the full video.
export async function videoResponse(request: Request, key: string, privateVideo = false) {
  const bucket = env.BUCKET;
  if (!bucket) return new Response("Not found", { status: 404 });
  const info = await bucket.head(key);
  if (!info) return new Response("Not found", { status: 404 });
  const headers = new Headers({
    "content-type": info.httpMetadata?.contentType || "video/mp4",
    "accept-ranges": "bytes",
    "cache-control": privateVideo ? "private, no-store" : "public, max-age=300",
    "x-content-type-options": "nosniff",
    etag: info.httpEtag,
  });
  let offset = 0, end = info.size - 1;
  const range = request.headers.get("range");
  const useRange = range && (!request.headers.get("if-range") || request.headers.get("if-range") === info.httpEtag);
  if (useRange) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (match && (match[1] || match[2])) {
      if (!match[1]) offset = Math.max(0, info.size - Number(match[2]));
      else { offset = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
    } else offset = info.size;
    if (offset > end || offset >= info.size || !Number.isSafeInteger(offset) || !Number.isSafeInteger(end)) {
      headers.set("content-range", `bytes */${info.size}`);
      return new Response(null, { status: 416, headers });
    }
    headers.set("content-range", `bytes ${offset}-${end}/${info.size}`);
  }
  const object = await bucket.get(key, { range: { offset, length: end - offset + 1 } });
  if (!object) return new Response("Not found", { status: 404 });
  headers.set("content-length", String(end - offset + 1));
  return new Response(object.body, { status: useRange ? 206 : 200, headers });
}
