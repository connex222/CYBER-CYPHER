# CLAUDE.md - Cyber Cypher

Instructions for AI assistants working in this repository.

## What this is

Cyber Cypher is a 2035 cyberpunk team word-spy party game for a TV and phones, 2 to 10 players. Two crews race to find their words on a 5 x 5 grid; each crew's Operator gives one word and a number. Hitting the Zero Day loses. There are Family and Adult word decks.

- Live game: https://cyber-cypher-j2ry.onrender.com (health check `/healthz`)
- Signed-off version: `1.0.0-alpha` - see `production/ALPHA-FINAL-SIGNOFF.md` before changing anything
- Rules, modes, screens and tutorial script: `GAME-DESIGN.md`
- Art and audio filenames: `ASSET-MANIFEST.md`

## Architecture

| Part | Location |
|---|---|
| Server (Node 20+, `ws`) | `server.js` |
| Game rules and state | `src/game.js` |
| Timers, board makeup, limits | `src/config.js` |
| Word decks | `src/words.json` |
| TV and phone pages | `public/tv.html`, `public/play.html` |
| Shared network code, icons, avatars | `tools/shared.js` (then run the build) |
| Production records and asset scripts | `production/` |

## Commands

```
npm ci --ignore-scripts
npm test
npm run build
npm start
```

Solo testing with bots (PowerShell): `$env:BOTS=1; npm start`, then press ADD BOT in the lobby. Leave bots off for real game nights.

## Project rules

- The Alpha is signed off. Treat changes as post-release: keep them small, run `npm test` and `npm run build`, and record them in `CHANGELOG.md`.
- The tests check that no secret reaches the TV or spectators. Never weaken or skip those tests.
- HALO is the narrator; its 11 recorded tutorial chapters must stay in sync with `GAME-DESIGN.md`.
- Fonts (Orbitron, Atkinson Hyperlegible) are embedded under the SIL Open Font License.
## Working with Shaun (the owner)

- Shaun is not a programmer. Explain every step in plain English, in order, and assume no prior knowledge.
- Give complete, ready-to-use files, never partial snippets or "..." placeholders.
- Use UK English in all player-facing text.
- Before changing anything, read this file, `README.md` and the design document named below.
- Never delete files to "tidy up". Move old notes into `docs/` instead, and say what you moved.
- Never force-push, rewrite history, or rename the repository.

## Hosting rules (Render)

- The game runs on Render's free plan in Frankfurt and auto-deploys from `main`.
- Game rooms live in server memory. **Any push to `main` restarts the server and ends every live game.** Never push during a game night, and warn Shaun before any change that will deploy.
- The free plan sleeps when idle; the first visit can take up to a minute to wake.
- The server must listen on `process.env.PORT`.

## Party-game conventions

- The TV is the shared screen; phones are private controllers. Secret information must never be sent to the TV or to spectators.
- Text on the TV must be readable from a sofa; phone controls must work one-handed in portrait.
- Art and sound are made by Shaun with ChatGPT. Keep the exact filenames listed in the asset manifest so new files drop in without code changes, and keep a working code-drawn fallback for anything missing.
