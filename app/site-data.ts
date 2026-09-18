import { env } from "cloudflare:workers";

export type MemorialEvent = {
  id: number;
  title: string;
  startAt: string;
  endAt: string | null;
  location: string | null;
  description: string | null;
  linkLabel: string | null;
  linkUrl: string | null;
};

export type GalleryItem = {
  id: number;
  kind: "image" | "video";
  title: string;
  caption: string | null;
  objectKey: string | null;
  externalUrl: string | null;
  createdAt: string;
};

export const defaultContent = {
  heroIntro: "Pioneering climate scientist, visionary Earth-system modeler, devoted teacher, and generous mentor.",
  obituaryStory: [
    "Robert Earl Dickinson helped change how humanity understands the living Earth.",
    "Born in Millersburg, Ohio, and raised in Minnesota, Robert carried an expansive curiosity into a lifetime of science. He studied chemistry and physics at Harvard University, graduating in 1961, then turned to meteorology at the Massachusetts Institute of Technology, earning his master’s degree in 1962 and Ph.D. in 1966.",
    "He joined the National Center for Atmospheric Research in 1968. Early in his career, he advanced understanding of how planetary waves transfer energy through the atmosphere. Later, as a leader in NCAR’s Climate and Global Dynamics Division, he confronted a central weakness in the era’s climate models: land was treated largely as a passive store of water. Robert helped recast it as a dynamic system of soils, plants, water, energy, and carbon.",
    "That insight reshaped global climate modeling. His pioneering work brought vegetation and land-surface processes into climate models and helped establish the intellectual foundations of modern Earth-system science. Across five decades, his research connected atmospheric dynamics with hydrology, drought, remote sensing, aerosols, tropical deforestation, and the terrestrial carbon cycle.",
    "Robert held professorships at the University of Arizona and Georgia Tech before joining The University of Texas at Austin in 2008. At UT’s Jackson School of Geosciences, he was known not only as a giant of climate science, but as a patient and exacting mentor. He advised students across the climate program, welcomed researchers from around the world, and continued helping young scientists even after retiring from full-time research.",
    "His deepest legacy lives in both the models that now describe a more complete Earth and the people he trained to ask better questions of it.",
  ].join("\n\n"),
  treeTribute: "Robert grew up in Minnesota. A memorial tree in the Chippewa National Forest honors that connection while helping restore a landscape of pine, spruce, cedar, lakes, and headwater streams.",
  treeDetail: "Reforestation projects in the Chippewa restore native trees, strengthen wildlife habitat—including habitat for bald eagles—and improve the forest’s resilience to wind damage, insects, disease, and a changing climate.",
};

export async function getSiteContent(): Promise<typeof defaultContent> {
  if (!env.DB) return defaultContent;
  try {
    const result = await env.DB.prepare("SELECT key, value FROM site_content").all<{ key: string; value: string }>();
    const values = Object.fromEntries((result.results ?? []).map((row) => [row.key, row.value]));
    return {
      heroIntro: values.heroIntro || defaultContent.heroIntro,
      obituaryStory: values.obituaryStory || defaultContent.obituaryStory,
      treeTribute: values.treeTribute || defaultContent.treeTribute,
      treeDetail: values.treeDetail || defaultContent.treeDetail,
    };
  } catch {
    return defaultContent;
  }
}

export async function getPublishedEvents(): Promise<MemorialEvent[]> {
  if (!env.DB) return [];
  try {
    const result = await env.DB.prepare(
      `SELECT id, title, start_at AS startAt, end_at AS endAt, location, description,
              link_label AS linkLabel, link_url AS linkUrl
       FROM events WHERE published = 1 ORDER BY start_at ASC, id ASC`
    ).all<MemorialEvent>();
    return result.results ?? [];
  } catch {
    return [];
  }
}

export async function getPublishedGallery(): Promise<GalleryItem[]> {
  if (!env.DB) return [];
  try {
    const result = await env.DB.prepare(
      `SELECT id, kind, title, caption, object_key AS objectKey,
              external_url AS externalUrl, created_at AS createdAt
       FROM gallery_items WHERE published = 1 ORDER BY created_at DESC, id DESC`
    ).all<GalleryItem>();
    return result.results ?? [];
  } catch {
    return [];
  }
}

export function videoEmbedUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
    if (url.hostname.endsWith("youtube.com")) {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (url.hostname === "vimeo.com") return `https://player.vimeo.com/video/${url.pathname.split("/").filter(Boolean)[0]}`;
  } catch {
    return null;
  }
  return null;
}
