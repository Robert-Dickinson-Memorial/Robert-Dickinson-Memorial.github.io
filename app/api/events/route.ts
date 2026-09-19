import { getPublishedEvents } from "../../site-data";
import { publicJson, publicOptions } from "../../cors";

export const dynamic = "force-dynamic";

export async function GET() {
  return publicJson({ events: await getPublishedEvents() });
}

export function OPTIONS() { return publicOptions(); }
