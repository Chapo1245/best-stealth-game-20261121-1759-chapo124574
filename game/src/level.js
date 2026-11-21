// Sleeper Car — level data: one midnight train carriage, seen from above.
// '#' wall, '.' floor, 'C' luggage rack (solid cover), 'c' dark luggage nook
// (walkable cover), 'P' ledger page, 'E' rear exit door, 'S' player start,
// 'G' conductor spawn, 'I' ticket-inspector spawn. Tile size 40px, 24 x 15.
(function () {
  'use strict';
  var TILE = 40;
  var COLS = 24;
  var ROWS = 15;
  var MAP = [
    '########################',
    '#S....cc....cc....cc...#',
    '#.CC......CC......CC...#',
    '#.CC..P...CC...P..CC...#',
    '#.....cc....cc....cc...#',
    '#.CC......CC......CC...#',
    '#..........cc..........#',
    '#..G...cc......cc...I..#',
    '#..........cc..........#',
    '#.CC......CC......CC...#',
    '#.....cc....cc....cc...#',
    '#.CC..P...CC......CC...#',
    '#.CC......CC......CC...#',
    '#.....cc....cc....cc..E#',
    '########################'
  ];

  function tileAt(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return '#';
    return MAP[row].charAt(col);
  }

  function isSolid(col, row) {
    var t = tileAt(col, row);
    return t === '#' || t === 'C';
  }

  function isCoverFloor(col, row) {
    return tileAt(col, row) === 'c';
  }

  function findAll(ch) {
    var out = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (MAP[r].charAt(c) === ch) out.push({ col: c, row: r });
      }
    }
    return out;
  }

  // Warm hanging lamps: pools of light where the eye is drawn — and where
  // a thief is spotted fastest. Between lamps the carriage is shadow.
  var LAMPS = [
    { col: 6, row: 2 }, { col: 18, row: 2 },
    { col: 12, row: 7 },
    { col: 6, row: 12 }, { col: 18, row: 12 }
  ];
  var LAMP_RADIUS = 110;

  function lightAt(px, py) {
    for (var i = 0; i < LAMPS.length; i++) {
      var lx = (LAMPS[i].col + 0.5) * TILE;
      var ly = (LAMPS[i].row + 0.5) * TILE;
      var dx = px - lx;
      var dy = py - ly;
      if (dx * dx + dy * dy < LAMP_RADIUS * LAMP_RADIUS) return true;
    }
    return false;
  }

  // Guard patrol routes (tile centres). Two conductor loops sweep the
  // berths; the inspector walks the whole central aisle and pauses to listen.
  var PATROLS = {
    conductorA: [
      { col: 3, row: 7 }, { col: 10, row: 7 },
      { col: 10, row: 1 }, { col: 3, row: 1 }
    ],
    conductorB: [
      { col: 20, row: 7 }, { col: 14, row: 7 },
      { col: 14, row: 13 }, { col: 19, row: 13 }
    ],
    conductorC: [
      { col: 11, row: 10 }, { col: 11, row: 4 },
      { col: 16, row: 4 }, { col: 16, row: 10 }
    ],
    inspector: [
      { col: 5, row: 7 }, { col: 21, row: 7 }
    ]
  };

  var start = findAll('S')[0];
  var exitTile = findAll('E')[0];
  var pages = findAll('P');

  window.SC = window.SC || {};
  window.SC.level = {
    TILE: TILE, COLS: COLS, ROWS: ROWS, MAP: MAP,
    tileAt: tileAt, isSolid: isSolid, isCoverFloor: isCoverFloor,
    findAll: findAll, LAMPS: LAMPS, LAMP_RADIUS: LAMP_RADIUS, lightAt: lightAt,
    PATROLS: PATROLS,
    start: start, exitTile: exitTile, pages: pages,
    centerOf: function (col, row) {
      return { x: (col + 0.5) * TILE, y: (row + 0.5) * TILE };
    }
  };
})();
