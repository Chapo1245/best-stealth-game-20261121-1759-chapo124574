# Coin & Candlelight — The Gilded Vault

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Chapo1245/best-stealth-game-20261121-1759-chapo124574/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Chapo1245/best-stealth-game-20261121-1759-chapo124574/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

A complete original top-down stealth game, built for the [make.fun best stealth game bounty](https://make.fun/bounty/best-stealth-game-20261121-1759).

You are Wren, a thief in the Gilded Vault after closing time. Steal three relics — the Golden Mask, the Jade Idol, the Star Sapphire — then reach the EXIT unseen. Five guards work the galleries: three patrols walk fixed loops you can learn, two rovers pick random waypoints. Their vision cones are real: pedestals and display cases block sight, candlelight makes you easier to spot, darkness hides you. Walk silent, or run loud and leave noise rings every guard in earshot turns to investigate. And you carry three coins: toss one and its clink pulls the nearest guard away from whatever it was watching. Suspicion fills when a cone finds you and drains when you break away — a near miss is a warning, not a sentence.

## Play

Open `game/index.html` in desktop Chrome (or serve `game/` with any static server). No network, no build step.

- **WASD / arrows** — move (walk, silent)
- **Shift** — run (fast, loud: noise rings)
- **C** — toss a coin (3 per night: it clinks, guards investigate the sound)
- **R** — restart after being caught or escaping
- **M** — mute

## Files

- `main.ts` — the hand-in program (Node 22): copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `buildDossier`. Two runs write byte-identical output.
- `game/` — the playable game, plain static files: `index.html` plus `src/` split by job (`config`, `random`, `world`, `guards`, `noise`, `coins`, `player`, `input`, `render`, `shots`, `audio`, `main`).
- `screenshots/` — four real renders of the game's own code: the whole museum, a sneak behind a case with a tossed coin, an alarm by the Star Sapphire, and the escape.
- `vendor/makefun-game.ts` — the kit's dossier library, copied unchanged.

<sub>Entered on [make.fun](https://make.fun/?ref=wtacm6ft&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
