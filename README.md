# sizzle-serve-kitchen

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Naivexyz/sizzle-serve-kitchen/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Naivexyz/sizzle-serve-kitchen/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Sizzle & Serve — Rush Hour Kitchen.** A complete cooking game for the desktop browser: read the tickets on the order board, stack each dish on your plate from the ingredient counter, work the grill (patties, chicken, bacon and eggs burn if you leave them), and serve before your customers run out of patience. Tips for fast service, bonuses for perfect stacks and serving streaks, fines for walk-outs — all inside a 120-second shift that ends with a receipt and a star rating.

## Run it

```sh
node serve.ts            # then open http://localhost:8080
```

Or open `game/index.html` in any desktop browser — the game is plain static files and runs fully offline. Play with the mouse, or the keyboard: `1`–`0` pick ingredient bins, `Q`/`W`/`E` work the grill pans, `Space` serves, `Backspace` trashes the plate, `P` pauses, `M` mutes.

To hand the entry in the way the grader does:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `game/` — the game itself: `index.html` plus ES modules under `src/` (config, random, world, render, input, audio, shots, main), one job each.
- `screenshots/` — captures of the game running, taken from its scripted scenes (`game/src/shots.js`, driven by `shots.json`).
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored library.
- `vendor/makefun-game.ts` — make.fun's dossier library, shipped unchanged.

---

<sub>Entered on [make.fun](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
