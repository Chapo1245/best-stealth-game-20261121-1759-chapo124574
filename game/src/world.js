// Emberlight: the night train itself — walls, cover, lamps, loot, exit.
// One file, one job: the level. Everything here is fixed geometry, so a
// screenshot always shows the same train; only the actors move.
import {
  CANVAS_HEIGHT,
  CARRIAGE_GAP,
  CARRIAGE_WIDTH,
  DOOR_HEIGHT,
  TRAIN_BOTTOM,
  TRAIN_LEFT,
  TRAIN_TOP,
} from './config.js';

// A wall or a piece of cover is an axis-aligned rectangle.
function rect(x, y, w, h) {
  return { x, y, w, h };
}

// The four carriages, left to right.
function carriageLeft(index) {
  return TRAIN_LEFT + index * (CARRIAGE_WIDTH + CARRIAGE_GAP);
}

function buildWalls() {
  const walls = [];
  const playTop = TRAIN_TOP;
  const playBottom = TRAIN_BOTTOM;
  // Roof and floor of the whole train.
  walls.push(rect(TRAIN_LEFT, playTop, 4 * CARRIAGE_WIDTH + 3 * CARRIAGE_GAP, 12));
  walls.push(rect(TRAIN_LEFT, playBottom - 12, 4 * CARRIAGE_WIDTH + 3 * CARRIAGE_GAP, 12));
  // Left end wall (solid) and right end wall (solid: the EXIT is a zone, not a hole).
  walls.push(rect(TRAIN_LEFT, playTop, 12, playBottom - playTop));
  walls.push(rect(TRAIN_LEFT + 4 * CARRIAGE_WIDTH + 3 * CARRIAGE_GAP - 12, playTop, 12, playBottom - playTop));
  // Separating walls between carriages, each with a centred door gap.
  const doorTop = (playTop + playBottom) / 2 - DOOR_HEIGHT / 2;
  const doorBottom = doorTop + DOOR_HEIGHT;
  for (let i = 1; i < 4; i++) {
    const x = carriageLeft(i) - CARRIAGE_GAP;
    walls.push(rect(x, playTop, CARRIAGE_GAP, doorTop - playTop));
    walls.push(rect(x, doorBottom, CARRIAGE_GAP, playBottom - doorBottom));
  }
  return walls;
}

function buildCover() {
  // Luggage stacks, seats and crates. Tall enough to block a guard's sight,
  // so hiding behind one is real cover, not decoration.
  return [
    // Carriage 1 — sleeper.
    rect(58, 150, 92, 62),
    rect(150, 600, 122, 68),
    rect(222, 300, 70, 72),
    // Carriage 2 — dining car.
    rect(378, 150, 82, 82),
    rect(478, 500, 132, 62),
    rect(556, 318, 62, 92),
    // Carriage 3 — lounge.
    rect(698, 140, 122, 70),
    rect(818, 420, 92, 72),
    rect(698, 600, 72, 82),
    // Carriage 4 — vault car.
    rect(1118, 140, 92, 92),
    rect(998, 300, 82, 82),
    rect(1080, 600, 122, 62),
  ];
}

function buildLamps() {
  const lamps = [];
  for (let i = 0; i < 4; i++) {
    const left = carriageLeft(i);
    lamps.push({ x: left + 78, y: 132, radius: 112 });
    lamps.push({ x: left + 222, y: 692, radius: 112 });
  }
  return lamps;
}

function buildLoot() {
  return [
    { id: 'locket', name: 'Silver Locket', x: 500, y: 200, taken: false },
    { id: 'figurine', name: 'Jade Figurine', x: 884, y: 652, taken: false },
    { id: 'opal', name: 'Ember Opal', x: 1150, y: 280, taken: false },
  ];
}

function buildGuardSpawns() {
  // Every waypoint sits in open floor, clear of cover: a guard standing on
  // a crate's edge gets its cone clipped to a sliver, which reads badly.
  return [
    {
      kind: 'patrol', name: 'Patrol A',
      waypoints: [[80, 110], [250, 110], [250, 720], [80, 720]],
    },
    {
      kind: 'patrol', name: 'Patrol B',
      waypoints: [[390, 110], [570, 110], [570, 720], [390, 720]],
    },
    {
      kind: 'patrol', name: 'Patrol C',
      waypoints: [[710, 110], [890, 110], [890, 720], [710, 720]],
    },
    {
      kind: 'rover', name: 'Rover D',
      waypoints: [[400, 400], [600, 280], [700, 500], [900, 300], [800, 650], [500, 650]],
    },
    {
      kind: 'rover', name: 'Rover E',
      waypoints: [[1010, 150], [1230, 150], [1230, 650], [1010, 650], [1120, 400]],
    },
  ];
}

export function buildWorld() {
  const trainRight = TRAIN_LEFT + 4 * CARRIAGE_WIDTH + 3 * CARRIAGE_GAP;
  const exitTop = (TRAIN_TOP + TRAIN_BOTTOM) / 2 - DOOR_HEIGHT / 2;
  return {
    walls: buildWalls(),
    cover: buildCover(),
    lamps: buildLamps(),
    loot: buildLoot(),
    exitZone: rect(trainRight - 46, exitTop, 46, DOOR_HEIGHT),
    guardSpawns: buildGuardSpawns(),
    playerStart: { x: 62, y: (TRAIN_TOP + TRAIN_BOTTOM) / 2 },
  };
}

// --- collision: a circle against every solid rectangle (walls + cover) ---

function circleHitsRect(x, y, radius, r) {
  const nearestX = Math.max(r.x, Math.min(x, r.x + r.w));
  const nearestY = Math.max(r.y, Math.min(y, r.y + r.h));
  const dx = x - nearestX;
  const dy = y - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

export function circleHitsSolid(world, x, y, radius) {
  for (const wall of world.walls) {
    if (circleHitsRect(x, y, radius, wall)) return true;
  }
  for (const block of world.cover) {
    if (circleHitsRect(x, y, radius, block)) return true;
  }
  return false;
}

// --- line of sight: a segment blocked by any wall or cover rectangle ---

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab method: the segment P(t) = (x1,y1) + t*(dx,dy), t in [0,1],
  // hits the box when the t-intervals of both axes overlap.
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  const axes = [
    { d: dx, origin: x1, min: r.x, max: r.x + r.w },
    { d: dy, origin: y1, min: r.y, max: r.y + r.h },
  ];
  for (const axis of axes) {
    if (Math.abs(axis.d) < 1e-9) {
      if (axis.origin < axis.min || axis.origin > axis.max) return false;
      continue;
    }
    let t1 = (axis.min - axis.origin) / axis.d;
    let t2 = (axis.max - axis.origin) / axis.d;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return tMax >= 0 && tMin <= 1;
}

export function hasLineOfSight(world, x1, y1, x2, y2) {
  for (const wall of world.walls) {
    if (segmentHitsRect(x1, y1, x2, y2, wall)) return false;
  }
  for (const block of world.cover) {
    if (segmentHitsRect(x1, y1, x2, y2, block)) return false;
  }
  return true;
}

// --- light: is a point inside any lamp's pool? ---

export function isLit(world, x, y) {
  for (const lamp of world.lamps) {
    const dx = x - lamp.x;
    const dy = y - lamp.y;
    if (dx * dx + dy * dy < lamp.radius * lamp.radius) return true;
  }
  return false;
}

// --- helpers used by the game loop ---

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
