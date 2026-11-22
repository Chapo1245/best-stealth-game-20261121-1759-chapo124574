// Emberlight: the game loop — wire input, actors and drawing together.
// One file, one job: running the game. Fixed 60 Hz steps keep play and
// screenshots deterministic; the loop only renders what the state says.
import { CANVAS_HEIGHT, CANVAS_WIDTH, GAME_SEED } from './config.js';
import { makeSeededRandom } from './random.js';
import { buildWorld } from './world.js';
import { makeGuard, updateGuard, guardHearsNoise } from './guards.js';
import { makePlayer, playerAtExit, playerTakesLoot, updatePlayer } from './player.js';
import { makeInput, attachInput } from './input.js';
import { drawScene } from './render.js';
import { ringHeardBy, updateNoiseRing } from './noise.js';
import { stageShot } from './shots.js';
import { makeSound } from './audio.js';

const STEP = 1 / 60;

function makeGameState() {
  const random = makeSeededRandom(GAME_SEED);
  const world = buildWorld();
  return {
    world,
    player: makePlayer(world.playerStart),
    guards: world.guardSpawns.map((spawn, i) => makeGuard(spawn, i, random)),
    rings: [],
    input: makeInput(),
    phase: 'play', // play | caught | escaped
    spottedCount: 0,
    alarmActive: false,
    elapsedSeconds: 0,
    sound: makeSound(),
  };
}

function updateGame(state, dt) {
  if (state.phase !== 'play') return;
  state.elapsedSeconds += dt;
  const ring = updatePlayer(state.world, state.player, state.input, dt);
  if (ring !== null) state.rings.push(ring);
  for (let i = state.rings.length - 1; i >= 0; i--) {
    const alive = updateNoiseRing(state.rings[i], dt);
    if (alive) {
      const heard = ringHeardBy(state.rings[i], state.guards);
      for (const guard of heard) guardHearsNoise(guard, state.rings[i].x, state.rings[i].y, state.rings[i].maxRadius);
    } else {
      state.rings.splice(i, 1);
    }
  }
  const taken = playerTakesLoot(state.world, state.player);
  if (taken !== null) state.sound.pickup();
  const alarmed = state.guards.some((g) => g.state === 'alarm');
  if (alarmed && !state.alarmActive) {
    state.spottedCount += 1;
    state.sound.alarm();
  }
  state.alarmActive = alarmed;
  for (const guard of state.guards) {
    const result = updateGuard(state.world, guard, state.player, dt);
    if (result === 'caught') {
      state.phase = 'caught';
      state.sound.caught();
      return;
    }
  }
  if (playerAtExit(state.world, state.player)) {
    state.phase = 'escaped';
    state.sound.escape();
  }
}

function startGame() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const params = new URLSearchParams(window.location.search);
  const shot = Number(params.get('shot') || 0);
  const state = makeGameState();
  attachInput(state.input);

  if (shot >= 1 && shot <= 4) {
    // Screenshot mode: pose once, render one fixed frame, signal readiness.
    stageShot(state, shot);
    drawScene(ctx, state, 1200);
    document.title = 'shot-ready';
    window.__shotReady = true;
    return;
  }

  let last = performance.now();
  let accumulator = 0;
  function frame(now) {
    const elapsed = Math.min(0.1, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    while (accumulator >= STEP) {
      if (state.input.restart && state.phase !== 'play') {
        const fresh = makeGameState();
        Object.assign(state, fresh);
        state.input = fresh.input;
        attachInput(state.input);
      }
      updateGame(state, STEP);
      accumulator -= STEP;
    }
    drawScene(ctx, state, now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

startGame();
