// Coin & Candlelight: the coin toss — the thief's one gadget.
// One file, one job: thrown coins. A coin flies from the player's hand in
// the direction she faces, lands with a clink, and leaves a noise ring
// every guard in earshot turns to investigate. Three coins a night: spend
// them where a guard is in the way. A coin that would land inside a
// pedestal stops at the last open floor on its path.
import { COIN_FLIGHT_TIME, COIN_RADIUS, COIN_TOSS_DISTANCE, PLAYER_NOISE_RADIUS } from './config.js';
import { circleHitsSolid } from './world.js';
import { makeNoiseRing } from './noise.js';

export function makeCoinToss(player, world) {
  const targetX = player.x + Math.cos(player.facing) * COIN_TOSS_DISTANCE;
  const targetY = player.y + Math.sin(player.facing) * COIN_TOSS_DISTANCE;
  // Walk the flight in small steps; stop at the last open floor.
  let landX = player.x;
  let landY = player.y;
  for (let step = 1; step <= 20; step++) {
    const x = player.x + ((targetX - player.x) * step) / 20;
    const y = player.y + ((targetY - player.y) * step) / 20;
    if (circleHitsSolid(world, x, y, COIN_RADIUS)) break;
    landX = x;
    landY = y;
  }
  return {
    startX: player.x,
    startY: player.y,
    landX,
    landY,
    x: player.x,
    y: player.y,
    t: 0,
    landed: false,
    rang: false,
  };
}

// One fixed step for every coin in flight. Returns the rings that landed
// this step, so the caller can wake the guards and play the clink.
export function updateCoins(coins, world, dt) {
  const rings = [];
  for (const coin of coins) {
    if (coin.landed) continue;
    coin.t += dt / COIN_FLIGHT_TIME;
    if (coin.t >= 1) {
      coin.t = 1;
      coin.landed = true;
    }
    coin.x = coin.startX + (coin.landX - coin.startX) * coin.t;
    coin.y = coin.startY + (coin.landY - coin.startY) * coin.t;
    if (coin.landed && !coin.rang) {
      coin.rang = true;
      const ring = makeNoiseRing(coin.landX, coin.landY);
      ring.maxRadius = PLAYER_NOISE_RADIUS;
      rings.push(ring);
    }
  }
  return rings;
}
