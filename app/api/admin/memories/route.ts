import { env } from "cloudflare:workers";
import { isEditorEmail, requestUserEmail } from "../../../moderation";

export const dynamic = "force-dynamic";

async function moderatorEmail(request: Request): Promise<string | null> {
  const email = requestUserEmail(request);
  return email && await isEditorEmail(email) ? email : null;
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanPublicUrl(value: unknown): string {
  const raw = clean(value, 1000);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : "";
  } catch {
    return "";
  }
}

export async function PATCH(request: Request) {
  if (!await moderatorEmail(request)) {
    return Response.json({ error: "Moderator access is required." }, { status: 403 });
  }
  if (!env.DB) {
    return Response.json({ error: "The memorial archive is unavailable." }, { status: 503 });
  }

  const body = await request.json() as Record<string, unknown>;
  const id = Number(body.id);
  const action = body.action;
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Invalid memory." }, { status: 400 });

  if (action === "edit") {
    const name = clean(body.name, 100);
    const relationship = clean(body.relationship, 120);
    const title = clean(body.title, 160);
    const story = clean(body.story, 60000);
    const originalStory = typeof body.originalStory === "string" ? body.originalStory : null;
    const socialUrlRaw = clean(body.socialUrl, 1000);
    const socialUrl = cleanPublicUrl(socialUrlRaw);
    if (socialUrlRaw && !socialUrl) {
      return Response.json({ error: "Please enter a valid HTTPS public link." }, { status: 400 });
    }
    const current = await env.DB.prepare(
      "SELECT video_key AS videoKey, video_name AS videoName, pdf_key AS pdfKey FROM memories WHERE id = ? AND status = 'approved'"
    ).bind(id).first<{ videoKey: string | null; videoName: string | null; pdfKey: string | null }>();
    if (!current) return Response.json({ error: "Published memory not found." }, { status: 404 });
    if (name.length < 2 || relationship.length < 2 || title.length < 2) {
      return Response.json({ error: "Name, connection, and title are required." }, { status: 400 });
    }
    if (story && story.length < 20) {
      return Response.json({ error: "Memory text must be at least 20 characters, or left blank when a PDF, video, or public link is present." }, { status: 400 });
    }
    if (!story && !current.pdfKey && !current.videoKey && !socialUrl) {
      return Response.json({ error: "Keep written text, a PDF, video, or a public link with this memory." }, { status: 400 });
    }
    if (originalStory === null) {
      return Response.json({ error: "Reload this editor to get the current memory before saving." }, { status: 409 });
    }
    const result = await env.DB.prepare(
      "UPDATE memories SET name = ?, relationship = ?, title = ?, story = ?, social_url = ? WHERE id = ? AND status = 'approved' AND COALESCE(story, '') = ?"
    ).bind(name, relationship, title, story, socialUrl || null, id, originalStory).run();
    if (!result.meta.changes) return Response.json({ error: "This memory changed since you opened the editor. Reload the page to see the current text, then apply your edits again." }, { status: 409 });
    return Response.json({ ok: true, id, status: "approved" });
  }

  if (action !== "approve" && action !== "reject") {
    return Response.json({ error: "Invalid review action." }, { status: 400 });
  }

  const status = action === "approve" ? "approved" : "rejected";
  const memory = await env.DB.prepare(
    "SELECT photo2_key AS photo2Key, photo3_key AS photo3Key, photo4_key AS photo4Key, photo5_key AS photo5Key, photo_key AS photoKey, video_key AS videoKey, video_name AS videoName, pdf_key AS pdfKey FROM memories WHERE id = ? AND status = ?"
  ).bind(id, "pending").first<{ photo2Key: string | null; photo3Key: string | null; photo4Key: string | null; photo5Key: string | null; photoKey: string | null; videoKey: string | null; videoName: string | null; pdfKey: string | null }>();
  if (action === "approve" && memory?.videoKey) {
    if (env.BUCKET) {
      for (const key of [memory.photoKey, memory.photo2Key, memory.photo3Key, memory.photo4Key, memory.photo5Key]) if (key) await env.BUCKET.delete(key);
    }
    const result = await env.DB.prepare(
      "UPDATE memories SET status = ?, photo_key = NULL, photo_name = NULL, photo2_key = NULL, photo2_name = NULL, photo3_key = NULL, photo3_name = NULL, photo4_key = NULL, photo4_name = NULL, photo5_key = NULL, photo5_name = NULL WHERE id = ? AND status = ?"
    ).bind(status, id, "pending").run();
    if (!result.meta.changes) {
      return Response.json({ error: "This submission is no longer pending." }, { status: 409 });
    }
  } else {
    const result = await env.DB.prepare(
      "UPDATE memories SET status = ? WHERE id = ? AND status = ?"
    ).bind(status, id, "pending").run();
    if (!result.meta.changes) {
      return Response.json({ error: "This submission is no longer pending." }, { status: 409 });
    }
  }
  if (action === "reject" && env.BUCKET) {
    for (const key of [memory?.photoKey, memory?.photo2Key, memory?.photo3Key, memory?.photo4Key, memory?.photo5Key]) if (key) await env.BUCKET.delete(key);
    if (memory?.videoKey) await env.BUCKET.delete(memory.videoKey);
    if (memory?.pdfKey) await env.BUCKET.delete(memory.pdfKey);
    await env.DB.prepare("UPDATE memories SET photo_key = NULL, photo_name = NULL, photo2_key = NULL, photo2_name = NULL, photo3_key = NULL, photo3_name = NULL, photo4_key = NULL, photo4_name = NULL, photo5_key = NULL, photo5_name = NULL, pdf_key = NULL, pdf_name = NULL, video_key = NULL, video_name = NULL WHERE id = ?").bind(id).run();
  }
  return Response.json({ ok: true, id, status });
}

export async function DELETE(request: Request) {
  if (!await moderatorEmail(request)) {
    return Response.json({ error: "Owner access is required." }, { status: 403 });
  }
  if (!env.DB || !env.BUCKET) {
    return Response.json({ error: "The memorial archive is unavailable." }, { status: 503 });
  }

  const id = Number(new URL(request.url).searchParams.get("id"));
  const mode = new URL(request.url).searchParams.get("mode") || "all";
  if (!Number.isInteger(id) || id < 1 || !["text", "photo", "photo2", "photo3", "photo4", "photo5", "pdf", "video", "link", "all"].includes(mode)) {
    return Response.json({ error: "Invalid memory." }, { status: 400 });
  }

  const memory = await env.DB.prepare(
    "SELECT story, photo2_key AS photo2Key, photo3_key AS photo3Key, photo4_key AS photo4Key, photo5_key AS photo5Key, photo_key AS photoKey, video_key AS videoKey, video_name AS videoName, pdf_key AS pdfKey, social_url AS socialUrl FROM memories WHERE id = ? AND status = 'approved'"
  ).bind(id).first<{ story: string; photo2Key: string | null; photo3Key: string | null; photo4Key: string | null; photo5Key: string | null; photoKey: string | null; videoKey: string | null; videoName: string | null; pdfKey: string | null; socialUrl: string | null }>();
  if (!memory) {
    return Response.json({ error: "Published memory not found." }, { status: 404 });
  }

  if (mode === "text") {
    const photoKeys = [memory.photoKey, memory.photo2Key, memory.photo3Key, memory.photo4Key, memory.photo5Key].filter((key): key is string => Boolean(key));
    await env.DB.batch([
      ...photoKeys.map(key => env.DB.prepare(
        "INSERT INTO gallery_items (kind, title, caption, object_key, external_url, published, created_at) VALUES ('image', 'Community photograph', NULL, ?, NULL, 1, ?)"
      ).bind(key, new Date().toISOString())),
      env.DB.prepare("DELETE FROM memories WHERE id = ? AND status = 'approved'").bind(id),
    ]);
    if (memory.videoKey) await env.BUCKET.delete(memory.videoKey);
    if (memory.pdfKey) await env.BUCKET.delete(memory.pdfKey);
    return Response.json({ ok: true, id, deleted: "text" });
  }

  if (["photo", "photo2", "photo3", "photo4", "photo5"].includes(mode)) {
    const key = mode === "photo4" ? memory.photo4Key : mode === "photo5" ? memory.photo5Key : mode === "photo2" ? memory.photo2Key : mode === "photo3" ? memory.photo3Key : memory.photoKey;
    if (!key) return Response.json({ error: "This memory has no photo in that slot." }, { status: 404 });
    const keyColumn = mode === "photo" ? "photo_key" : `${mode}_key`;
    const nameColumn = mode === "photo" ? "photo_name" : `${mode}_name`;
    await env.DB.prepare(`UPDATE memories SET ${keyColumn} = NULL, ${nameColumn} = NULL WHERE id = ? AND status = 'approved'`).bind(id).run();
    await env.BUCKET.delete(key);
    return Response.json({ ok: true, id, deleted: mode });
  }

  if (mode === "pdf") {
    if (!memory.pdfKey) return Response.json({ error: "This memory has no PDF." }, { status: 404 });
    if (!memory.story && !memory.videoKey && !memory.socialUrl) return Response.json({ error: "This PDF is the only story content. Use Delete all to remove the memory." }, { status: 409 });
    await env.BUCKET.delete(memory.pdfKey);
    await env.DB.prepare("UPDATE memories SET pdf_key = NULL, pdf_name = NULL WHERE id = ? AND status = 'approved'").bind(id).run();
    return Response.json({ ok: true, id, deleted: "pdf" });
  }

  if (mode === "video") {
    if (!memory.videoKey) return Response.json({ error: "This memory has no video." }, { status: 404 });
    if (!memory.story && !memory.pdfKey && !memory.socialUrl) return Response.json({ error: "This video is the only story content. Use Delete all to remove the memory." }, { status: 409 });
    await env.BUCKET.delete(memory.videoKey);
    await env.DB.prepare("UPDATE memories SET video_key = NULL, video_name = NULL WHERE id = ? AND status = 'approved'").bind(id).run();
    return Response.json({ ok: true, id, deleted: "video" });
  }
  if (mode === "link") {
    if (!memory.socialUrl) return Response.json({ error: "This memory has no public link." }, { status: 404 });
    if (!memory.story && !memory.videoKey && !memory.pdfKey) return Response.json({ error: "This link is the only story content. Use Delete all to remove the memory." }, { status: 409 });
    await env.DB.prepare("UPDATE memories SET social_url = NULL WHERE id = ? AND status = 'approved'").bind(id).run();
    return Response.json({ ok: true, id, deleted: "link" });
  }

  for (const key of [memory.photoKey, memory.photo2Key, memory.photo3Key, memory.photo4Key, memory.photo5Key]) if (key) await env.BUCKET.delete(key);
  if (memory.videoKey) await env.BUCKET.delete(memory.videoKey);
    if (memory.pdfKey) await env.BUCKET.delete(memory.pdfKey);
  await env.DB.prepare("DELETE FROM memories WHERE id = ? AND status = 'approved'").bind(id).run();
  return Response.json({ ok: true, id, deleted: "memory" });
}
