// main.ts — entrypoint for the Vice City Cover Studio entry.
// Node 22, standard library only. It copies app/ and screenshots/ from
// this repository into the output directory and writes dossier.json with
// buildDossier from vendor/makefun-app.ts. Outside the grader,
// MAKEFUN_OUTPUT_DIR stands in for /output. The program runs twice and
// both runs must write the same bytes, so every step here is deterministic:
// plain recursive copies, then one dossier built from those copies.

import { buildDossier } from "./vendor/makefun-app.ts";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoDir = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const appDir = join(repoDir, "app");
const shotsDir = join(repoDir, "screenshots");
const appOut = join(outDir, "app");
const shotsOut = join(outDir, "screenshots");

await mkdir(outDir, { recursive: true });
// Clear the previous run's copies first, so a re-run never leaves stale
// files behind and both grader runs write identical bytes.
await rm(appOut, { recursive: true, force: true });
await rm(shotsOut, { recursive: true, force: true });
await cp(appDir, appOut, { recursive: true });
await cp(shotsDir, shotsOut, { recursive: true });

const dossier = await buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});

await writeFile(join(outDir, "dossier.json"), dossier);
console.log(`Vice City Cover Studio: wrote ${outDir}/dossier.json (${dossier.length} bytes)`);
