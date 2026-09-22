import { env } from "cloudflare:workers";
import { sendReviewNotification } from "../../moderation";
import { isAllowedPublicOrigin, publicJson, publicOptions } from "../../cors";

export const dynamic = "force-dynamic";

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET() {
  try {
    if (!env.DB) throw new Error("Database unavailable");
    const result = await env.DB.prepare(
      `SELECT id, name, relationship, title, story, photo_key AS photoKey,
              featured_quote AS featuredQuote, quote_excerpt AS quoteExcerpt
       FROM memories WHERE status = ? ORDER BY created_at DESC, id DESC LIMIT 50`
    ).bind("approved").all();
    return publicJson({ memories: result.results });
  } catch {
    return publicJson({ memories: [] });
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
    let name = "", relationship = "", email = "", title = "", story = "", website = "";
    let consent = false;
    let photo: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      name = clean(form.get("name"), 100);
      relationship = clean(form.get("relationship"), 120);
      email = clean(form.get("email"), 200);
      title = clean(form.get("title"), 160);
      story = clean(form.get("story"), 6000);
      website = clean(form.get("website"), 200);
      consent = form.get("consent") === "on";
      const candidate = form.get("photo");
      photo = candidate instanceof File && candidate.size > 0 ? candidate : null;
    } else {
      const body = await request.json() as Record<string, unknown>;
      name = clean(body.name, 100);
      relationship = clean(body.relationship, 120);
      email = clean(body.email, 200);
      title = clean(body.title, 160);
      story = clean(body.story, 6000);
      consent = true;
    }

    if (website) return publicJson({ ok: true, status: "pending_review" }, { status: 201 });

    if (name.length < 2 || relationship.length < 2 || title.length < 2 || story.length < 20) {
      return publicJson({ error: "Please complete your name, connection, title, and story." }, { status: 400 });
    }
    if (!consent) {
      return publicJson({ error: "Permission is required before we can accept a submission." }, { status: 400 });
    }

    let photoKey: string | null = null;
    let photoName: string | null = null;
    if (photo) {
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (!allowed.includes(photo.type) || photo.size > 8 * 1024 * 1024) {
        return publicJson({ error: "Please choose a JPG, PNG, or WebP image under 8 MB." }, { status: 400 });
      }
      if (!env.BUCKET) throw new Error("Photo storage is temporarily unavailable.");
      photoKey = `pending/${crypto.randomUUID()}`;
      photoName = clean(photo.name, 240);
      await env.BUCKET.put(photoKey, photo.stream(), {
        httpMetadata: { contentType: photo.type },
        customMetadata: { originalName: photoName },
      });
    }

    try {
      await env.DB.prepare(
        `INSERT INTO memories
         (name, relationship, email, title, story, photo_key, photo_name, status, consent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(name, relationship, email || null, title, story, photoKey, photoName, "pending", 1, new Date().toISOString()).run();
    } catch (error) {
      if (photoKey && env.BUCKET) await env.BUCKET.delete(photoKey);
      throw error;
    }

    try {
      await sendReviewNotification({
        name,
        relationship,
        title,
        reviewUrl: new URL("/review", request.url).toString(),
      });
    } catch (notificationError) {
      console.warn("Review notification could not be sent", notificationError);
    }

    return publicJson({ ok: true, status: "pending_review" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save this memory.";
    return publicJson({ error: message }, { status: 500 });
  }
}
