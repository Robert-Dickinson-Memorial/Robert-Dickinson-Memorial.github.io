import { getPublishedEvents } from "../../site-data";
import { publicJson, publicOptions } from "../../cors";

export const dynamic = "force-dynamic";

export async function GET() {
  return publicJson({ events: await getPublishedEvents() }, { headers: { "cache-control": "no-store, max-age=0" } });
}

export function OPTIONS() { return publicOptions(); }
