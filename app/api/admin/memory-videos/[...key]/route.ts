import { env } from "cloudflare:workers";
import { isEditorEmail, requestUserEmail } from "../../../../moderation";
import { videoResponse } from "../../../../video-response";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ key: string[] }> }) {
  const email = requestUserEmail(request);
  if (!email || !await isEditorEmail(email) || !env.DB) return new Response("Not found", { status: 404 });
  const key = (await context.params).key.join("/");
  const memory = await env.DB.prepare("SELECT id FROM memories WHERE video_key = ? AND status = 'pending' LIMIT 1").bind(key).first();
  if (!memory) return new Response("Not found", { status: 404 });
  return videoResponse(request, key, true);
}
