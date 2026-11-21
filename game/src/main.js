// Sleeper Car — game loop, input, win/lose, HUD. Keyboard + mouse,
// one level, three ledger pages, one rear exit, four patrolling guards.
(function () {
  'use strict';
  var L = window.SC.level;
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var pagesEl = document.getElementById('pages');
  var timerEl = document.getElementById('timer');
  var bannerEl = document.getElementById('banner');
  var fillEl = document.getElementById('suspicionFill');
  var overlayEl = document.getElementById('overlay');
  var overlayTitle = document.getElementById('overlayTitle');
  var overlayText = document.getElementById('overlayText');
  var overlayKeys = document.getElementById('overlayKeys');

  var TOTAL_PAGES = 3;

  function newState() {
    var pages = L.pages.map(function (p) {
      return { col: p.col, row: p.row, taken: false };
    });
    return {
      player: new window.SC.player.Player(),
      guards: window.SC.guards.buildGuards(),
      pages: pages,
      time: 0,
      status: 'playing', // playing | won | lost
      alarm: false,
      alarmTime: 0,
      banner: 'Steal the 3 ledger pages — then reach the EXIT unseen.',
      bannerClass: '',
      startedAt: null
    };
  }

  var state = newState();
  var keys = {};
  var maxSuspicion = 0;

  function fmtTime(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function showOverlay(title, text, keysHint) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlayKeys.textContent = keysHint;
    overlayEl.classList.add('show');
  }

  function hideOverlay() {
    overlayEl.classList.remove('show');
  }

  function raiseAlarm(guard) {
    if (!state.alarm) {
      state.alarm = true;
      state.alarmTime = 0;
      state.banner = 'SPOTTED! Break line of sight — hide in the dark nooks!';
      state.bannerClass = 'alarm';
      window.SC.audio.alarm();
    }
  }

  function onNoise(x, y) {
    for (var i = 0; i < state.guards.length; i++) {
      if (state.guards[i].hearNoise(x, y)) {
        state.banner = 'HEARD SOMETHING! — a guard is coming to look.';
        state.bannerClass = 'alarm';
        break;
      }
    }
  }

  function collectPage() {
    var page = state.player.onPageTile(state.pages);
    if (!page) return;
    page.taken = true;
    state.player.pages++;
    window.SC.audio.page();
    if (state.player.pages >= TOTAL_PAGES) {
      state.banner = 'ALL PAGES STOLEN — the rear door is OPEN. Run for the EXIT!';
      state.bannerClass = 'good';
    } else {
      state.banner = 'Page stolen (' + state.player.pages + ' / ' + TOTAL_PAGES + '). Stay out of the light.';
      state.bannerClass = '';
    }
  }

  function checkWinLose(dt) {
    if (state.player.pages >= TOTAL_PAGES && state.player.atExit()) {
      state.status = 'won';
      window.SC.audio.win();
      showOverlay('CLEAN GETAWAY',
        'All 3 ledger pages stolen in ' + fmtTime(state.time) +
        ' — you slipped out the rear door and the train never knew you were there.',
        'Press R to run it again, faster and quieter.');
      return;
    }
    for (var i = 0; i < state.guards.length; i++) {
      var g = state.guards[i];
      var dx = g.x - state.player.x;
      var dy = g.y - state.player.y;
      if (dx * dx + dy * dy < 24 * 24) {
        state.status = 'lost';
        window.SC.audio.lose();
        showOverlay('CAUGHT',
          'A guard laid a hand on your shoulder in the aisle. The ledger pages scatter — the heist is over.',
          'Press R to try again. Walk, crouch in the dark nooks, and never run past the Inspector.');
        return;
      }
    }
  }

  function updateHud() {
    pagesEl.textContent = 'Pages ' + state.player.pages + ' / ' + TOTAL_PAGES;
    timerEl.textContent = fmtTime(state.time);
    var worst = 0;
    for (var i = 0; i < state.guards.length; i++) {
      worst = Math.max(worst, state.guards[i].suspicion);
    }
    maxSuspicion = Math.max(maxSuspicion, worst);
    fillEl.style.width = Math.round(worst) + '%';
    if (worst >= 70) fillEl.classList.add('hot');
    else fillEl.classList.remove('hot');
    bannerEl.textContent = state.banner;
    bannerEl.className = state.bannerClass;
  }

  function tick(dt) {
    if (state.status !== 'playing') return;
    state.time += dt;
    state.player.update(dt, keys, onNoise, function (running) {
      window.SC.audio.step(running);
    });
    var saw = false;
    for (var i = 0; i < state.guards.length; i++) {
      var before = state.guards[i].suspicion;
      state.guards[i].update(dt, state.player, raiseAlarm);
      if (state.guards[i].suspicion > before && state.guards[i].suspicion > 35 && !saw) {
        saw = true;
      }
    }
    if (saw && !state.alarm) {
      state.banner = 'A lantern is turning your way…';
      state.bannerClass = '';
      if (maxSuspicion < 35) window.SC.audio.spotted();
    }
    if (state.alarm) {
      state.alarmTime += dt;
      var anyChase = false;
      for (var j = 0; j < state.guards.length; j++) {
        if (state.guards[j].state === 'chase') anyChase = true;
      }
      if (!anyChase && state.alarmTime > 6) {
        state.alarm = false;
        state.banner = 'You lost them. Breathe — then move.';
        state.bannerClass = '';
      }
    }
    collectPage();
    checkWinLose(dt);
    updateHud();
  }

  function frame(now) {
    if (state.status === 'playing') {
      var dt = Math.min(0.05, (now - frame.last) / 1000 || 0.016);
      frame.last = now;
      tick(dt);
    }
    window.SC.render.drawScene(ctx, state, state.time);
    requestAnimationFrame(frame);
  }
  frame.last = 0;

  function reset() {
    state = newState();
    keys = {};
    maxSuspicion = 0;
    hideOverlay();
    updateHud();
  }

  function keyName(e) {
    return (e.key || '').toLowerCase();
  }

  window.addEventListener('keydown', function (e) {
    var k = keyName(e);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].indexOf(k) >= 0) e.preventDefault();
    window.SC.audio.unlock();
    if (k === 'r') { reset(); return; }
    if (k === 'm') {
      var muted = window.SC.audio.toggleMute();
      state.banner = muted ? 'Sound muted.' : 'Sound on.';
      return;
    }
    if (k === 'c' && !e.repeat && state.status === 'playing') {
      var crouched = state.player.toggleCrouch();
      state.banner = crouched ? 'Crouched — harder to spot, silent steps.' : 'Standing up. Stay out of the cones.';
      return;
    }
    keys[k] = true;
  });

  window.addEventListener('keyup', function (e) {
    keys[keyName(e)] = false;
  });

  canvas.addEventListener('mousedown', function (e) {
    window.SC.audio.unlock();
    if (state.status !== 'playing') return;
    var rect = canvas.getBoundingClientRect();
    var x = (e.clientX - rect.left) * (canvas.width / rect.width);
    var y = (e.clientY - rect.top) * (canvas.height / rect.height);
    var col = Math.floor(x / L.TILE);
    var row = Math.floor(y / L.TILE);
    if (!L.isSolid(col, row)) {
      var p = L.centerOf(col, row);
      state.player.clickTarget = { x: p.x, y: p.y };
    }
  });

  // Screenshot staging: ?shot=1..4 renders one fixed frame, no loop.
  if (window.SC.shots.applyShot(state)) {
    updateHud();
    window.SC.render.drawScene(ctx, state, state.time);
    document.title = 'Sleeper Car — shot ' + window.SC.shots.shotFromUrl();
  } else {
    updateHud();
    requestAnimationFrame(frame);
  }
})();
