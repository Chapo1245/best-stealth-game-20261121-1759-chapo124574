// Sleeper Car — staged screenshot scenes (?shot=1..4).
// Each scene sets the exact same game state every time and renders one
// fixed frame, so the screenshots are deterministic renders of this code.
(function () {
  'use strict';
  var L = window.SC.level;

  function placeGuard(guard, col, row, dirDeg) {
    var p = L.centerOf(col, row);
    guard.x = p.x;
    guard.y = p.y;
    guard.dir = dirDeg * Math.PI / 180;
    guard.state = 'patrol';
    guard.stateTime = 0;
    guard.pause = 99; // hold still for the shot
    guard.suspicion = 0;
    guard.mark = null;
    guard.markTime = 0;
  }

  function placePlayer(player, col, row, crouched) {
    var p = L.centerOf(col, row);
    player.x = p.x;
    player.y = p.y;
    player.crouched = !!crouched;
    player.running = false;
    player.moving = false;
    player.rings = [];
    player.clickTarget = null;
  }

  // Shot 1: the whole carriage at the start — cones, cover, exit, objective.
  function stageOverview(state) {
    placePlayer(state.player, 1, 1, false);
    placeGuard(state.guards[0], 4, 7, 0);
    placeGuard(state.guards[1], 20, 7, 180);
    placeGuard(state.guards[2], 11, 10, 270);
    placeGuard(state.guards[3], 12, 4, 0);
    state.banner = 'Steal the 3 ledger pages — then reach the EXIT unseen.';
    state.bannerClass = '';
    state.time = 1.2;
  }

  // Shot 2: crouched in a dark luggage nook while a conductor's cone
  // sweeps right past — the guard cannot see the hidden thief.
  function stageHidden(state) {
    placePlayer(state.player, 6, 1, true);
    state.player.pages = 1;
    state.pages[0].taken = true;
    var g = state.guards[0];
    placeGuard(g, 10, 4, 215);
    g.suspicion = 35;
    g.setMark('?', 99);
    placeGuard(state.guards[1], 20, 10, 270);
    placeGuard(state.guards[2], 16, 10, 0);
    placeGuard(state.guards[3], 19, 7, 180);
    state.banner = 'HIDDEN — crouched in cover, the lantern cone passes over you.';
    state.bannerClass = 'good';
    state.time = 2.4;
  }

  // Shot 3: running down the aisle — noise rings bloom and the Inspector
  // turns toward the sound, suspicion climbing.
  function stageNoise(state) {
    placePlayer(state.player, 12, 7, false);
    state.player.running = true;
    state.player.rings = [
      { x: state.player.x, y: state.player.y, r: 40, max: 200 },
      { x: state.player.x, y: state.player.y, r: 110, max: 200 }
    ];
    var insp = state.guards[3];
    placeGuard(insp, 17, 7, 180);
    insp.suspicion = 68;
    insp.state = 'investigate';
    insp.setMark('?', 99);
    placeGuard(state.guards[0], 4, 7, 0);
    placeGuard(state.guards[1], 20, 10, 270);
    placeGuard(state.guards[2], 11, 4, 90);
    state.banner = 'HEARD SOMETHING! — running is loud. Walk, or hide.';
    state.bannerClass = 'alarm';
    state.time = 3.6;
  }

  // Shot 4: all three pages stolen — the rear door glows green, escape open.
  function stageEscape(state) {
    state.player.pages = 3;
    for (var i = 0; i < state.pages.length; i++) state.pages[i].taken = true;
    placePlayer(state.player, 19, 13, false);
    placeGuard(state.guards[0], 3, 7, 0);
    placeGuard(state.guards[1], 14, 7, 0);
    placeGuard(state.guards[2], 11, 10, 270);
    placeGuard(state.guards[3], 8, 4, 90);
    state.banner = 'ALL PAGES STOLEN — the rear door is OPEN. Run for the EXIT!';
    state.bannerClass = 'good';
    state.time = 4.8;
  }

  var STAGES = { '1': stageOverview, '2': stageHidden, '3': stageNoise, '4': stageEscape };

  function shotFromUrl() {
    var m = /[?&]shot=([1-4])/.exec(window.location.search || '');
    return m ? m[1] : null;
  }

  function applyShot(state) {
    var n = shotFromUrl();
    if (!n || !STAGES[n]) return false;
    STAGES[n](state);
    return true;
  }

  window.SC.shots = { shotFromUrl: shotFromUrl, applyShot: applyShot };
})();
