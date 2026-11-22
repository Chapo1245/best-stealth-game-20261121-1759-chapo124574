// Emberlight: keyboard input, nothing else.
// One file, one job: which keys are down. WASD and arrows move, Shift runs
// (loud), R restarts after being caught or escaping, M mutes the hum.
const KEYMAP = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ShiftLeft: 'run',
  ShiftRight: 'run',
  KeyR: 'restart',
  KeyM: 'mute',
};

export function makeInput() {
  return { left: false, right: false, up: false, down: false, run: false, restart: false, mute: false };
}

export function attachInput(input) {
  const down = (event) => {
    const name = KEYMAP[event.code];
    if (name === undefined) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) event.preventDefault();
    input[name] = true;
  };
  const up = (event) => {
    const name = KEYMAP[event.code];
    if (name === undefined) return;
    input[name] = false;
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
  };
}
