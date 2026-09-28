import { env } from "cloudflare:workers";

export async function tokenHash(token: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function pendingMemory(id: number, token: string) {
  if (!env.DB || !Number.isSafeInteger(id) || id < 1 || !/^[a-f0-9]{64}$/.test(token)) return null;
  return env.DB.prepare(
    `SELECT id, name, relationship, title, story, social_url AS socialUrl,
            photo_key AS photoKey, photo_name AS photoName, pdf_key AS pdfKey,
            pdf_name AS pdfName, video_key AS videoKey, video_name AS videoName,
            created_at AS createdAt FROM memories
     WHERE id = ? AND status = 'pending' AND preview_token_hash = ?`
  ).bind(id, await tokenHash(token)).first<{
    id: number; name: string; relationship: string; title: string; story: string;
    socialUrl: string | null; photoKey: string | null; photoName: string | null;
    pdfKey: string | null; pdfName: string | null; videoKey: string | null;
    videoName: string | null; createdAt: string;
  }>();
}
