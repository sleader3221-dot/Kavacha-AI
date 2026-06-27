import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standaloneDir = join(root, ".next", "standalone");

if (!existsSync(standaloneDir)) {
  console.log("Standalone output not found; skipping asset copy.");
  process.exit(0);
}

const publicDir = join(root, "public");
const standalonePublicDir = join(standaloneDir, "public");
if (existsSync(publicDir)) {
  cpSync(publicDir, standalonePublicDir, { recursive: true, force: true });
}

const standaloneNextDir = join(standaloneDir, ".next");
mkdirSync(standaloneNextDir, { recursive: true });

const staticDir = join(root, ".next", "static");
const standaloneStaticDir = join(standaloneNextDir, "static");
if (existsSync(staticDir)) {
  cpSync(staticDir, standaloneStaticDir, { recursive: true, force: true });
}

console.log("Copied public and static assets into .next/standalone.");
