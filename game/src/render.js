// Coin & Candlelight: drawing — the museum, the cones, the thief.
// One file, one job: turning state into a picture. Cones are drawn first
// and cut by raycast, so a pedestal between a guard and Wren really hides
// her; then walls, cover, candles, relics, coins, actors and the HUD.
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CATCH_DISTANCE,
  COIN_COUNT,
  COLORS,
  CONE_HALF_ANGLE,
  GUARD_RADIUS,
  HUD_HEIGHT,
  PLAYER_RADIUS,
} from './config.js';
import { angleDifference, angleTo, distance, hasLineOfSight, isLit, pointInRect } from './world.js';
import { guardConeColor, guardVisionRange } from './guards.js';

const CONE_RAYS = 26;
const RAY_STEP = 6;

function rayLength(world, x, y, angle, maxLen) {
  for (let d = RAY_STEP; d <= maxLen; d += RAY_STEP) {
    const px = x + Math.cos(angle) * d;
    const py = y + Math.sin(angle) * d;
    let blocked = false;
    for (const block of world.walls) {
      if (pointInRect(px, py, block)) { blocked = true; break; }
    }
    if (!blocked) {
      for (const block of world.cover) {
        if (pointInRect(px, py, block)) { blocked = true; break; }
      }
    }
    if (blocked) return d - RAY_STEP;
  }
  return maxLen;
}

export function visionConePolygon(world, guard) {
  const range = guardVisionRange(world, guard, { x: guard.x, y: guard.y });
  const points = [{ x: guard.x, y: guard.y }];
  for (let i = 0; i <= CONE_RAYS; i++) {
    const angle = guard.facing - CONE_HALF_ANGLE + (2 * CONE_HALF_ANGLE * i) / CONE_RAYS;
    const len = rayLength(world, guard.x, guard.y, angle, range);
    points.push({ x: guard.x + Math.cos(angle) * len, y: guard.y + Math.sin(angle) * len });
  }
  return points;
}

function drawVisionCone(ctx, world, guard) {
  const kind = guardConeColor(guard);
  const fill = kind === 'alert' ? COLORS.alertCone : kind === 'warm' ? COLORS.roverCone : kind === 'rover' ? COLORS.roverCone : COLORS.patrolCone;
  const edge = kind === 'alert' ? COLORS.alertConeEdge : kind === 'warm' ? COLORS.roverConeEdge : kind === 'rover' ? COLORS.roverConeEdge : COLORS.patrolConeEdge;
  const polygon = visionConePolygon(world, guard);
  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (let i = 1; i < polygon.length; i++) ctx.lineTo(polygon[i].x, polygon[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawFloor(ctx, world) {
  ctx.fillStyle = COLORS.floorDark;
  ctx.fillRect(0, HUD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - HUD_HEIGHT);
  ctx.fillStyle = COLORS.floorLight;
  const { left, top, right, bottom } = world.bounds;
  for (let y = top + 24; y < bottom - 12; y += 48) {
    ctx.fillRect(left + 12, y, right - left - 24, 2);
  }
  ctx.fillStyle = 'rgba(232, 228, 216, 0.10)';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  for (const gallery of world.galleries) {
    ctx.fillText(gallery.name, gallery.left + 203, top + 44);
  }
  ctx.textAlign = 'left';
}

function drawWallsAndCover(ctx, world) {
  for (const wall of world.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(wall.x, wall.y, wall.w, 3);
  }
  for (const block of world.cover) {
    ctx.fillStyle = COLORS.cover;
    ctx.fillRect(block.x, block.y, block.w, block.h);
    ctx.fillStyle = COLORS.coverTop;
    ctx.fillRect(block.x, block.y, block.w, 4);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(block.x + 0.5, block.y + 0.5, block.w - 1, block.h - 1);
  }
}

function drawCandleGlow(ctx, world) {
  for (const candle of world.candles) {
    const gradient = ctx.createRadialGradient(candle.x, candle.y, 4, candle.x, candle.y, candle.radius);
    gradient.addColorStop(0, COLORS.candleGlow);
    gradient.addColorStop(1, 'rgba(255, 176, 84, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(candle.x, candle.y, candle.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.candleCore;
    ctx.beginPath();
    ctx.arc(candle.x, candle.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLoot(ctx, world, timeMs) {
  const pulse = 0.75 + 0.25 * Math.sin(timeMs / 280);
  for (const item of world.loot) {
    if (item.taken) continue;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = COLORS.loot;
    ctx.beginPath();
    ctx.moveTo(item.x, item.y - 11);
    ctx.lineTo(item.x + 8, item.y);
    ctx.lineTo(item.x, item.y + 11);
    ctx.lineTo(item.x - 8, item.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(item.x - 2, item.y - 3, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCoins(ctx, coins, timeMs) {
  for (const coin of coins) {
    const bob = coin.landed ? 0 : Math.sin((coin.t * Math.PI)) * 10;
    ctx.fillStyle = COLORS.coin;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y - bob, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    if (!coin.landed) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(coin.landX, coin.landY, 6, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawExit(ctx, world) {
  const zone = world.exitZone;
  ctx.fillStyle = COLORS.exit;
  ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  ctx.fillStyle = COLORS.exitDark;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(zone.x + zone.w / 2, zone.y + zone.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('EXIT', 0, 5);
  ctx.restore();
  ctx.textAlign = 'left';
}

function drawNoiseRings(ctx, rings) {
  ctx.strokeStyle = 'rgba(158, 203, 255, 0.8)';
  ctx.lineWidth = 2;
  for (const ring of rings) {
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawGuard(ctx, guard) {
  const ring = guard.kind === 'rover' ? COLORS.roverConeEdge : COLORS.patrolConeEdge;
  ctx.fillStyle = '#1d1a12';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD_RADIUS + 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ring;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.strokeStyle = '#f5efe0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.facing) * (GUARD_RADIUS + 4), guard.y + Math.sin(guard.facing) * (GUARD_RADIUS + 4));
  ctx.stroke();
  if (guard.state === 'suspicious' || guard.state === 'investigate') {
    ctx.fillStyle = '#ffd640';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - GUARD_RADIUS - 8);
    ctx.textAlign = 'left';
  }
  if (guard.state === 'alarm') {
    ctx.fillStyle = '#ff3b3b';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - GUARD_RADIUS - 8);
    ctx.textAlign = 'left';
  }
}

function drawPlayer(ctx, player, timeMs) {
  const bob = player.moving ? Math.sin(timeMs / 90) * 1.5 : 0;
  ctx.fillStyle = COLORS.playerRing;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, PLAYER_RADIUS + 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2a3348';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y + bob);
  ctx.lineTo(player.x + Math.cos(player.facing) * (PLAYER_RADIUS + 3), player.y + bob + Math.sin(player.facing) * (PLAYER_RADIUS + 3));
  ctx.stroke();
}

function drawHud(ctx, state) {
  const { player, guards } = state;
  ctx.fillStyle = '#0d0f16';
  ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('COIN & CANDLELIGHT', 16, 28);
  ctx.fillStyle = COLORS.hudMuted;
  ctx.font = '15px sans-serif';
  ctx.fillText('The Gilded Vault — steal 3 relics, reach the EXIT unseen', 16, 50);
  const taken = state.world.loot.filter((item) => item.taken).length;
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`◆ ${taken} / 3`, CANVAS_WIDTH / 2 - 60, 30);
  ctx.fillStyle = COLORS.coin;
  ctx.font = 'bold 18px sans-serif';
  let coinMarks = '';
  for (let i = 0; i < COIN_COUNT; i++) coinMarks += i < player.coinsLeft ? '●' : '○';
  ctx.fillText(coinMarks, CANVAS_WIDTH / 2 + 60, 30);
  ctx.fillStyle = COLORS.hudMuted;
  ctx.font = '14px sans-serif';
  ctx.fillText('WASD move · SHIFT run (loud) · C toss coin · R restart', CANVAS_WIDTH / 2, 52);
  ctx.textAlign = 'left';
  const maxSuspicion = Math.max(0, ...guards.map((g) => g.suspicion));
  const alarmed = guards.some((g) => g.state === 'alarm');
  const label = alarmed ? '◉ ALARM!' : maxSuspicion >= 0.55 ? '◉ spotted?' : '◉ unseen';
  ctx.fillStyle = alarmed ? '#ff5a5a' : maxSuspicion >= 0.55 ? '#ffd640' : COLORS.hudText;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(label, CANVAS_WIDTH - 16, 28);
  ctx.textAlign = 'left';
  const barX = CANVAS_WIDTH - 176;
  const barY = 38;
  ctx.fillStyle = '#22242e';
  ctx.fillRect(barX, barY, 160, 10);
  ctx.fillStyle = alarmed ? '#ff3b3b' : maxSuspicion >= 0.55 ? '#ffd640' : '#39d353';
  ctx.fillRect(barX, barY, 160 * maxSuspicion, 10);
}

function drawBanner(ctx, state) {
  if (state.phase === 'play') return;
  ctx.fillStyle = 'rgba(5, 6, 10, 0.72)';
  ctx.fillRect(0, 300, CANVAS_WIDTH, 170);
  ctx.textAlign = 'center';
  if (state.phase === 'caught') {
    ctx.fillStyle = COLORS.bannerBad;
    ctx.font = 'bold 56px sans-serif';
    ctx.fillText('CAUGHT!', CANVAS_WIDTH / 2, 368);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = '20px sans-serif';
    ctx.fillText('A guard closed the distance. The night is over.', CANVAS_WIDTH / 2, 408);
  } else {
    ctx.fillStyle = COLORS.banner;
    ctx.font = 'bold 56px sans-serif';
    const seen = state.spottedCount === 0 ? 'UNSEEN!' : `spotted ${state.spottedCount}x`;
    ctx.fillText(`ESCAPED — ${seen.toUpperCase()}`, CANVAS_WIDTH / 2, 368);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = '20px sans-serif';
    ctx.fillText(`All 3 relics, never caught. Time ${state.elapsedSeconds.toFixed(1)}s.`, CANVAS_WIDTH / 2, 408);
  }
  ctx.fillStyle = COLORS.hudMuted;
  ctx.font = '16px sans-serif';
  ctx.fillText('Press R to play again', CANVAS_WIDTH / 2, 440);
  ctx.textAlign = 'left';
}

export function drawScene(ctx, state, timeMs) {
  const { world, player, guards } = state;
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawFloor(ctx, world);
  for (const guard of guards) drawVisionCone(ctx, world, guard);
  drawWallsAndCover(ctx, world);
  drawCandleGlow(ctx, world);
  drawLoot(ctx, world, timeMs);
  drawCoins(ctx, state.coins, timeMs);
  drawExit(ctx, world);
  drawNoiseRings(ctx, state.rings);
  for (const guard of guards) drawGuard(ctx, guard);
  drawPlayer(ctx, player, timeMs);
  drawHud(ctx, state);
  drawBanner(ctx, state);
}
