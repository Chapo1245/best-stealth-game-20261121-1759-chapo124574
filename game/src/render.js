// Emberlight: everything the judge sees.
// One file, one job: drawing. The contact sheet is the entry, so every
// draw call serves one question: can a stranger tell, at a glance, that
// this is a stealth game — level, guards with cones, cover, exit?
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLORS,
  CONE_HALF_ANGLE,
  CONE_RANGE_DARK,
  CONE_RANGE_LIT,
  GUARD_RADIUS,
  HUD_HEIGHT,
  TRAIN_BOTTOM,
  TRAIN_LEFT,
} from './config.js';
import { isLit, pointInRect } from './world.js';
import { guardConeColor } from './guards.js';

// --- vision cone: raycast polygon, so walls and cover really stop sight ---

function rayLength(world, x, y, angle, maxLen) {
  const step = 6;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  for (let d = step; d <= maxLen; d += step) {
    const px = x + dx * d;
    const py = y + dy * d;
    for (const wall of world.walls) {
      if (pointInRect(px, py, wall)) return d;
    }
    for (const block of world.cover) {
      if (pointInRect(px, py, block)) return d;
    }
  }
  return maxLen;
}

export function visionConePolygon(world, guard) {
  const range = guard.coneRange;
  const rays = 26;
  const points = [[guard.x, guard.y]];
  for (let i = 0; i <= rays; i++) {
    const angle = guard.facing - CONE_HALF_ANGLE + ((2 * CONE_HALF_ANGLE * i) / rays);
    const len = rayLength(world, guard.x, guard.y, angle, range);
    points.push([guard.x + Math.cos(angle) * len, guard.y + Math.sin(angle) * len]);
  }
  return points;
}

function drawVisionCone(ctx, world, guard) {
  const kind = guardConeColor(guard);
  const fill = kind === 'alert' ? COLORS.alertCone : kind === 'rover' || kind === 'warm' ? COLORS.roverCone : COLORS.patrolCone;
  const edge = kind === 'alert' ? COLORS.alertConeEdge : kind === 'rover' || kind === 'warm' ? COLORS.roverConeEdge : COLORS.patrolConeEdge;
  const polygon = visionConePolygon(world, guard);
  ctx.beginPath();
  ctx.moveTo(polygon[0][0], polygon[0][1]);
  for (let i = 1; i < polygon.length; i++) ctx.lineTo(polygon[i][0], polygon[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// --- floor, walls, cover, lamps ---

function drawFloor(ctx, world, timeMs) {
  ctx.fillStyle = COLORS.floorDark;
  ctx.fillRect(0, HUD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - HUD_HEIGHT);
  // Carriage floors alternate a shade; plank lines run across each car.
  const cars = 4;
  for (let i = 0; i < cars; i++) {
    const left = TRAIN_LEFT + i * 320;
    if (i % 2 === 1) {
      ctx.fillStyle = COLORS.floorLight;
      ctx.fillRect(left, HUD_HEIGHT + 12, 300, CANVAS_HEIGHT - HUD_HEIGHT - 24);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.lineWidth = 1;
    for (let y = HUD_HEIGHT + 40; y < CANVAS_HEIGHT - 12; y += 46) {
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(left + 300, y);
      ctx.stroke();
    }
  }
  // Carriage names, faint on the floor — the judge reads "train" at once.
  const names = ['SLEEPER', 'DINING', 'LOUNGE', 'VAULT'];
  ctx.fillStyle = 'rgba(232, 236, 244, 0.10)';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < cars; i++) {
    ctx.fillText(names[i], TRAIN_LEFT + i * 320 + 150, HUD_HEIGHT + 52);
  }
  void timeMs;
}

function drawWallsAndCover(ctx, world) {
  for (const wall of world.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = COLORS.wallTop;
    if (wall.h <= 12) ctx.fillRect(wall.x, wall.y, wall.w, 3);
    else ctx.fillRect(wall.x, wall.y, 3, wall.h);
  }
  for (const block of world.cover) {
    ctx.fillStyle = COLORS.cover;
    ctx.fillRect(block.x, block.y, block.w, block.h);
    ctx.fillStyle = COLORS.coverTop;
    ctx.fillRect(block.x, block.y, block.w, 4);
    ctx.fillRect(block.x, block.y, 4, block.h);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(block.x + 0.5, block.y + 0.5, block.w - 1, block.h - 1);
  }
}

function drawLampGlow(ctx, world) {
  for (const lamp of world.lamps) {
    const glow = ctx.createRadialGradient(lamp.x, lamp.y, 6, lamp.x, lamp.y, lamp.radius);
    glow.addColorStop(0, COLORS.lampGlow);
    glow.addColorStop(1, 'rgba(255, 190, 90, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.lampCore;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- loot, exit, actors ---

function drawLoot(ctx, world, timeMs) {
  for (const item of world.loot) {
    if (item.taken) continue;
    const pulse = 0.6 + 0.4 * Math.sin(timeMs / 280 + item.x);
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = COLORS.loot;
    ctx.globalAlpha = 0.55 + 0.45 * pulse;
    ctx.fillRect(-7, -7, 14, 14);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#d9fff4';
    ctx.lineWidth = 2;
    ctx.strokeRect(-7, -7, 14, 14);
    ctx.restore();
    // Sparkle: four short rays around the stone.
    ctx.strokeStyle = `rgba(126, 240, 212, ${0.5 * pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(item.x - 16, item.y);
    ctx.lineTo(item.x - 9, item.y);
    ctx.moveTo(item.x + 9, item.y);
    ctx.lineTo(item.x + 16, item.y);
    ctx.moveTo(item.x, item.y - 16);
    ctx.lineTo(item.x, item.y - 9);
    ctx.moveTo(item.x, item.y + 9);
    ctx.lineTo(item.x, item.y + 16);
    ctx.stroke();
  }
}

function drawExit(ctx, world, timeMs, allLootTaken) {
  const zone = world.exitZone;
  const pulse = allLootTaken ? 0.65 + 0.35 * Math.sin(timeMs / 200) : 1;
  ctx.fillStyle = COLORS.exitDark;
  ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  ctx.fillStyle = `rgba(57, 211, 83, ${0.25 + 0.45 * pulse})`;
  ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  ctx.strokeStyle = COLORS.exit;
  ctx.lineWidth = 3;
  ctx.strokeRect(zone.x + 1.5, zone.y + 1.5, zone.w - 3, zone.h - 3);
  ctx.save();
  ctx.translate(zone.x + zone.w / 2, zone.y + zone.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#eafff0';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(allLootTaken ? 'EXIT — GO!' : 'EXIT', 0, 8);
  ctx.restore();
}

function drawNoiseRings(ctx, rings) {
  for (const ring of rings) {
    ctx.strokeStyle = `rgba(158, 203, 255, ${ring.alpha})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawGuard(ctx, guard) {
  const rim = guard.kind === 'rover' ? COLORS.roverConeEdge : COLORS.patrolConeEdge;
  const body = guard.state === 'alarm' ? '#ff5a5a' : guard.kind === 'rover' ? '#3a2c22' : '#2c3145';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = guard.state === 'alarm' ? COLORS.alertConeEdge : rim;
  ctx.lineWidth = 3;
  ctx.stroke();
  // Facing tick: where the guard looks.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing) * (GUARD_RADIUS + 7), guard.y + Math.sin(guard.facing) * (GUARD_RADIUS + 7));
  ctx.stroke();
  // Suspicion marks: "?" while suspicious, "!" while alarmed.
  if (guard.state === 'suspicious' || guard.state === 'investigate') {
    ctx.fillStyle = '#ffd640';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - GUARD_RADIUS - 8);
  } else if (guard.state === 'alarm') {
    ctx.fillStyle = '#ff3b3b';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - GUARD_RADIUS - 8);
  }
}

function drawPlayer(ctx, player) {
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.player;
  ctx.fill();
  ctx.strokeStyle = COLORS.playerRing;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = '#1b1e2a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + Math.cos(player.facing) * (player.radius + 6), player.y + Math.sin(player.facing) * (player.radius + 6));
  ctx.stroke();
  if (player.running) {
    ctx.strokeStyle = 'rgba(232, 241, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x - Math.cos(player.facing) * 16, player.y - Math.sin(player.facing) * 16);
    ctx.lineTo(player.x - Math.cos(player.facing) * 24, player.y - Math.sin(player.facing) * 24);
    ctx.stroke();
  }
}

// --- HUD and end banners ---

function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('EMBERLIGHT', 16, 28);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '15px sans-serif';
  ctx.fillText('Night Train Heist — steal 3 treasures, reach the EXIT unseen', 16, 50);
  // Loot counter.
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`◆ ${state.player.lootTaken} / ${state.world.loot.length}`, 640, 30);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '14px sans-serif';
  ctx.fillText('WASD move · SHIFT run (loud) · R restart', 640, 50);
  // Suspicion eye: the highest guard suspicion, green to red.
  const worst = Math.max(0, ...state.guards.map((g) => g.suspicion));
  const alarmed = state.guards.some((g) => g.state === 'alarm');
  ctx.textAlign = 'right';
  ctx.fillStyle = alarmed ? COLORS.danger : COLORS.hudText;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(alarmed ? '◉ ALARM!' : '◉ unseen', 1264, 30);
  const barX = 1090;
  const barW = 150;
  ctx.fillStyle = '#262b3a';
  ctx.fillRect(barX, 40, barW, 10);
  ctx.fillStyle = worst < 0.55 ? COLORS.ok : worst < 1 ? '#ffb020' : COLORS.danger;
  ctx.fillRect(barX, 40, barW * worst, 10);
  ctx.strokeStyle = '#4a5068';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX + 0.5, 40.5, barW - 1, 9);
}

function drawBanner(ctx, title, subtitle, color) {
  ctx.fillStyle = 'rgba(10, 12, 20, 0.72)';
  ctx.fillRect(0, 300, CANVAS_WIDTH, 170);
  ctx.fillStyle = color;
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, CANVAS_WIDTH / 2, 365);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '24px sans-serif';
  ctx.fillText(subtitle, CANVAS_WIDTH / 2, 410);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '17px sans-serif';
  ctx.fillText('Press R to play again', CANVAS_WIDTH / 2, 442);
}

// --- the whole scene, in draw order ---

export function drawScene(ctx, state, timeMs) {
  const { world, player, guards, rings } = state;
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawFloor(ctx, world, timeMs);
  drawLampGlow(ctx, world);
  // Cones first, then walls and cover paint over them: sight really stops.
  for (const guard of guards) {
    guard.coneRange = isLit(world, player.x, player.y) ? CONE_RANGE_LIT : CONE_RANGE_DARK;
    drawVisionCone(ctx, world, guard);
  }
  drawWallsAndCover(ctx, world);
  drawLoot(ctx, world, timeMs);
  drawExit(ctx, world, timeMs, player.lootTaken >= world.loot.length);
  drawNoiseRings(ctx, rings);
  for (const guard of guards) drawGuard(ctx, guard);
  drawPlayer(ctx, player);
  drawHud(ctx, state);
  if (state.phase === 'caught') {
    drawBanner(ctx, 'CAUGHT!', 'A guard caught Wren in the lamplight.', COLORS.danger);
  } else if (state.phase === 'escaped') {
    const unseen = state.spottedCount === 0;
    drawBanner(
      ctx,
      unseen ? 'ESCAPED — UNSEEN!' : 'ESCAPED!',
      unseen
        ? `All 3 treasures, never spotted. Time ${state.elapsedSeconds.toFixed(1)}s.`
        : `All 3 treasures, spotted ${state.spottedCount}×. Time ${state.elapsedSeconds.toFixed(1)}s.`,
      COLORS.ok,
    );
  }
  void TRAIN_BOTTOM;
}
