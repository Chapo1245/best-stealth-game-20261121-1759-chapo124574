// Sleeper Car — the thief: movement, running noise, crouching, collecting.
(function () {
  'use strict';
  var L = window.SC.level;

  function Player() {
    var s = L.centerOf(L.start.col, L.start.row);
    this.x = s.x;
    this.y = s.y;
    this.r = 13;
    this.crouched = false;
    this.running = false;
    this.moving = false;
    this.stepPhase = 0;
    this.noiseTimer = 0;
    this.rings = []; // expanding footstep-noise rings {x, y, r, max}
    this.clickTarget = null;
    this.pages = 0;
    this.facing = 0;
  }

  Player.prototype.toggleCrouch = function () {
    this.crouched = !this.crouched;
    return this.crouched;
  };

  Player.prototype.tryMove = function (nx, ny) {
    var r = this.r - 2;
    var pts = [
      [nx - r, ny - r], [nx + r, ny - r],
      [nx - r, ny + r], [nx + r, ny + r]
    ];
    for (var i = 0; i < pts.length; i++) {
      if (L.isSolid(Math.floor(pts[i][0] / L.TILE), Math.floor(pts[i][1] / L.TILE))) return false;
    }
    return true;
  };

  Player.prototype.update = function (dt, keys, onNoise, onStep) {
    var vx = 0;
    var vy = 0;
    if (keys['arrowup'] || keys['w']) vy -= 1;
    if (keys['arrowdown'] || keys['s']) vy += 1;
    if (keys['arrowleft'] || keys['a']) vx -= 1;
    if (keys['arrowright'] || keys['d']) vx += 1;

    if (vx === 0 && vy === 0 && this.clickTarget) {
      var dx = this.clickTarget.x - this.x;
      var dy = this.clickTarget.y - this.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < 6) {
        this.clickTarget = null;
      } else {
        vx = dx / d;
        vy = dy / d;
      }
    }

    var len = Math.sqrt(vx * vx + vy * vy);
    this.moving = len > 0;
    if (this.moving) {
      vx /= len;
      vy /= len;
      this.facing = Math.atan2(vy, vx);
      var speed = this.crouched ? 70 : (keys['shift'] ? 230 : 140);
      this.running = !!keys['shift'] && !this.crouched;
      var nx = this.x + vx * speed * dt;
      var ny = this.y + vy * speed * dt;
      if (this.tryMove(nx, this.y)) this.x = nx;
      if (this.tryMove(this.x, ny)) this.y = ny;
      this.stepPhase += speed * dt;
      if (this.stepPhase > 34) {
        this.stepPhase = 0;
        if (onStep) onStep(this.running);
      }
      if (this.running) {
        this.noiseTimer -= dt;
        if (this.noiseTimer <= 0) {
          this.noiseTimer = 0.4;
          this.rings.push({ x: this.x, y: this.y, r: 12, max: 200 });
          if (onNoise) onNoise(this.x, this.y);
        }
      }
    } else {
      this.running = false;
    }

    for (var i = this.rings.length - 1; i >= 0; i--) {
      this.rings[i].r += 260 * dt;
      if (this.rings[i].r > this.rings[i].max) this.rings.splice(i, 1);
    }
  };

  Player.prototype.hiddenNow = function () {
    var col = Math.floor(this.x / L.TILE);
    var row = Math.floor(this.y / L.TILE);
    return this.crouched && L.isCoverFloor(col, row);
  };

  Player.prototype.onPageTile = function (pages) {
    var col = Math.floor(this.x / L.TILE);
    var row = Math.floor(this.y / L.TILE);
    for (var i = 0; i < pages.length; i++) {
      if (!pages[i].taken && pages[i].col === col && pages[i].row === row) return pages[i];
    }
    return null;
  };

  Player.prototype.atExit = function () {
    var col = Math.floor(this.x / L.TILE);
    var row = Math.floor(this.y / L.TILE);
    return col === L.exitTile.col && row === L.exitTile.row;
  };

  window.SC.player = { Player: Player };
})();
