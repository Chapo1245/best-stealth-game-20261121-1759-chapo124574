// Emberlight: a tiny seeded random generator (mulberry32).
// One file, one job: deterministic randomness. No Math.random anywhere
// in gameplay, so two runs of the game are byte-identical in behaviour.
export function makeSeededRandom(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInRange(random, min, max) {
  return min + random() * (max - min);
}

export function randomPick(random, items) {
  return items[Math.floor(random() * items.length)];
}

export function randomInt(random, min, max) {
  return Math.floor(randomInRange(random, min, max + 1));
}
