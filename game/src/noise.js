// Emberlight: noise — the rings running leaves behind.
// One file, one job: sound you can see. A ring expands from the runner;
// any guard it touches turns to investigate the spot it came from.
import { PLAYER_NOISE_RADIUS } from './config.js';

export function makeNoiseRing(x, y) {
  return { x, y, radius: 14, maxRadius: PLAYER_NOISE_RADIUS, alpha: 0.85, heardBy: new Set() };
}

export function updateNoiseRing(ring, dt) {
  ring.radius += 340 * dt;
  ring.alpha = Math.max(0, 0.85 * (1 - ring.radius / ring.maxRadius));
  return ring.radius < ring.maxRadius;
}

// A guard the ring just reached turns to investigate the ring's origin.
// Returns the guards that heard it (for the HUD's noise flash).
export function ringHeardBy(ring, guards) {
  const heard = [];
  for (const guard of guards) {
    if (ring.heardBy.has(guard.index)) continue;
    const dist = Math.hypot(guard.x - ring.x, guard.y - ring.y);
    if (dist <= ring.radius) {
      ring.heardBy.add(guard.index);
      heard.push(guard);
    }
  }
  return heard;
}
