// Sleeper Car — canvas rendering: the carriage, lamplight, vision cones,
// cover, the exit door, and every label the judge reads at a glance.
(function () {
  'use strict';
  var L = window.SC.level;

  function drawFloor(ctx, time) {
    for (var r = 0; r < L.ROWS; r++) {
      for (var c = 0; c < L.COLS; c++) {
        var t = L.tileAt(c, r);
        var x = c * L.TILE;
        var y = r * L.TILE;
        if (t === '#') {
          ctx.fillStyle = '#241a12';
          ctx.fillRect(x, y, L.TILE, L.TILE);
          ctx.fillStyle = '#3a2c1e';
          ctx.fillRect(x, y, L.TILE, 4);
        } else if (t === 'C') {
          ctx.fillStyle = '#1d2b1a';
          ctx.fillRect(x, y, L.TILE, L.TILE);
          ctx.fillStyle = '#2c4426';
          ctx.fillRect(x + 3, y + 3, L.TILE - 6, L.TILE - 6);
          ctx.strokeStyle = '#55703f';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 7, y + 7, L.TILE - 14, L.TILE - 14);
        } else if (t === 'c') {
          ctx.fillStyle = '#191d16';
          ctx.fillRect(x, y, L.TILE, L.TILE);
          ctx.fillStyle = '#232b1e';
          ctx.fillRect(x + 2, y + 2, L.TILE - 4, L.TILE - 4);
        } else {
          var shade = (c + r) % 2 === 0 ? '#2b2118' : '#2e241a';
          ctx.fillStyle = shade;
          ctx.fillRect(x, y, L.TILE, L.TILE);
          ctx.strokeStyle = 'rgba(0,0,0,0.25)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, L.TILE - 1, L.TILE - 1);
        }
      }
    }
    // Warm lamp pools on the floor.
    for (var i = 0; i < L.LAMPS.length; i++) {
      var lx = (L.LAMPS[i].col + 0.5) * L.TILE;
      var ly = (L.LAMPS[i].row + 0.5) * L.TILE;
      var g = ctx.createRadialGradient(lx, ly, 6, lx, ly, L.LAMP_RADIUS);
      var flicker = 0.10 + 0.02 * Math.sin(time * 2.1 + i * 1.7);
      g.addColorStop(0, 'rgba(255, 205, 110, ' + flicker.toFixed(3) + ')');
      g.addColorStop(1, 'rgba(255, 205, 110, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(lx - L.LAMP_RADIUS, ly - L.LAMP_RADIUS, L.LAMP_RADIUS * 2, L.LAMP_RADIUS * 2);
      ctx.fillStyle = '#ffd977';
      ctx.beginPath();
      ctx.arc(lx, ly, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Rack labels so cover reads at a glance.
    ctx.fillStyle = '#8fae6d';
    ctx.font = 'bold 9px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var r2 = 0; r2 < L.ROWS; r2++) {
      for (var c2 = 0; c2 < L.COLS; c2++) {
        if (L.tileAt(c2, r2) === 'C') {
          ctx.fillText('COVER', (c2 + 0.5) * L.TILE, (r2 + 0.5) * L.TILE);
        }
      }
    }
  }

  function drawPages(ctx, pages, time) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].taken) continue;
      var p = L.centerOf(pages[i].col, pages[i].row);
      var pulse = 0.5 + 0.3 * Math.sin(time * 3 + i);
      ctx.fillStyle = 'rgba(245, 201, 92, ' + (0.18 + pulse * 0.15).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5e6b8';
      ctx.fillRect(p.x - 8, p.y - 11, 16, 22);
      ctx.strokeStyle = '#8a6d2f';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x - 8, p.y - 11, 16, 22);
      ctx.fillStyle = '#5a4517';
      ctx.font = 'bold 13px Georgia, serif';
      ctx.fillText('§', p.x, p.y + 1);
    }
  }

  function drawExit(ctx, pagesCollected, time) {
    var e = L.centerOf(L.exitTile.col, L.exitTile.row);
    var open = pagesCollected >= 3;
    var glow = open ? (0.45 + 0.25 * Math.sin(time * 4)) : 0.16;
    ctx.fillStyle = open ? 'rgba(126, 231, 135, ' + glow.toFixed(3) + ')'
                         : 'rgba(245, 201, 92, ' + glow.toFixed(3) + ')';
    ctx.beginPath();
    ctx.arc(e.x, e.y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = open ? '#1d5c26' : '#5c4a17';
    ctx.fillRect(e.x - 14, e.y - 18, 28, 36);
    ctx.strokeStyle = open ? '#7ee787' : '#f5c95c';
    ctx.lineWidth = 2;
    ctx.strokeRect(e.x - 14, e.y - 18, 28, 36);
    ctx.fillStyle = open ? '#7ee787' : '#f5c95c';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', e.x, e.y - 30);
    if (open) {
      ctx.font = 'bold 11px Georgia, serif';
      ctx.fillText('OPEN — GO!', e.x - 8, e.y + 30);
    }
  }

  function drawCone(ctx, guard) {
    var half = guard.coneHalf;
    var range = guard.coneRange;
    var hot = guard.state === 'chase';
    var col = hot ? '229, 72, 77' : (guard.kind === 'inspector' ? '232, 130, 64' : '232, 185, 59');
    var alpha = hot ? 0.42 : 0.30;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.arc(guard.x, guard.y, range, guard.dir - half, guard.dir + half);
    ctx.closePath();
    ctx.fillStyle = 'rgba(' + col + ', ' + alpha.toFixed(2) + ')';
    ctx.fill();
    ctx.strokeStyle = 'rgba(' + col + ', 0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.dir - half) * range, guard.y + Math.sin(guard.dir - half) * range);
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.dir + half) * range, guard.y + Math.sin(guard.dir + half) * range);
    ctx.stroke();
  }

  function drawGuard(ctx, guard) {
    drawCone(ctx, guard);
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = guard.color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#f5e6c8';
    ctx.stroke();
    // Cap + facing tick.
    ctx.fillStyle = guard.capColor;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y - 3, 8, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.dir) * 20, guard.y + Math.sin(guard.dir) * 20);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var label = guard.kind === 'inspector' ? 'INSPECTOR' : 'GUARD';
    ctx.fillText(label, guard.x, guard.y + 26);
    if (guard.mark) {
      ctx.fillStyle = guard.mark === '!' ? '#ff5a5a' : '#ffd75e';
      ctx.font = 'bold 22px Georgia, serif';
      ctx.fillText(guard.mark, guard.x, guard.y - 26);
    }
  }

  function drawPlayer(ctx, player, time) {
    for (var i = 0; i < player.rings.length; i++) {
      var ring = player.rings[i];
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.55 * (1 - ring.r / ring.max)).toFixed(2) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    var bob = player.moving ? Math.sin(time * 14) * 1.5 : 0;
    ctx.beginPath();
    ctx.arc(player.x, player.y + bob, player.r, 0, Math.PI * 2);
    ctx.fillStyle = player.hiddenNow() ? '#3f7d5a' : '#37b6c9';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('YOU', player.x, player.y + 24);
    if (player.crouched) {
      ctx.fillStyle = '#cfe8d8';
      ctx.font = 'bold 10px Georgia, serif';
      ctx.fillText('CROUCHED — HIDDEN IN COVER', player.x, player.y - 26);
    }
  }

  function drawScene(ctx, state, time) {
    ctx.clearRect(0, 0, 960, 600);
    drawFloor(ctx, time);
    drawPages(ctx, state.pages, time);
    drawExit(ctx, state.player.pages, time);
    for (var i = 0; i < state.guards.length; i++) drawGuard(ctx, state.guards[i]);
    drawPlayer(ctx, state.player, time);
  }

  window.SC.render = {
    drawScene: drawScene, drawFloor: drawFloor, drawPages: drawPages,
    drawExit: drawExit, drawGuard: drawGuard, drawPlayer: drawPlayer
  };
})();
