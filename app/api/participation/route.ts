import { env } from "cloudflare:workers";
import { isAllowedPublicOrigin, publicJson, publicOptions } from "../../cors";

export const dynamic = "force-dynamic";

const contributionRoutes = {
  "chippewa-arbor-day": {
    project: "Chippewa National Forest",
    provider: "Arbor Day Foundation",
    type: "tree",
    basis: "provider-reported exact tree quantity",
    geographicScope: "exact_forest",
    geographicLabel: "Chippewa National Forest",
  },
  // Legacy alias kept so an already-open browser tab can still submit safely.
  "chippewa-living-tribute": {
    project: "Minnesota forests",
    provider: "A Living Tribute",
    type: "tree",
    basis: "provider-reported exact tree quantity",
    geographicScope: "state",
    geographicLabel: "Minnesota",
  },
  "minnesota-living-tribute": {
    project: "Minnesota forests",
    provider: "A Living Tribute",
    type: "tree",
    basis: "provider-reported exact tree quantity",
    geographicScope: "state",
    geographicLabel: "Minnesota",
  },
  "chippewa-usda": {
    project: "Chippewa National Forest",
    provider: "USDA Forest Service Plant-A-Tree",
    type: "restoration",
    basis: "restoration gift; provider does not assign an exact tree quantity and may redirect funds if the requested forest has no immediate planting need",
    geographicScope: "requested_forest",
    geographicLabel: "Chippewa requested · U.S. National Forest system",
  },
  "global-one-tree-planted": {
    project: "Forests where restoration is most needed",
    provider: "One Tree Planted",
    type: "tree",
    basis: "provider-reported exact tree quantity",
    geographicScope: "greatest_need",
    geographicLabel: "Where needed most",
  },
  "amazon-tree-nation": {
    project: "Amazon rainforest",
    provider: "Tree-Nation / Rioterra",
    type: "tree",
    basis: "provider-reported exact tree quantity",
    geographicScope: "specific_project",
    geographicLabel: "Brazilian Amazon · Rioterra",
  },
  "amazon-conservation": {
    project: "Amazon rainforest",
    provider: "Amazon Conservation",
    type: "restoration",
    basis: "restoration gift; no exact tree quantity assigned",
    geographicScope: "region",
    geographicLabel: "Amazon rainforest",
  },
  "arizona-living-tribute": {
    project: "Arizona",
    provider: "A Living Tribute",
    type: "tree",
    basis: "provider-reported exact tree quantity",
    geographicScope: "state",
    geographicLabel: "Arizona",
  },
  "georgia-living-tribute": {
    project: "Georgia",
    provider: "A Living Tribute",
    type: "tree",
    basis: "provider-reported exact tree quantity",
    geographicScope: "state",
    geographicLabel: "Georgia",
  },
  "texas-living-tribute": {
    project: "Texas",
    provider: "A Living Tribute",
    type: "tree",
    basis: "provider-reported exact tree quantity",
    geographicScope: "state",
    geographicLabel: "Texas",
  },
  "colorado-csfs": {
    project: "Colorado",
    provider: "Colorado State Forest Service",
    type: "tree",
    basis: "official Restoring Colorado's Forests Fund conversion: $2 funds one seedling",
    geographicScope: "state",
    geographicLabel: "Colorado",
  },
  "california-living-tribute": {
    project: "California",
    provider: "A Living Tribute",
    type: "tree",
    basis: "provider-reported exact tree quantity",
    geographicScope: "state",
    geographicLabel: "California",
  },
  "massachusetts-esplanade": {
    project: "Massachusetts",
    provider: "Esplanade Association",
    type: "tree",
    basis: "one new tree sponsorship",
    geographicScope: "specific_project",
    geographicLabel: "Charles River Esplanade · Boston, Massachusetts",
  },
  "new-england-neff": {
    project: "Massachusetts & New England",
    provider: "New England Forestry Foundation",
    type: "restoration",
    basis: "regional forest restoration gift; no exact tree quantity assigned",
    geographicScope: "region",
    geographicLabel: "New England",
  },
} as const;

type ContributionRoute = keyof typeof contributionRoutes;

export async function GET() {
  try {
    if (!env.DB) throw new Error("Database unavailable");
    const [memory, tree, restoration, geography] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) AS total FROM memories WHERE status = 'approved'").first<{ total: number }>(),
      env.DB.prepare("SELECT COALESCE(SUM(reported_tree_count), 0) AS total FROM tree_dedications WHERE status = 'approved' AND contribution_type = 'tree' AND payment_confirmed = 1").first<{ total: number }>(),
      env.DB.prepare("SELECT COUNT(*) AS total FROM tree_dedications WHERE status = 'approved' AND contribution_type = 'restoration' AND payment_confirmed = 1").first<{ total: number }>(),
      env.DB.prepare("SELECT COALESCE(geographic_label, project) AS label, geographic_scope AS scope, COALESCE(SUM(reported_tree_count), 0) AS trees FROM tree_dedications WHERE status = 'approved' AND contribution_type = 'tree' AND payment_confirmed = 1 GROUP BY COALESCE(geographic_label, project), geographic_scope ORDER BY trees DESC").all<{ label: string; scope: string; trees: number }>(),
    ]);
    return publicJson({
      memories: Number(memory?.total ?? 0),
      trees: Number(tree?.total ?? 0),
      restorationGifts: Number(restoration?.total ?? 0),
      geography: (geography.results ?? []).map((row) => ({ label: row.label, scope: row.scope, trees: Number(row.trees ?? 0) })),
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
    const routeId = typeof body.route === "string" ? body.route.trim() as ContributionRoute : "" as ContributionRoute;
    const route = contributionRoutes[routeId];
    const confirmationRef = typeof body.confirmationRef === "string" ? body.confirmationRef.trim().slice(0, 120) : "";
    const treeCount = Number(body.treeCount);

    if (body.website) return publicJson({ ok: true, status: "pending_review" }, { status: 201 });

    const treeQuantityValid = route?.type === "restoration" || (Number.isSafeInteger(treeCount) && treeCount >= 1 && treeCount <= 10000);
    if (
      name.length < 2 ||
      !route ||
      !treeQuantityValid ||
      (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
      body.confirmed !== true
    ) {
      return publicJson({ error: "Enter your name and contribution, confirm that payment completed successfully, and report the provider's tree quantity when applicable." }, { status: 400 });
    }

    const reportedTreeCount = route.type === "tree" ? treeCount : null;
    const legacyTreeCount = route.type === "tree" ? treeCount : 1;

    await env.DB.prepare(
      "INSERT INTO tree_dedications (name, email, project, provider, contribution_type, tree_count, reported_tree_count, count_basis, geographic_scope, geographic_label, confirmation_ref, payment_confirmed, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'pending', ?)"
    ).bind(
      name,
      email || null,
      route.project,
      route.provider,
      route.type,
      legacyTreeCount,
      reportedTreeCount,
      route.basis,
      route.geographicScope,
      route.geographicLabel,
      confirmationRef || null,
      new Date().toISOString()
    ).run();

    return publicJson({
      ok: true,
      status: "pending_review",
      contributionType: route.type,
      geographicScope: route.geographicScope,
      geographicLabel: route.geographicLabel,
    }, { status: 201 });
  } catch {
    return publicJson({ error: "Unable to record the dedication. Please try again." }, { status: 400 });
  }
}
