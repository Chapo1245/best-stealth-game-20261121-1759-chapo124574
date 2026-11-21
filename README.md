[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Chapo1245/best-stealth-game-20261121-1759-chapo124574/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Chapo1245/best-stealth-game-20261121-1759-chapo124574/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

# Sleeper Car — a quiet heist on the midnight train

A complete top-down stealth game that plays offline in a desktop browser from its own files. You are a thief aboard the midnight sleeper train: steal the 3 ledger pages hidden in the berths, then slip out the rear door unseen.

## How it plays

- **Move** WASD / arrows, or click a floor tile to walk there. **Shift** runs — fast, but loud. **C** crouches.
- **Guards with lantern vision cones** patrol the carriage: three Conductors sweep wide cones around the berths, and the Ticket Inspector walks the central aisle with a long, narrow cone — he hears running from far away and pauses to listen.
- **Cover:** dark luggage nooks and tall racks block a guard's line of sight. Crouch inside a nook and a sweeping cone passes right over you.
- **Light matters:** lamplight pools make you spotted faster; shadow slows the eye. A suspicion meter fills while you are seen and drains once you break line of sight. At full suspicion the guards chase; if one touches you, you are caught.
- **Noise:** running leaves expanding footstep rings. Guards inside earshot turn and come to investigate.
- **Win:** collect all 3 pages and reach the glowing green EXIT door at the rear. **Lose:** get caught.

## Files

- `game/index.html` — opens in desktop Chrome and plays, no network requests.
- `game/src/level.js` — the carriage layout, lamps, patrol routes.
- `game/src/guards.js` — patrols, vision cones, line of sight, hearing, suspicion.
- `game/src/player.js` — movement, running noise, crouching, collecting.
- `game/src/render.js` — canvas drawing: floor, lamplight, cones, cover, exit.
- `game/src/audio.js` — synthesized WebAudio cues (no audio files).
- `game/src/shots.js` — staged screenshot scenes (`?shot=1..4`).
- `game/src/main.js` — game loop, input, win/lose, HUD.
- `main.ts` — the entry program: copies `game/` and `screenshots/` to the output directory and writes `dossier.json` (Node 22, standard library only).
- `screenshots/` — 4 real renders of the game: the full carriage, hidden in cover, heard running, and the escape.

## Run it

```sh
# play in a browser
python3 -m http.server 8080 --directory game
# then open http://localhost:8080

# build the entry output
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Original game: its own idea, art, sounds and names. Built for the make.fun bounty "Make the best stealth game".

<sub>Entered on [make.fun](https://make.fun/?ref=wtacm6ft&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
