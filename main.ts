// Sleeper Car — make.fun entry program (Node 22, standard library only).
// Copies game/ and screenshots/ from this repository to the output directory
// and writes /output/dossier.json with buildDossier from vendor/makefun-game.ts.
// Two runs write byte-identical output: the inputs are static files and
// buildDossier is deterministic.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here);
const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');

function copyTree(name: string): void {
  const src = join(repoRoot, name);
  const dst = join(outputDir, name);
  if (!existsSync(src)) throw new Error(`missing ${name}/ in repository`);
  cpSync(src, dst, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
rmSync(join(outputDir, 'game'), { recursive: true, force: true });
rmSync(join(outputDir, 'screenshots'), { recursive: true, force: true });
rmSync(join(outputDir, 'dossier.json'), { force: true });
copyTree('game');
copyTree('screenshots');

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
const shotCount = readdirSync(join(outputDir, 'screenshots')).filter((f) => !f.startsWith('.')).length;
console.log(`wrote ${outputDir}/dossier.json (${dossier.length} bytes) with ${shotCount} screenshots`);
