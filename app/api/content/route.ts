import { getSiteContent } from "../../site-data";
import { publicJson, publicOptions } from "../../cors";

export const dynamic = "force-dynamic";

export async function GET() {
  return publicJson({ content: await getSiteContent() });
}

export function OPTIONS() { return publicOptions(); }
