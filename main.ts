// Emberlight — Night Train Heist: the hand-in program.
// Node 22, standard library only. Copies game/ and screenshots/ from this
// repository into the output directory and writes dossier.json with the
// kit's buildDossier, byte for byte as the scorer rebuilds it. The same
// input always writes the same bytes: no timestamps, no randomness here.
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const REPO_ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handInEntry() {
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });
  cpSync(join(REPO_ROOT, 'game'), join(OUTPUT_DIR, 'game'), { recursive: true });
  cpSync(join(REPO_ROOT, 'screenshots'), join(OUTPUT_DIR, 'screenshots'), { recursive: true });
  const dossier = buildDossier(OUTPUT_DIR, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  // The gate refuses a dossier.json over 1.5 MiB; fail loudly here instead
  // of handing the scorer an entry it cannot accept.
  if (dossier.length > 1572864) {
    throw new Error(`emberlight: dossier.json is ${dossier.length} bytes, over the 1.5 MiB gate cap`);
  }
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);
  console.log(`emberlight: wrote ${OUTPUT_DIR} (dossier ${dossier.length} bytes)`);
}

handInEntry();
