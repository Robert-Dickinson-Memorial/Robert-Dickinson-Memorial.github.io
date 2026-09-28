import { env } from "cloudflare:workers";
import { isOwnerRequest } from "../../../moderation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isOwnerRequest(request)) return Response.json({ error: "Owner access is required." }, { status: 403 });
  if (!env.DB || !env.BUCKET) return Response.json({ error: "The memorial archive is unavailable." }, { status: 503 });

  const form = await request.formData();
  const id = Number(form.get("id"));
  const file = form.get("file");
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Invalid memory." }, { status: 400 });
  if (!(file instanceof File) || !file.size || file.size > 15 * 1024 * 1024 ||
      !/\.pdf$/i.test(file.name) || !["application/pdf", "application/octet-stream", ""].includes(file.type) ||
      await file.slice(0, 5).text() !== "%PDF-") {
    return Response.json({ error: "Choose a valid PDF file up to 15 MB." }, { status: 400 });
  }

  const current = await env.DB.prepare("SELECT pdf_key AS pdfKey FROM memories WHERE id = ? AND status = 'approved'")
    .bind(id).first<{ pdfKey: string | null }>();
  if (!current) return Response.json({ error: "Published memory not found." }, { status: 404 });
  const expectedKey = form.get("expectedPdfKey");
  if (typeof expectedKey === "string" && expectedKey !== (current.pdfKey || "")) {
    return Response.json({ error: "This PDF changed since you opened the editor. Reload and try again." }, { status: 409 });
  }

  const objectKey = `memory-pdfs/${crypto.randomUUID()}`;
  const pdfName = file.name.trim().slice(0, 240) || "shared-memory.pdf";
  try {
    await env.BUCKET.put(objectKey, file.stream(), {
      httpMetadata: { contentType: "application/pdf" }, customMetadata: { originalName: pdfName },
    });
    const result = await env.DB.prepare(
      "UPDATE memories SET pdf_key = ?, pdf_name = ? WHERE id = ? AND status = 'approved' AND pdf_key IS ?"
    ).bind(objectKey, pdfName, id, current.pdfKey).run();
    if (!result.meta.changes) {
      await env.BUCKET.delete(objectKey);
      return Response.json({ error: "This memory changed while you were editing it. Reload and try again." }, { status: 409 });
    }
  } catch {
    try { await env.BUCKET.delete(objectKey); } catch {}
    return Response.json({ error: "The PDF could not be saved. The previous PDF is still available." }, { status: 500 });
  }

  if (current.pdfKey) {
    const stillUsed = await env.DB.prepare("SELECT COUNT(*) AS count FROM memories WHERE pdf_key = ?")
      .bind(current.pdfKey).first<{ count: number }>();
    if (!stillUsed?.count) {
      try { await env.BUCKET.delete(current.pdfKey); } catch { console.warn("Previous memory PDF cleanup failed"); }
    }
  }
  return Response.json({ ok: true, id, pdfKey: objectKey, pdfName });
}
