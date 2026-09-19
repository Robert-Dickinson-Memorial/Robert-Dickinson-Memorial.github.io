import { readFile, writeFile } from "node:fs/promises";

const configPath = new URL("../dist/server/wrangler.json", import.meta.url);
const outputPath = new URL("../dist/server/wrangler.deploy.json", import.meta.url);

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required deployment setting: ${name}`);
  return value;
}

const config = JSON.parse(await readFile(configPath, "utf8"));
const databaseId = required("CLOUDFLARE_D1_DATABASE_ID");
const ownerEmails = required("MEMORIAL_OWNER_EMAIL");

config.name = "robert-dickinson-memorial-api";
config.topLevelName = config.name;
config.vars = {
  ...(config.vars || {}),
  OWNER_EMAILS: ownerEmails,
  PUBLIC_SITE_ORIGIN: "https://robert-dickinson-memorial.github.io",
};

config.d1_databases = (config.d1_databases || []).map((binding) =>
  binding.binding === "DB"
    ? {
        ...binding,
        database_name: process.env.CLOUDFLARE_D1_DATABASE_NAME?.trim() || "robert-dickinson-memorial",
        database_id: databaseId,
        migrations_dir: "../../drizzle",
      }
    : binding,
);

config.r2_buckets = (config.r2_buckets || []).map((binding) =>
  binding.binding === "BUCKET"
    ? {
        ...binding,
        bucket_name: process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim() || "robert-dickinson-memorial-photos",
      }
    : binding,
);

await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`);
console.log("Prepared Cloudflare deployment configuration.");
