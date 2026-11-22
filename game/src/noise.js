// Coin & Candlelight: noise — the rings a loud step leaves behind.
// One file, one job: expanding rings. A ring is a fact on the floor: any
// guard whose ears it reaches turns to look at where it started.
import { PLAYER_NOISE_RADIUS } from './config.js';
import { distance } from './world.js';

export function makeNoiseRing(x, y) {
  return { x, y, radius: 12, maxRadius: PLAYER_NOISE_RADIUS, age: 0 };
}

// One fixed step. Returns true while the ring is still expanding.
export function updateNoiseRing(ring, dt) {
  ring.age += dt;
  ring.radius += 260 * dt;
  return ring.radius < ring.maxRadius;
}

export function ringHeardBy(ring, guards) {
  return guards.filter((guard) => distance(guard.x, guard.y, ring.x, ring.y) < ring.maxRadius);
}
