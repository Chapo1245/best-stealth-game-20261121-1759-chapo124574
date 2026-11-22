// Emberlight self-grade: pure-logic checks, no DOM, no browser.
// Run: node --input-type=module -e "$(cat ...)" — or save as .mjs and run node.
import { buildWorld, circleHitsSolid, hasLineOfSight } from './game/src/world.js';
import { makeGuard, guardHearsNoise, updateGuard, guardVisionRange } from './game/src/guards.js';
import { makePlayer, playerTakesLoot, playerAtExit, updatePlayer } from './game/src/player.js';
import { makeSeededRandom } from './game/src/random.js';
import { makeInput } from './game/src/input.js';

let pass = 0;
let fail = 0;
function check(name, actual, expected) {
  if (actual === expected) { pass += 1; console.log(`PASS ${name}`); }
  else { fail += 1; console.log(`FAIL ${name}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`); }
}

// Determinism: two worlds from the same seed are identical.
const w1 = JSON.stringify(buildWorld());
const w2 = JSON.stringify(buildWorld());
check('world deterministic', w1 === w2, true);

// Seeded random: same seed, same sequence.
const r1 = makeSeededRandom(20261122);
const r2 = makeSeededRandom(20261122);
check('seeded random deterministic', r1() === r2() && r1() === r2(), true);

// Line of sight: clear corridor sees; a wall between blocks.
// (y=432 is the door gap through the separator, so it stays open;
// y=200 crosses solid wall.)
const world = buildWorld();

// Every treasure must be reachable: standing next to it (within pickup
// range) from at least one direction, on open floor. A treasure inside a
// solid case is a game nobody can win — this check exists because the
// Ember Opal once sat inside the vault safe.
for (const item of world.loot) {
  let reachable = false;
  for (let step = 0; step < 8; step++) {
    const angle = (step / 8) * Math.PI * 2;
    const px = item.x + Math.cos(angle) * 24;
    const py = item.y + Math.sin(angle) * 24;
    if (!circleHitsSolid(world, px, py, 11)) reachable = true;
  }
  check(`loot reachable: ${item.name}`, reachable, true);
  check(`loot not inside solid: ${item.name}`, circleHitsSolid(world, item.x, item.y, 0), false);
}
check('los clear', hasLineOfSight(world, 100, 432, 250, 432), true);
check('los clear through door gap', hasLineOfSight(world, 100, 432, 400, 432), true);
check('los blocked by wall', hasLineOfSight(world, 100, 200, 400, 200), false);

// Collision: a circle on a crate is solid; open floor is not.
check('circle on cover solid', circleHitsSolid(world, 100, 180, 13), true);
check('circle on open floor free', circleHitsSolid(world, 100, 432, 13), false);

// Guard vision: in front, in range, lit -> sees; behind -> blind.
// Proven through suspicion, the only honest signal: it rises only while
// the guard can actually see the player.
const guard = makeGuard(world.guardSpawns[0], 0, makeSeededRandom(1));
guard.x = 100; guard.y = 432; guard.facing = 0; guard.suspicion = 0.5;
const player = makePlayer(world.playerStart);
player.x = 200; player.y = 432;
updateGuard(world, guard, player, 1 / 60);
check('guard sees player ahead (suspicion rises)', guard.suspicion > 0.5, true);
const behindBefore = guard.suspicion;
player.x = 20; player.y = 432;
updateGuard(world, guard, player, 1 / 60);
check('guard blind behind (suspicion falls)', guard.suspicion < behindBefore, true);

// Suspicion rises while seen, falls while hidden; alarm at 1.0; catch up close.
// (updateGuard rotates facing toward the patrol target after the sight
// check, so re-aim the guard before each call.)
player.x = 200; player.y = 432;
guard.suspicion = 0.5;
guard.facing = 0;
updateGuard(world, guard, player, 1 / 60);
check('suspicion rises when seen', guard.suspicion > 0.5, true);
player.x = 20; player.y = 432;
const before = guard.suspicion;
guard.facing = Math.PI;
updateGuard(world, guard, player, 1 / 60);
check('suspicion falls when hidden', guard.suspicion < before, true);
guard.suspicion = 1;
guard.x = 210; guard.y = 432;
guard.facing = Math.PI;
guard.lastSeenX = 200; guard.lastSeenY = 432;
player.x = 200; player.y = 432;
check('alarm guard catches up close', updateGuard(world, guard, player, 1 / 60), 'caught');

// Loot: standing on it takes it; exit: standing in it wins.
const p2 = makePlayer(world.playerStart);
p2.x = world.loot[0].x; p2.y = world.loot[0].y;
check('loot taken on touch', playerTakesLoot(world, p2) !== null, true);
check('loot marked taken', world.loot[0].taken, true);
p2.x = 1240; p2.y = 432;
check('exit locked until all loot', playerAtExit(world, p2), false);
p2.lootTaken = world.loot.length;
check('exit reached with all loot', playerAtExit(world, p2), true);
p2.x = 100; p2.y = 432;
check('exit not reached far away', playerAtExit(world, p2), false);

// Noise: running emits a ring; walking does not.
const input = makeInput();
input.up = false; input.down = false; input.left = false; input.right = true; input.run = true;
const p3 = makePlayer(world.playerStart);
p3.x = 100; p3.y = 432;
let ring = null;
for (let i = 0; i < 40; i++) {
  const out = updatePlayer(world, p3, input, 1 / 60);
  if (out !== null) ring = out;
}
check('running emits noise ring', ring !== null, true);
check('ring centred on player path', ring !== null && ring.x > 100, true);
input.run = false;
let quiet = true;
for (let i = 0; i < 40; i++) {
  if (updatePlayer(world, p3, input, 1 / 60) !== null) quiet = false;
}
check('walking is silent', quiet, true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
