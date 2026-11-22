// Coin & Candlelight: the museum itself — walls, pedestals, candles, relics, exit.
// One file, one job: the level. Three galleries in a row, each with its own
// cover to hide behind and its own candlelight that makes you easier to
// spot. Cover blocks sight and movement; that is what makes hiding real.
import {
  CANVAS_HEIGHT,
  DOOR_HEIGHT,
  GALLERY_GAP,
  GALLERY_WIDTH,
  MUSEUM_BOTTOM,
  MUSEUM_LEFT,
  MUSEUM_TOP,
} from './config.js';

// A wall or a piece of cover is an axis-aligned rectangle.
function rect(x, y, w, h) {
  return { x, y, w, h };
}

function galleryLeft(i) {
  return MUSEUM_LEFT + i * (GALLERY_WIDTH + GALLERY_GAP);
}

function buildWalls() {
  const playTop = MUSEUM_TOP;
  const playBottom = MUSEUM_BOTTOM;
  const totalWidth = 3 * GALLERY_WIDTH + 2 * GALLERY_GAP;
  const walls = [];
  walls.push(rect(MUSEUM_LEFT, playTop, totalWidth, 12));
  walls.push(rect(MUSEUM_LEFT, playBottom - 12, totalWidth, 12));
  walls.push(rect(MUSEUM_LEFT, playTop, 12, playBottom - playTop));
  walls.push(rect(MUSEUM_LEFT + totalWidth - 12, playTop, 12, playBottom - playTop));
  const doorTop = (playTop + playBottom) / 2 - DOOR_HEIGHT / 2;
  const doorBottom = doorTop + DOOR_HEIGHT;
  for (let i = 1; i < 3; i++) {
    const x = galleryLeft(i) - GALLERY_GAP;
    walls.push(rect(x, playTop, GALLERY_GAP, doorTop - playTop));
    walls.push(rect(x, doorBottom, GALLERY_GAP, playBottom - doorBottom));
  }
  return walls;
}

function buildCover() {
  // Pedestals, display cases and benches. Every piece sits clear of the
  // guard lanes: a guard standing on a pedestal's edge gets its cone
  // clipped to a sliver, which reads badly.
  return [
    // Marble Hall.
    rect(80, 140, 90, 64),
    rect(170, 600, 120, 60),
    rect(280, 300, 66, 80),
    // Portrait Wing.
    rect(500, 150, 90, 64),
    rect(640, 320, 70, 90),
    rect(700, 600, 120, 60),
    // Vault.
    rect(1100, 140, 100, 90),
    rect(980, 300, 80, 80),
    rect(1060, 600, 120, 60),
  ];
}

function buildCandles() {
  return [
    { x: 180, y: 110, radius: 112 },
    { x: 360, y: 690, radius: 112 },
    { x: 560, y: 110, radius: 112 },
    { x: 740, y: 690, radius: 112 },
    { x: 980, y: 110, radius: 112 },
    { x: 1160, y: 690, radius: 112 },
  ];
}

function buildLoot() {
  // Relics on open floor, never inside a case: a relic a thief cannot
  // reach is a game nobody can win.
  return [
    { id: 'mask', name: 'Golden Mask', x: 335, y: 175, taken: false },
    { id: 'idol', name: 'Jade Idol', x: 755, y: 175, taken: false },
    { id: 'sapphire', name: 'Star Sapphire', x: 1150, y: 280, taken: false },
  ];
}

function buildGuardSpawns() {
  // Every waypoint sits in open floor, clear of cover.
  return [
    {
      kind: 'patrol', name: 'Patrol A',
      waypoints: [[200, 110], [360, 110], [360, 720], [80, 720]],
    },
    {
      kind: 'patrol', name: 'Patrol B',
      waypoints: [[640, 110], [780, 110], [780, 720], [500, 720]],
    },
    {
      kind: 'patrol', name: 'Patrol C',
      waypoints: [[920, 110], [1210, 110], [1210, 720], [920, 720]],
    },
    {
      kind: 'rover', name: 'Rover D',
      waypoints: [[400, 400], [620, 280], [720, 500], [820, 300], [760, 700], [520, 650]],
    },
    {
      kind: 'rover', name: 'Rover E',
      waypoints: [[980, 150], [1230, 150], [1230, 650], [980, 650], [1120, 400]],
    },
  ];
}

export function buildWorld() {
  const playTop = MUSEUM_TOP;
  const playBottom = MUSEUM_BOTTOM;
  const totalWidth = 3 * GALLERY_WIDTH + 2 * GALLERY_GAP;
  const museumRight = MUSEUM_LEFT + totalWidth;
  const exitTop = (playTop + playBottom) / 2 - DOOR_HEIGHT / 2;
  return {
    walls: buildWalls(),
    cover: buildCover(),
    candles: buildCandles(),
    loot: buildLoot(),
    guardSpawns: buildGuardSpawns(),
    playerStart: { x: 62, y: (playTop + playBottom) / 2 },
    exitZone: rect(museumRight - 46, exitTop, 46, DOOR_HEIGHT),
    galleries: [
      { name: 'MARBLE HALL', left: galleryLeft(0) },
      { name: 'PORTRAIT WING', left: galleryLeft(1) },
      { name: 'VAULT', left: galleryLeft(2) },
    ],
    bounds: { left: MUSEUM_LEFT, top: playTop, right: museumRight, bottom: playBottom },
  };
}

// --- collision: a circle against every solid rectangle (walls + cover) ---

export function circleHitsSolid(world, x, y, radius) {
  for (const block of world.walls) {
    if (circleHitsRect(x, y, radius, block)) return true;
  }
  for (const block of world.cover) {
    if (circleHitsRect(x, y, radius, block)) return true;
  }
  return false;
}

function circleHitsRect(x, y, radius, r) {
  const nearestX = Math.max(r.x, Math.min(x, r.x + r.w));
  const nearestY = Math.max(r.y, Math.min(y, r.y + r.h));
  const dx = x - nearestX;
  const dy = y - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

// --- line of sight: a segment blocked by any wall or cover rectangle ---

export function hasLineOfSight(world, x1, y1, x2, y2) {
  for (const block of world.walls) {
    if (segmentHitsRect(x1, y1, x2, y2, block)) return false;
  }
  for (const block of world.cover) {
    if (segmentHitsRect(x1, y1, x2, y2, block)) return false;
  }
  return true;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let low = 0;
  let high = 1;
  for (const [origin, delta, min, max] of [
    [x1, dx, r.x, r.x + r.w],
    [y1, dy, r.y, r.y + r.h],
  ]) {
    if (Math.abs(delta) < 1e-9) {
      if (origin < min || origin > max) return false;
    } else {
      let t1 = (min - origin) / delta;
      let t2 = (max - origin) / delta;
      if (t1 > t2) [t1, t2] = [t2, t1];
      low = Math.max(low, t1);
      high = Math.min(high, t2);
      if (low > high) return false;
    }
  }
  return true;
}

// --- light: a point is lit when a candle reaches it ---

export function isLit(world, x, y) {
  for (const candle of world.candles) {
    if (distance(x, y, candle.x, candle.y) < candle.radius) return true;
  }
  return false;
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export const GALLERY_HEIGHT = CANVAS_HEIGHT;
