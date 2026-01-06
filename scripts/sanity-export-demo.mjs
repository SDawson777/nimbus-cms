import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function isoDate() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const dataset =
  process.env.SANITY_EXPORT_DATASET ||
  process.env.SANITY_DATASET ||
  "nimbus_demo";

const projectId =
  process.env.SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID;

const token =
  process.env.SANITY_API_TOKEN ||
  process.env.SANITY_AUTH_TOKEN ||
  process.env.SANITY_TOKEN ||
  process.env.SANITY_PREVIEW_TOKEN;

if (!projectId) {
  console.error("Missing SANITY_PROJECT_ID (or SANITY_STUDIO_PROJECT_ID)");
  process.exit(1);
}
if (!token) {
  console.error("Missing SANITY_API_TOKEN (or SANITY_TOKEN)");
  process.exit(1);
}

const outDir = path.resolve(process.cwd(), "backups", "sanity");
fs.mkdirSync(outDir, { recursive: true });

const outFile = path.join(outDir, `demo-${dataset}-${isoDate()}.tar.gz`);

const env = {
  ...process.env,
  SANITY_PROJECT_ID: projectId,
  SANITY_AUTH_TOKEN: token,
};

console.log(`[sanity-export-demo] Exporting dataset '${dataset}' -> ${outFile}`);

const res = spawnSync(
  "npx",
  [
    "-y",
    "pnpm@9",
    "-C",
    "apps/studio",
    "exec",
    "sanity",
    "dataset",
    "export",
    dataset,
    outFile,
    "--project",
    projectId,
  ],
  { stdio: "inherit", env },
);

process.exit(res.status ?? 1);
