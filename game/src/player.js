// Emberlight: the thief, Wren.
// One file, one job: moving the player. Walk is silent, run is fast and
// loud; loot is picked up by walking over it; the exit only opens the
// escape once every treasure is taken.
import {
  PLAYER_NOISE_INTERVAL,
  PLAYER_RADIUS,
  PLAYER_RUN_SPEED,
  PLAYER_WALK_SPEED,
} from './config.js';
import { circleHitsSolid, distance, pointInRect } from './world.js';
import { makeNoiseRing } from './noise.js';

export function makePlayer(start) {
  return {
    x: start.x,
    y: start.y,
    radius: PLAYER_RADIUS,
    facing: 0,
    moving: false,
    running: false,
    noiseTimer: 0,
    lootTaken: 0,
    steps: 0,
  };
}

function tryMove(world, player, dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (!circleHitsSolid(world, nx, player.y, player.radius)) player.x = nx;
  if (!circleHitsSolid(world, player.x, ny, player.radius)) player.y = ny;
}

// One fixed step. Returns a noise ring when the player runs, else null.
export function updatePlayer(world, player, input, dt) {
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  player.moving = dx !== 0 || dy !== 0;
  player.running = player.moving && input.run;
  if (player.moving) {
    const len = Math.hypot(dx, dy);
    const speed = player.running ? PLAYER_RUN_SPEED : PLAYER_WALK_SPEED;
    player.facing = Math.atan2(dy, dx);
    tryMove(world, player, (dx / len) * speed * dt, (dy / len) * speed * dt);
    player.steps += speed * dt;
  }
  if (player.running) {
    player.noiseTimer -= dt;
    if (player.noiseTimer <= 0) {
      player.noiseTimer = PLAYER_NOISE_INTERVAL;
      return makeNoiseRing(player.x, player.y);
    }
  } else {
    player.noiseTimer = 0;
  }
  return null;
}

// Walk over a treasure to pocket it. Returns the treasure taken, or null.
export function playerTakesLoot(world, player) {
  for (const item of world.loot) {
    if (item.taken) continue;
    if (distance(player.x, player.y, item.x, item.y) < player.radius + 14) {
      item.taken = true;
      player.lootTaken += 1;
      return item;
    }
  }
  return null;
}

export function playerAtExit(world, player) {
  return pointInRect(player.x, player.y, world.exitZone) && player.lootTaken >= world.loot.length;
}

export function playerNearExit(world, player) {
  return pointInRect(player.x, player.y, world.exitZone);
}
