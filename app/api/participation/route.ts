import { env } from "cloudflare:workers";
import { isAllowedPublicOrigin, publicJson, publicOptions } from "../../cors";
import { contributorCount } from "../../participation";

export const dynamic = "force-dynamic";

const projects = new Set(["Chippewa National Forest", "Amazon rainforest", "Arizona", "Georgia", "Texas", "Colorado", "California", "Massachusetts & New England"]);

export async function GET() {
  try {
    if (!env.DB) throw new Error("Database unavailable");
    const [memory, tree] = await Promise.all([
      env.DB.prepare("SELECT name FROM memories WHERE status = 'approved' AND trim(name) <> ''").all<{ name: string }>(),
      env.DB.prepare("SELECT COALESCE(SUM(tree_count), 0) AS total FROM tree_dedications WHERE status = 'approved'").first<{ total: number }>(),
    ]);
    return publicJson({
      memories: contributorCount((memory.results ?? []).map((row) => row.name)),
      trees: Number(tree?.total ?? 0),
    });
  } catch {
    return publicJson({ error: "Participation totals are temporarily unavailable." }, { status: 503 });
  }
}

export function OPTIONS() { return publicOptions(); }

export async function POST(request: Request) {
  if (!isAllowedPublicOrigin(request)) return publicJson({ error: "This submission source is not allowed." }, { status: 403 });
  if (!env.DB) return publicJson({ error: "The memorial archive is temporarily unavailable." }, { status: 503 });
  try {
    if (Number(request.headers.get("content-length")) > 4096) return publicJson({ error: "Submission is too large." }, { status: 413 });
    const body = await request.json() as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";
    const project = typeof body.project === "string" ? body.project.trim() : "";
    const treeCount = Number(body.treeCount);
    if (body.website) return publicJson({ ok: true, status: "pending_review" }, { status: 201 });
    if (
      name.length < 2 ||
      !projects.has(project) ||
      !Number.isSafeInteger(treeCount) ||
      treeCount < 1 ||
      treeCount > 10000 ||
      (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
      body.confirmed !== true
    ) {
      return publicJson({ error: "Enter your name, project, and number of trees, and confirm that you made the dedication through the provider." }, { status: 400 });
    }
    await env.DB.prepare("INSERT INTO tree_dedications (name, email, project, tree_count, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)")
      .bind(name, email || null, project, treeCount, new Date().toISOString()).run();
    return publicJson({ ok: true, status: "pending_review" }, { status: 201 });
  } catch {
    return publicJson({ error: "Unable to record the dedication. Please try again." }, { status: 400 });
  }
}
