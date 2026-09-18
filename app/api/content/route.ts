import { getSiteContent } from "../../site-data";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ content: await getSiteContent() });
}
