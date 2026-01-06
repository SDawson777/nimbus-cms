import { spawnSync } from "node:child_process";
import path from "node:path";

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: pnpm sanity:import-demo-restore -- ./backups/sanity/<export>.tar.gz [targetDataset]");
  process.exit(1);
}

const tarballPath = path.resolve(process.cwd(), args[0]);
const targetDataset = args[1] || process.env.SANITY_RESTORE_DATASET || "demo-restore";

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

const env = {
  ...process.env,
  SANITY_PROJECT_ID: projectId,
  SANITY_AUTH_TOKEN: token,
};

console.log(`[sanity-import-demo-restore] Importing ${tarballPath} -> dataset '${targetDataset}'`);

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
    "import",
    tarballPath,
    targetDataset,
    "--project",
    projectId,
    "--replace",
  ],
  { stdio: "inherit", env },
);

process.exit(res.status ?? 1);
