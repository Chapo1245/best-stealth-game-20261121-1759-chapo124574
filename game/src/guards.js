// Sleeper Car — guards: patrols, lantern vision cones, hearing, suspicion.
// Two guard kinds: the Conductor (wide short cone, steady patrol) and the
// Ticket Inspector (long narrow cone, pauses to listen, hears running far).
(function () {
  'use strict';
  var L = window.SC.level;

  var CONE_HALF = 0.65; // radians, half-angle of a vision cone
  var STEP = 8; // raycast sample step in px

  function losBlocked(x0, y0, x1, y1) {
    var dx = x1 - x0;
    var dy = y1 - y0;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var steps = Math.max(1, Math.ceil(dist / STEP));
    for (var i = 1; i < steps; i++) {
      var t = i / steps;
      var cx = x0 + dx * t;
      var cy = y0 + dy * t;
      var col = Math.floor(cx / L.TILE);
      var row = Math.floor(cy / L.TILE);
      if (L.isSolid(col, row)) return true;
    }
    return false;
  }

  function angleTo(x0, y0, x1, y1) {
    return Math.atan2(y1 - y0, x1 - x0);
  }

  function angleDiff(a, b) {
    var d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  function Guard(kind, waypoints, speed) {
    this.kind = kind;
    this.waypoints = waypoints;
    this.wp = 0;
    var p0 = L.centerOf(waypoints[0].col, waypoints[0].row);
    this.x = p0.x;
    this.y = p0.y;
    this.dir = 0;
    this.speed = speed;
    this.pause = 0;
    this.state = 'patrol'; // patrol | suspicious | chase | investigate
    this.stateTime = 0;
    this.suspicion = 0; // 0..100, shared alarm meter lives on the guard that sees
    this.lastSeen = null;
    this.investigateTarget = null;
    this.mark = null; // '?' or '!' drawn above the head
    this.markTime = 0;
    if (kind === 'inspector') {
      this.coneRange = 265;
      this.coneHalf = 0.34;
      this.hearRadius = 340;
      this.color = '#e07840';
      this.capColor = '#f5e6c8';
    } else {
      this.coneRange = 195;
      this.coneHalf = CONE_HALF;
      this.hearRadius = 250;
      this.color = '#c94f4f';
      this.capColor = '#2e3d55';
    }
  }

  Guard.prototype.setMark = function (mark, seconds) {
    this.mark = mark;
    this.markTime = seconds;
  };

  Guard.prototype.canSee = function (player) {
    var dx = player.x - this.x;
    var dy = player.y - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > this.coneRange) return 0;
    var ang = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(ang, this.dir)) > this.coneHalf) return 0;
    if (losBlocked(this.x, this.y, player.x, player.y)) return 0;
    // Crouching inside a dark luggage nook: invisible, even in the cone.
    var col = Math.floor(player.x / L.TILE);
    var row = Math.floor(player.y / L.TILE);
    if (player.crouched && L.isCoverFloor(col, row)) return 0;
    var rate = 55; // suspicion points per second at full exposure
    if (!L.lightAt(player.x, player.y)) rate *= 0.55; // shadow slows the eye
    if (player.crouched) rate *= 0.6;
    if (L.isCoverFloor(col, row)) rate *= 0.25; // half-hidden behind the nook
    if (dist < 70) rate *= 1.6; // nose to nose: no hiding
    return rate;
  };

  Guard.prototype.hearNoise = function (nx, ny) {
    var dx = nx - this.x;
    var dy = ny - this.y;
    if (dx * dx + dy * dy > this.hearRadius * this.hearRadius) return false;
    if (this.state === 'chase') return false;
    this.investigateTarget = { x: nx, y: ny };
    this.state = 'investigate';
    this.stateTime = 0;
    this.setMark('?', 1.6);
    return true;
  };

  Guard.prototype.moveToward = function (tx, ty, dt, speed) {
    var dx = tx - this.x;
    var dy = ty - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 2) return true;
    var step = Math.min(dist, speed * dt);
    var nx = this.x + (dx / dist) * step;
    var ny = this.y + (dy / dist) * step;
    if (!hitsSolid(nx, this.y)) this.x = nx;
    if (!hitsSolid(this.x, ny)) this.y = ny;
    this.dir = Math.atan2(dy, dx);
    return dist - step < 2;
  };

  function hitsSolid(px, py) {
    var r = 13;
    var pts = [
      [px - r, py - r], [px + r, py - r],
      [px - r, py + r], [px + r, py + r]
    ];
    for (var i = 0; i < pts.length; i++) {
      if (L.isSolid(Math.floor(pts[i][0] / L.TILE), Math.floor(pts[i][1] / L.TILE))) return true;
    }
    return false;
  }

  Guard.prototype.update = function (dt, player, alarm) {
    this.stateTime += dt;
    if (this.markTime > 0) {
      this.markTime -= dt;
      if (this.markTime <= 0) this.mark = null;
    }
    var seen = this.canSee(player);
    if (seen > 0) {
      this.suspicion = Math.min(100, this.suspicion + seen * dt);
      this.lastSeen = { x: player.x, y: player.y };
      if (this.suspicion > 35) this.setMark('?', 0.5);
      if (this.suspicion >= 100 && this.state !== 'chase') {
        this.state = 'chase';
        this.stateTime = 0;
        this.setMark('!', 2.5);
        alarm(this);
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - 22 * dt);
    }

    if (this.state === 'chase') {
      var target = this.lastSeen || { x: player.x, y: player.y };
      this.moveToward(target.x, target.y, dt, 150);
      if (this.stateTime > 6) {
        this.state = 'patrol';
        this.stateTime = 0;
        this.suspicion = 40;
      }
      return;
    }
    if (this.state === 'investigate' && this.investigateTarget) {
      var arrived = this.moveToward(this.investigateTarget.x, this.investigateTarget.y, dt, this.speed * 1.6);
      if (arrived || this.stateTime > 7) {
        this.state = 'patrol';
        this.stateTime = 0;
        this.investigateTarget = null;
        this.pause = 1.2; // look around, then resume the round
      }
      return;
    }
    if (this.pause > 0) {
      this.pause -= dt;
      this.dir += dt * 0.9; // slow scan while paused
      return;
    }
    var wp = this.waypoints[this.wp];
    var dest = L.centerOf(wp.col, wp.row);
    var reached = this.moveToward(dest.x, dest.y, dt, this.speed);
    if (reached) {
      this.wp = (this.wp + 1) % this.waypoints.length;
      // The inspector stops at each end of the aisle to listen.
      this.pause = this.kind === 'inspector' ? 1.6 : 0.5;
    }
  };

  function buildGuards() {
    return [
      new Guard('conductor', L.PATROLS.conductorA, 55),
      new Guard('conductor', L.PATROLS.conductorB, 55),
      new Guard('conductor', L.PATROLS.conductorC, 50),
      new Guard('inspector', L.PATROLS.inspector, 68)
    ];
  }

  window.SC.guards = {
    Guard: Guard,
    buildGuards: buildGuards,
    losBlocked: losBlocked,
    angleDiff: angleDiff,
    angleTo: angleTo
  };
})();
