// Coin & Candlelight: seeded randomness.
// One file, one job: the only randomness in the game. One seed, one
// sequence, every run — so a screenshot and a playthrough never disagree.
export function makeSeededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInRange(random, min, max) {
  return min + random() * (max - min);
}

export function randomPick(random, items) {
  return items[Math.floor(random() * items.length)];
}

export function randomInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}
