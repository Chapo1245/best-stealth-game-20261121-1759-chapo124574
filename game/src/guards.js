// Coin & Candlelight: the guards — patrols, rovers, suspicion, chase, investigate.
// One file, one job: guard brains. A guard never teleports and never knows
// where you are unless it saw you or heard you: that is the whole game.
import {
  CHASE_SPEED,
  CONE_HALF_ANGLE,
  CONE_RANGE_DARK,
  CONE_RANGE_LIT,
  CATCH_DISTANCE,
  GUARD_RADIUS,
  INVESTIGATE_SPEED,
  PATROL_SPEED,
  ROVER_SPEED,
  SUSPICION_ALARM_DRAIN,
  SUSPICION_ALARM_LOSE_TIME,
  SUSPICION_DRAIN,
  SUSPICION_FILL_BASE,
  SUSPICION_FILL_CLOSE,
  SUSPICION_CLOSE_DIST,
  SUSPICIOUS_THRESHOLD,
} from './config.js';
import { angleDifference, angleTo, circleHitsSolid, distance, hasLineOfSight, isLit } from './world.js';
import { randomPick } from './random.js';

export function makeGuard(spawn, index, random) {
  const start = spawn.waypoints[0];
  return {
    name: spawn.name,
    kind: spawn.kind,
    x: start[0],
    y: start[1],
    facing: 0,
    waypoints: spawn.waypoints,
    waypointIndex: 1,
    suspicion: 0,
    state: 'patrol', // patrol | suspicious | alarm | investigate | return
    lastSeenX: start[0],
    lastSeenY: start[1],
    investigateX: start[0],
    investigateY: start[1],
    loseSightTimer: 0,
    investigateTimer: 0,
    random,
    index,
  };
}

function guardSeesPlayer(world, guard, player) {
  const dist = distance(guard.x, guard.y, player.x, player.y);
  const range = isLit(world, player.x, player.y) ? CONE_RANGE_LIT : CONE_RANGE_DARK;
  if (dist > range) return { sees: false, dist };
  const toPlayer = angleTo(guard.x, guard.y, player.x, player.y);
  if (Math.abs(angleDifference(toPlayer, guard.facing)) > CONE_HALF_ANGLE) return { sees: false, dist };
  if (!hasLineOfSight(world, guard.x, guard.y, player.x, player.y)) return { sees: false, dist };
  return { sees: true, dist };
}

function suspicionRises(guard, player, seen, dt) {
  if (!seen.sees) return;
  const close = seen.dist < SUSPICION_CLOSE_DIST;
  const rate = close ? SUSPICION_FILL_CLOSE : SUSPICION_FILL_BASE;
  guard.suspicion = Math.min(1, guard.suspicion + rate * dt);
  guard.lastSeenX = player.x;
  guard.lastSeenY = player.y;
  guard.loseSightTimer = 0;
}

function suspicionFalls(guard, dt) {
  const rate = guard.state === 'alarm' ? SUSPICION_ALARM_DRAIN : SUSPICION_DRAIN;
  guard.suspicion = Math.max(0, guard.suspicion - rate * dt);
}

function moveToward(world, guard, targetX, targetY, speed, dt) {
  const dist = distance(guard.x, guard.y, targetX, targetY);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + ((targetX - guard.x) / dist) * step;
  const ny = guard.y + ((targetY - guard.y) / dist) * step;
  guard.facing = angleTo(guard.x, guard.y, targetX, targetY);
  if (!circleHitsSolid(world, nx, guard.y, GUARD_RADIUS)) guard.x = nx;
  if (!circleHitsSolid(world, guard.x, ny, GUARD_RADIUS)) guard.y = ny;
  return distance(guard.x, guard.y, targetX, targetY) < 6;
}

function patrolStep(world, guard, dt) {
  const target = guard.waypoints[guard.waypointIndex];
  const arrived = moveToward(world, guard, target[0], target[1], guard.kind === 'rover' ? ROVER_SPEED : PATROL_SPEED, dt);
  if (arrived) {
    if (guard.kind === 'rover') {
      guard.waypointIndex = Math.floor(guard.random() * guard.waypoints.length);
      if (guard.waypoints[guard.waypointIndex][0] === guard.x && guard.waypoints[guard.waypointIndex][1] === guard.y) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
      }
    } else {
      guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    }
  }
}

function investigateNoise(guard, x, y) {
  // Only a calm guard turns to a noise; an alarmed guard keeps its prey.
  if (guard.state === 'alarm') return;
  guard.state = 'investigate';
  guard.investigateX = x;
  guard.investigateY = y;
  guard.investigateTimer = 3;
}

export function guardHearsNoise(guard, x, y, radius) {
  if (distance(guard.x, guard.y, x, y) > radius) return;
  investigateNoise(guard, x, y);
}

// One fixed step of guard logic. Returns 'caught' when this guard touches
// the player while alarmed, otherwise null.
export function updateGuard(world, guard, player, dt) {
  const seen = guardSeesPlayer(world, guard, player);
  if (seen.sees) {
    suspicionRises(guard, player, seen, dt);
  } else {
    suspicionFalls(guard, dt);
    guard.loseSightTimer += dt;
  }

  if (guard.suspicion >= 1) {
    guard.state = 'alarm';
  } else if (guard.suspicion >= SUSPICIOUS_THRESHOLD && guard.state === 'patrol') {
    guard.state = 'suspicious';
  } else if (guard.suspicion < SUSPICIOUS_THRESHOLD && guard.state === 'suspicious') {
    guard.state = 'patrol';
  }

  if (guard.state === 'alarm') {
    if (seen.sees) {
      guard.lastSeenX = player.x;
      guard.lastSeenY = player.y;
      guard.loseSightTimer = 0;
    }
    moveToward(world, guard, guard.lastSeenX, guard.lastSeenY, CHASE_SPEED, dt);
    if (distance(guard.x, guard.y, player.x, player.y) < CATCH_DISTANCE && seen.sees) {
      return 'caught';
    }
    if (guard.loseSightTimer > SUSPICION_ALARM_LOSE_TIME) {
      guard.state = 'patrol';
      guard.suspicion = SUSPICIOUS_THRESHOLD;
    }
    return null;
  }

  if (guard.state === 'investigate') {
    const arrived = moveToward(world, guard, guard.investigateX, guard.investigateY, INVESTIGATE_SPEED, dt);
    guard.investigateTimer -= dt;
    if (arrived || guard.investigateTimer <= 0) {
      // Look around, then walk back to the patrol route.
      guard.facing += dt * 1.5;
      if (guard.investigateTimer <= -1.2) guard.state = 'patrol';
    }
    return null;
  }

  if (guard.state === 'suspicious') {
    // Walk toward where the player was last seen, but slowly: the player
    // still has a chance to break away. That chance is criterion 2.
    moveToward(world, guard, guard.lastSeenX, guard.lastSeenY, PATROL_SPEED * 1.25, dt);
    return null;
  }

  patrolStep(world, guard, dt);
  return null;
}

export function guardConeColor(guard) {
  if (guard.state === 'alarm') return 'alert';
  if (guard.state === 'suspicious' || guard.state === 'investigate') return 'warm';
  return guard.kind === 'rover' ? 'rover' : 'patrol';
}

// A guard's current vision range (light makes you easier to spot).
export function guardVisionRange(world, guard, player) {
  return isLit(world, player.x, player.y) ? CONE_RANGE_LIT : CONE_RANGE_DARK;
}

export { randomPick };
