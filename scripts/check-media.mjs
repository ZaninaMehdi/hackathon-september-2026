import { readFileSync } from "node:fs";
import { Client } from "pg";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const url = new URL(env.HACKATHON_POSTGRES_URL_NON_POOLING || env.HACKATHON_POSTGRES_URL);
url.searchParams.delete("sslmode");
const client = new Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
await client.connect();

const q = async (label, sql) => {
  const { rows } = await client.query(sql);
  console.log(`\n=== ${label} ===`);
  console.table(rows);
};

await q("organizations", `select name, slug, org_type, description is not null as has_desc, logo_url, cover_image_url from organizations order by name`);
await q("projects with covers", `select title, slug, cover_image_url from projects order by created_at desc limit 10`);
await q("storage objects in media bucket", `select name, created_at from storage.objects where bucket_id = 'media' order by created_at desc limit 20`);
await q("buckets", `select id, public from storage.buckets`);

await client.end();
