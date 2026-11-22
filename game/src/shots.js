// Coin & Candlelight: staged screenshots.
// One file, one job: posing the game for its four pictures. Each shot sets
// exact positions, suspicion and relics, then the game renders one frame —
// so the same URL always produces the same pixels.
import { makeNoiseRing } from './noise.js';
import { makeCoinToss } from './coins.js';

function placeGuard(guard, x, y, facing, suspicion, state) {
  guard.x = x;
  guard.y = y;
  guard.facing = facing;
  guard.suspicion = suspicion;
  guard.state = state;
  guard.lastSeenX = x;
  guard.lastSeenY = y;
}

export function stageShot(state, shot) {
  const { world, player, guards } = state;
  state.rings = [];
  state.coins = [];
  state.phase = 'play';
  state.spottedCount = 0;
  state.elapsedSeconds = 0;
  for (const item of world.loot) item.taken = false;
  player.lootTaken = 0;
  player.coinsLeft = 3;

  if (shot === 1) {
    // Cover: the whole museum at a glance — Wren at the door, every guard
    // mid-patrol, cones out, relics glinting, EXIT labelled at the far end.
    player.x = 62;
    player.y = 432;
    player.facing = 0;
    const facings = [0.5, 0.9, 0.4, 2.6, 1.9];
    guards.forEach((guard, i) => {
      const start = guard.waypoints[0];
      placeGuard(guard, start[0], start[1], facings[i], 0, 'patrol');
    });
    return;
  }

  if (shot === 2) {
    // Sneak: Wren flat behind a Marble Hall case, a coin she just tossed
    // clinking on the marble while Patrol A's cone turns toward it. One
    // relic already pocketed, two coins left.
    world.loot[0].taken = true;
    player.lootTaken = 1;
    player.coinsLeft = 2;
    player.x = 310;
    player.y = 400;
    player.facing = -0.9;
    const coin = makeCoinToss({ x: 310, y: 400, facing: 0.4 }, world);
    coin.x = coin.landX;
    coin.y = coin.landY;
    coin.landed = true;
    coin.rang = true;
    state.coins = [coin];
    state.rings = [makeNoiseRing(coin.landX, coin.landY)];
    state.rings[0].radius = 60;
    placeGuard(guards[0], 360, 240, 0.9, 0.45, 'suspicious');
    placeGuard(guards[1], 640, 130, 0.6, 0, 'patrol');
    placeGuard(guards[2], 920, 110, 0.5, 0, 'patrol');
    placeGuard(guards[3], 400, 400, -2.4, 0, 'patrol');
    placeGuard(guards[4], 1180, 660, -2.4, 0, 'patrol');
    return;
  }

  if (shot === 3) {
    // Alarm: Rover E has Wren in a red cone by the Star Sapphire, rings
    // still expanding from her last loud step. Two relics pocketed.
    world.loot[0].taken = true;
    world.loot[1].taken = true;
    player.lootTaken = 2;
    player.x = 1152;
    player.y = 262;
    player.facing = -2.2;
    state.spottedCount = 1;
    state.rings = [makeNoiseRing(1152, 262), makeNoiseRing(1152, 262)];
    state.rings[0].radius = 120;
    state.rings[1].radius = 60;
    placeGuard(guards[0], 110, 280, 0.8, 0, 'patrol');
    placeGuard(guards[1], 480, 600, -0.6, 0.2, 'patrol');
    placeGuard(guards[2], 830, 640, 2.2, 0, 'patrol');
    placeGuard(guards[3], 700, 420, -1.0, 0.1, 'patrol');
    placeGuard(guards[4], 1078, 208, 0.5, 1, 'alarm');
    return;
  }

  // Shot 4: escape — Wren at the EXIT with all three relics, banner up.
  for (const item of world.loot) item.taken = true;
  player.lootTaken = 3;
  player.coinsLeft = 1;
  player.x = 1212;
  player.y = 432;
  player.facing = 0;
  state.phase = 'escaped';
  state.elapsedSeconds = 81.5;
  placeGuard(guards[0], 90, 110, 0.4, 0, 'patrol');
  placeGuard(guards[1], 420, 640, -1.4, 0, 'patrol');
  placeGuard(guards[2], 860, 180, 0.9, 0, 'patrol');
  placeGuard(guards[3], 620, 460, 2.0, 0, 'patrol');
  placeGuard(guards[4], 1040, 620, -2.0, 0, 'patrol');
}
