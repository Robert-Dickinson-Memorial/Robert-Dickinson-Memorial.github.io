import { env } from "cloudflare:workers";
import { sendReviewNotification } from "../../moderation";
import { isAllowedPublicOrigin, publicJson, publicOptions } from "../../cors";
import { pendingMemory, tokenHash } from "../../memory-preview";

export const dynamic = "force-dynamic";

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

export async function GET() {
  try {
    if (!env.DB) throw new Error("Database unavailable");
    const result = await env.DB.prepare(
      `SELECT id, name, relationship, title, story, photo_key AS photoKey, photo2_key AS photo2Key, photo3_key AS photo3Key,
              video_key AS videoKey, video_name AS videoName, pdf_key AS pdfKey, social_url AS socialUrl,
              created_at AS createdAt
       FROM memories WHERE status = ?
       ORDER BY CASE
         WHEN id = 11 THEN 0
         WHEN lower(trim(name)) IN ('haishan chen', 'hanshan chen') THEN 1
         WHEN lower(trim(name)) = 'david schimel' THEN 2
         ELSE 3 END,
         created_at ASC, id ASC`
    ).bind("approved").all();
    return publicJson({ memories: result.results });
  } catch {
    return publicJson({ error: "Memories are temporarily unavailable." }, { status: 503 });
  }
}

export function OPTIONS() {
  return publicOptions();
}

export async function POST(request: Request) {
  try {
    if (!isAllowedPublicOrigin(request)) {
      return publicJson({ error: "This submission source is not allowed." }, { status: 403 });
    }
    if (!env.DB) throw new Error("The memorial archive is temporarily unavailable.");
    const contentType = request.headers.get("content-type") || "";
    let name = "", relationship = "", email = "", title = "", story = "", website = "", socialUrl = "", socialUrlRaw = "";
    let editId = 0, editToken = "";
    let consent = false;
    let photo: File | null = null;
    let photos: File[] = [];
    const extraPhotos: { key: string; name: string }[] = [];
    let pdf: File | null = null;
    let video: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      // Bound the request before multipart parsing, including chunked requests.
      const maxBody = 92 * 1024 * 1024;
      if (Number(request.headers.get("content-length")) > maxBody) return publicJson({ error: "Attachments are too large. Video limit: 50 MB." }, { status: 413 });
      let received = 0;
      const bounded = request.body?.pipeThrough(new TransformStream({ transform(chunk, controller) {
        received += chunk.byteLength;
        if (received > maxBody) throw new Error("Attachments exceed the upload limit.");
        controller.enqueue(chunk);
      } }));
      const form = await new Response(bounded, { headers: { "content-type": contentType } }).formData();
      name = clean(form.get("name"), 100);
      relationship = clean(form.get("relationship"), 120);
      email = clean(form.get("email"), 200);
      title = clean(form.get("title"), 160);
      story = clean(form.get("story"), 6000);
      website = clean(form.get("website"), 200);
      socialUrlRaw = clean(form.get("socialUrl"), 1000);
      socialUrl = cleanPublicUrl(socialUrlRaw);
      consent = form.get("consent") === "on";
      editId = Number(form.get("editId") || 0);
      editToken = clean(form.get("editToken"), 64);
      photos = form.getAll("photo").filter((file): file is File => file instanceof File && file.size > 0);
      if (photos.length > 3) return publicJson({ error: "Choose up to three photos." }, { status: 400 });
      if (photos.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024)) return publicJson({ error: "Each photo must be JPG, PNG, or WebP, up to 8 MB." }, { status: 400 });
      photo = photos[0] || null;
      const videoCandidate = form.get("video");
      video = videoCandidate instanceof File && videoCandidate.size > 0 ? videoCandidate : null;
      const pdfCandidate = form.get("pdf");
      pdf = pdfCandidate instanceof File && pdfCandidate.size > 0 ? pdfCandidate : null;
    } else {
      const body = await request.json() as Record<string, unknown>;
      name = clean(body.name, 100);
      relationship = clean(body.relationship, 120);
      email = clean(body.email, 200);
      title = clean(body.title, 160);
      story = clean(body.story, 6000);
      socialUrlRaw = clean(body.socialUrl, 1000);
      socialUrl = cleanPublicUrl(socialUrlRaw);
      consent = true;
    }

    if (website) return publicJson({ ok: true, status: "pending_review" }, { status: 201 });

    const previous = editId || editToken ? await pendingMemory(editId, editToken) : null;
    if ((editId || editToken) && !previous) return publicJson({ error: "This private edit link is no longer available." }, { status: 403 });

    if (name.length < 2 || relationship.length < 2 || title.length < 2) {
      return publicJson({ error: "Please complete your name, connection, and title." }, { status: 400 });
    }
    if (socialUrlRaw && !socialUrl) {
      return publicJson({ error: "Please enter a valid HTTPS link to the public post." }, { status: 400 });
    }
    if (story && story.length < 20) {
      return publicJson({ error: "Please write at least 20 characters, or leave the story field blank and share a PDF, video, or public post instead." }, { status: 400 });
    }
    if (!story && !pdf && !video && !socialUrl && !previous?.pdfKey && !previous?.videoKey) {
      return publicJson({ error: "Please share your story as written text, a PDF, video, or a public social-media link." }, { status: 400 });
    }
    if (!consent) {
      return publicJson({ error: "Permission is required before we can accept a submission." }, { status: 400 });
    }

    if (video) {
      const header = new Uint8Array(await video.slice(0, 12).arrayBuffer());
      const mp4 = /\.mp4$/i.test(video.name) && String.fromCharCode(...header.slice(4, 8)) === "ftyp";
      const webm = /\.webm$/i.test(video.name) && [0x1a, 0x45, 0xdf, 0xa3].every((v, i) => header[i] === v);
      if (video.size > 50 * 1024 * 1024 || (!mp4 && !webm)) return publicJson({ error: "Choose an MP4 or WebM video up to 50 MB. MP4 with H.264 video and AAC audio is recommended." }, { status: 400 });
    }
    let videoKey: string | null = null;
    let videoName: string | null = null;
    let photoKey: string | null = null;
    let photoName: string | null = null;
    let pdfKey: string | null = null;
    let pdfName: string | null = null;


    if (pdf) {
      const hasPdfType = pdf.type === "application/pdf" || ((!pdf.type || pdf.type === "application/octet-stream") && /\.pdf$/i.test(pdf.name));
      const signature = await pdf.slice(0, 5).text();
      if (!hasPdfType || signature !== "%PDF-" || pdf.size > 15 * 1024 * 1024) {
        if (photoKey && env.BUCKET) await env.BUCKET.delete(photoKey);
        for (const item of extraPhotos) if (env.BUCKET) await env.BUCKET.delete(item.key);
        return publicJson({ error: "Please choose a valid PDF file up to 15 MB." }, { status: 400 });
      }
      if (!env.BUCKET) {
        throw new Error("File storage is temporarily unavailable.");
      }
      pdfKey = `pending-pdfs/${crypto.randomUUID()}`;
      pdfName = clean(pdf.name, 240) || "shared-memory.pdf";
      await env.BUCKET.put(pdfKey, pdf.stream(), {
        httpMetadata: { contentType: "application/pdf", contentDisposition: `inline; filename="${pdfName.replace(/["\\]/g, "_")}"` },
        customMetadata: { originalName: pdfName },
      });
    }

    try {
    if (photo) {
      if (!env.BUCKET) throw new Error("Photo storage is temporarily unavailable.");
      try {
        for (const [index, file] of photos.entries()) {
          const key = `pending/${crypto.randomUUID()}`;
          const name = clean(file.name, 240);
          if (index === 0) { photoKey = key; photoName = name; }
          else extraPhotos.push({ key, name });
          await env.BUCKET.put(key, file.stream(), {
            httpMetadata: { contentType: file.type },
            customMetadata: { originalName: name },
          });
        }
      } catch (error) {
        if (photoKey) await env.BUCKET.delete(photoKey);
        for (const item of extraPhotos) await env.BUCKET.delete(item.key);
        throw error;
      }
    }
      if (video) {
        if (!env.BUCKET) throw new Error("Video storage is temporarily unavailable.");
        videoKey = `pending-videos/${crypto.randomUUID()}`;
        videoName = clean(video.name, 240);
        await env.BUCKET.put(videoKey, video.stream(), { httpMetadata: { contentType: /\.webm$/i.test(video.name) ? "video/webm" : "video/mp4" } });
      }
      if (previous) {
        const result = await env.DB.prepare(
          `UPDATE memories SET name = ?, relationship = ?, title = ?, story = ?, social_url = ?,
            photo_key = ?, photo_name = ?, photo2_key = ?, photo2_name = ?, photo3_key = ?, photo3_name = ?, pdf_key = ?, pdf_name = ?, video_key = ?, video_name = ?
           WHERE id = ? AND status = 'pending' AND preview_token_hash = ?`
        ).bind(name, relationship, title, story, socialUrl || null,
          photoKey || previous.photoKey, photoName || previous.photoName,
          photo ? extraPhotos[0]?.key || null : previous.photo2Key, photo ? extraPhotos[0]?.name || null : previous.photo2Name,
          photo ? extraPhotos[1]?.key || null : previous.photo3Key, photo ? extraPhotos[1]?.name || null : previous.photo3Name,
          pdfKey || previous.pdfKey, pdfName || previous.pdfName,
          videoKey || previous.videoKey, videoName || previous.videoName,
          editId, await tokenHash(editToken)).run();
        if (!result.meta.changes) throw new Error("This submission was reviewed while you edited it. Please reload its preview.");
      } else {
        editToken = [...crypto.getRandomValues(new Uint8Array(32))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
        const result = await env.DB.prepare(
          `INSERT INTO memories
           (name, relationship, email, title, story, photo_key, photo_name, photo2_key, photo2_name, photo3_key, photo3_name, pdf_key, pdf_name, video_key, video_name, social_url, status, consent, created_at, preview_token_hash)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(name, relationship, email || null, title, story, photoKey, photoName, extraPhotos[0]?.key || null, extraPhotos[0]?.name || null, extraPhotos[1]?.key || null, extraPhotos[1]?.name || null, pdfKey, pdfName, videoKey, videoName, socialUrl || null, "pending", 1, new Date().toISOString(), await tokenHash(editToken)).run();
        editId = Number(result.meta.last_row_id);
      }
    } catch (error) {
      if (photoKey && env.BUCKET) await env.BUCKET.delete(photoKey);
        for (const item of extraPhotos) if (env.BUCKET) await env.BUCKET.delete(item.key);
      if (pdfKey && env.BUCKET) await env.BUCKET.delete(pdfKey);
      if (videoKey && env.BUCKET) await env.BUCKET.delete(videoKey);
      throw error;
    }

    if (previous && env.BUCKET) {
      try {
        if (photoKey) for (const key of [previous.photo2Key, previous.photo3Key]) if (key) await env.BUCKET.delete(key);
        if (photoKey && previous.photoKey && previous.photoKey !== photoKey) await env.BUCKET.delete(previous.photoKey);
        if (pdfKey && previous.pdfKey && previous.pdfKey !== pdfKey) await env.BUCKET.delete(previous.pdfKey);
        if (videoKey && previous.videoKey && previous.videoKey !== videoKey) await env.BUCKET.delete(previous.videoKey);
      } catch (cleanupError) { console.warn("Old preview attachment cleanup failed", cleanupError); }
    }

    try {
      if (!previous) {
        await sendReviewNotification({
          name,
          relationship,
          title,
          reviewUrl: new URL("/review", request.url).toString(),
        });
      }
    } catch (notificationError) {
      console.warn("Review notification could not be sent", notificationError);
    }

    return publicJson({ ok: true, status: "pending_review", id: editId, editToken }, { status: previous ? 200 : 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save this memory.";
    return publicJson({ error: message }, { status: 500 });
  }
}
