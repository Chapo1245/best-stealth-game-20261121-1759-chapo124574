// Coin & Candlelight: every number the museum runs on, in one place.
// One file, one job: tuning. No other file hard-codes a speed, a range or
// a colour, so balancing the game means editing here and nowhere else.
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 800;
export const HUD_HEIGHT = 64;

export const GALLERY_WIDTH = 406;
export const GALLERY_GAP = 20;
export const MUSEUM_LEFT = 10;
export const MUSEUM_TOP = HUD_HEIGHT;
export const MUSEUM_BOTTOM = CANVAS_HEIGHT;
export const DOOR_HEIGHT = 96;

export const COLORS = {
  floorDark: '#16211b',
  floorLight: '#1d2c24',
  wall: '#3d3a30',
  wallTop: '#57523f',
  cover: '#2a3348',
  coverTop: '#c9a227',
  candleGlow: 'rgba(255, 176, 84, 0.28)',
  candleCore: '#ffcf7d',
  loot: '#ffd76a',
  coin: '#f2c94c',
  exit: '#39d353',
  exitDark: '#0e3d1a',
  player: '#e8f1ff',
  playerRing: '#9ecbff',
  patrolCone: 'rgba(255, 214, 64, 0.40)',
  patrolConeEdge: '#ffd640',
  roverCone: 'rgba(255, 140, 66, 0.40)',
  roverConeEdge: '#ff8c42',
  alertCone: 'rgba(255, 59, 59, 0.48)',
  alertConeEdge: '#ff3b3b',
  banner: '#39d353',
  bannerBad: '#ff5a5a',
  hudText: '#e8e4d8',
  hudMuted: '#9a958a',
};

export const PLAYER_RADIUS = 11;
export const PLAYER_WALK_SPEED = 132;
export const PLAYER_RUN_SPEED = 212;
export const PLAYER_NOISE_RADIUS = 230;
export const PLAYER_NOISE_INTERVAL = 0.35;

export const COIN_COUNT = 3;
export const COIN_TOSS_DISTANCE = 150;
export const COIN_FLIGHT_TIME = 0.35;
export const COIN_RADIUS = 5;

export const GUARD_RADIUS = 13;
export const PATROL_SPEED = 56;
export const ROVER_SPEED = 72;
export const CHASE_SPEED = 112;
export const INVESTIGATE_SPEED = 84;
export const CONE_HALF_ANGLE = 0.56; // radians (~32 degrees)
export const CONE_RANGE_DARK = 168;
export const CONE_RANGE_LIT = 212;
export const CATCH_DISTANCE = 16;

export const SUSPICION_FILL_BASE = 0.85;
export const SUSPICION_FILL_CLOSE = 1.7;
export const SUSPICION_CLOSE_DIST = 62;
export const SUSPICION_DRAIN = 0.28;
export const SUSPICION_ALARM_DRAIN = 0.5;
export const SUSPICION_ALARM_LOSE_TIME = 2.5;
export const SUSPICIOUS_THRESHOLD = 0.55;

export const GAME_SEED = 20261122;
