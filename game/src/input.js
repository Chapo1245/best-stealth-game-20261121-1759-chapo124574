// Coin & Candlelight: input — keys to intent, nothing else.
// One file, one job: reading the keyboard. WASD or arrows to move, Shift
// to run loud, C to toss a coin, R to restart, M to mute. The toss flag is
// edge-triggered: the game loop consumes it once, so holding C throws one
// coin, not a purseful.
const KEYMAP = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'run',
  ShiftRight: 'run',
  KeyR: 'restart',
  KeyM: 'mute',
  KeyC: 'toss',
};

export function makeInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    run: false,
    restart: false,
    mute: false,
    toss: false,
  };
}

export function attachInput(input) {
  function onKeyDown(event) {
    const action = KEYMAP[event.code];
    if (action === undefined) return;
    event.preventDefault();
    if (action === 'toss') {
      input.toss = true;
      return;
    }
    input[action] = true;
  }
  function onKeyUp(event) {
    const action = KEYMAP[event.code];
    if (action === undefined || action === 'toss') return;
    input[action] = false;
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  return function detachInput() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  };
}
