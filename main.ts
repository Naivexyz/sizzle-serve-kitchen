// Sizzle & Serve — hand-in program for make.fun's "Make the best cooking game" bounty.
//
// The game itself is the static site under game/ (open game/index.html in a desktop
// browser, it runs fully offline). This program's only job is to hand that game in:
// it copies game/ and screenshots/ into the output directory and writes dossier.json
// there with the vendored make.fun library, byte for byte the way the grader's own
// scorer will rebuild it.
//
// Run it the way the grader does (MAKEFUN_OUTPUT_DIR stands in for /output locally):
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoDir, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The caps below mirror the sealed gate's own limits for this bounty, so a dossier
// this program writes is one the scorer accepts: at most 4 screenshots of at most
// 256 KiB each, at most 993 entries and 48 MiB under game/, no game path over
// 1,000 bytes, and the source text the judge reads capped at 160 KiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
