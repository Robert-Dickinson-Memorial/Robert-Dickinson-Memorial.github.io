import { env } from "cloudflare:workers";
import { getPublishedGallery, getSiteContent } from "../site-data";
import BookReader from "./reader";
export const dynamic = "force-dynamic";
export default async function MemoryBookPage() {
  const [content,gallery,result,total] = await Promise.all([
    getSiteContent(),getPublishedGallery(),
    env.DB ? env.DB.prepare(`SELECT id, name, relationship, title, story, photo_key AS photoKey, video_key AS videoKey, pdf_key AS pdfKey, social_url AS socialUrl FROM memories WHERE status = 'approved' ORDER BY CASE
      WHEN id = 11 THEN 0
      WHEN lower(trim(name)) IN ('haishan chen','hanshan chen') THEN 1
      WHEN lower(trim(name)) = 'david schimel' THEN 2
      WHEN lower(trim(name)) = 'xubin zeng' THEN 3
      WHEN lower(trim(name)) IN ('zong-liang yang','zong liang yang') THEN 4
      WHEN lower(trim(name)) = 'kaicun wang' THEN 5
      ELSE 6 END, created_at ASC, id ASC`).all() : {results:[]},
    env.DB ? env.DB.prepare("SELECT COALESCE(SUM(reported_tree_count),0) AS trees FROM tree_dedications WHERE status = 'approved' AND contribution_type = 'tree' AND payment_confirmed = 1").first() : {}
  ]);
  return <BookReader data={{content,gallery,memories:result.results||[],participation:total||{}}} />;
}
