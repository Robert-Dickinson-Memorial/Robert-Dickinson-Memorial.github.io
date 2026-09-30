import { readFile, writeFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

// Run the same content merge and editorial compatibility rules as the live service.
// The fake DB exposes only the public site_content rows queried by the mirror job.
const rows = JSON.parse(await readFile(process.argv[2], "utf8"));
const sources = await Promise.all([
  "app/gallery-order.ts", "app/editorial-revision.ts", "app/tree/page-copy.ts", "app/site-data.ts",
].map((path) => readFile(path, "utf8")));
const code = sources.map((source) => source.replace(/^import .*;\s*$/gm, "").replace(/^export /gm, "")).join("\n");
const env = { DB: { prepare: () => ({ all: async () => ({ results: rows }) }) } };
const getSiteContent = new Function("env", `${stripTypeScriptTypes(code)}\nreturn getSiteContent;`)(env);
const content = await getSiteContent();
if (!content?.pageCopy || !content?.siteAssets || !Array.isArray(content.lifePhotos)) {
  throw new Error("Public content snapshot could not be rendered");
}
await writeFile(process.argv[3], JSON.stringify({ content }));
