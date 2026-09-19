import { getPublishedGallery } from "../../site-data";
import { publicJson, publicOptions } from "../../cors";

export const dynamic = "force-dynamic";

export async function GET() {
  return publicJson({ gallery: await getPublishedGallery() });
}

export function OPTIONS() { return publicOptions(); }
