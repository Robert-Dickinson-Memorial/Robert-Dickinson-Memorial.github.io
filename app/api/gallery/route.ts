import { getPublishedGallery } from "../../site-data";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ gallery: await getPublishedGallery() });
}
