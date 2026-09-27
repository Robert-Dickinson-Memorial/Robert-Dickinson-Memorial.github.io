import { env } from "cloudflare:workers";
import { publicMediaResponse, publicOptions } from "../../../cors";
import { videoResponse } from "../../../video-response";
export const dynamic = "force-dynamic";
export const OPTIONS = publicOptions;
export async function GET(request: Request, context: { params: Promise<{ key: string[] }> }) {
  const key = (await context.params).key.join("/");
  const approved = env.DB && await env.DB.prepare("SELECT id FROM memories WHERE video_key = ? AND status = 'approved' LIMIT 1").bind(key).first();
  if (!approved) return publicMediaResponse("Not found", { status: 404 });
  const response = await videoResponse(request, key);
  return publicMediaResponse(response.body, { status: response.status, headers: response.headers });
}
