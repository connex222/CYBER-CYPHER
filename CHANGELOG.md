# CYBER CYPHER — CHANGELOG

## 12 November 2026 — Expansion packs

- New `packs/` folder: each `.json` file is a word pack that appears in the host's lobby under **Expansion packs**. See `packs/README.md`.
- New `src/packs.js` reads and checks packs at start-up. A broken pack is skipped with a `[cc] pack warning`; it cannot stop the server.
- Host settings gain `packs` (which packs are on) and `packsOnly` (mixed into the deck, or pack words only). Family packs work with both decks; adult packs only with the Adult deck.
- First pack: Christmas Chaos (122 family words, free).
- Phone lobby: new Expansion packs section. TV lobby: new chip showing the active pack.
- The main Family and Adult decks, game rules, secrecy rules and message protocol are unchanged. 9 new tests in `test/packs.test.js`.
- **Not yet deployed.** Pushing to `main` restarts the server and ends live games.

---
## 12 November 2026 — Game clarity, HALO and navigation consolidation

- Preserved the 25-cell 5×5 board, all team/word rules, Visual 2.0 assets, 24 avatar bindings, and 73 audio assets.
- HALO: single tutorial voice at a time; start, pause, stop, replay and mute controls; no game narration during tutorial; cleaned stale subtitles.
- QR/join: Back to Lobby keeps the session and lets the host return to the same four-letter room.
- TV/phone: scan/majority thresholds, accessible word cells, private Operator key protection, long-word fitting, small-screen heading readability, and clearer risk and winning explanations.
- Removed board-obscuring turn banner and whole-board Zero Day glitch in favour of brief, restrained, local effects.
- New QA covers 40 unit tests, build, 17 independent WebSocket checks, 26 multiplayer matrices, actual Chromium TV/phone screenshots and complete simulated team match/rematch.
- Latest verified branch QA: [Actions run #44](https://github.com/connex222/CYBER-CYPHER/actions/runs/43219537335), all checks passed. Real-device acceptance for this update remains separate.
- Owner explicitly authorised merge and deployment on 12 November 2026.

---

# Historical audio production notes

## 2026-11-03 — Premium audio production staging

- Approved and saved HALO Voice 1 in Creative Claw, replacing the prior Old Silas designed voice slot.
- Generated 45/45 narration lines with exact `ASSET-MANIFEST.md` wording.
- Generated 21/21 original Creative Claw interface and gameplay sound effects.
- Generated new title, sparse-game-bed alternative, victory and defeat music candidates in Creative Claw.
- Created and locally tested a 100 BPM A-minor lobby track and three genuinely additive 112 BPM A-minor gameplay stems with exactly 6,048,000 decoded samples each.
- Added an optional one-click Windows audio downloader/mastering utility with `AUDIO-SOURCES.json` and a separate QA report.
- Kept game engine, `src/`, existing `tools/shared.js`, build, QR and smoke tools, test suite and message protocol unchanged.
- **Not yet completed:** cloud media must be downloaded and mastered, music loop/voice/effect QA, 40-image production, and Fire Stick and real-device visual acceptance.
