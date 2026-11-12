# CYBER CYPHER — Word-play clarity review (12 November 2026)

**Branch:** `improvement/cyber-cypher-play`, from the confirmed `main` baseline `7f028b21a8fcad9fc79cebb9bb08ef37e4ac6693`.

**Release authorisation:** On 12 November 2026 the project owner explicitly requested **merge, deploy and consolidate**. Continue to distinguish automated acceptance from physical-device sign-off.

## Verified starting point

- 25-word, 5×5 fixed grid; VOLT/FLARE versus, co-op versus ICE; optional Moles and existing best-of-three match model.
- Operator's private ownership key, Runners' majority pings, 1.6-second breach hold, and 1.4-second post-reveal hold remain server-authoritative.
- Clue numbers 0–9 or infinity, clue validity, Zero Day instant loss, timer options, scoring and word decks are untouched.
- Native Visual 2.0 images `public/assets/visual2/*`, all 24 avatar files and bindings, audio binaries and voice files were retained unchanged.
- An existing QR Back to Lobby action already preserves the TV room session; prior static regression covered its title/main-menu round trip.
- Existing voice-overlap regression covered entering the tutorial from the title, but not gameplay/room announcements while Training is on screen.

## Changes in this branch

1. **P0 audio arbitration:** HALO gameplay announcements are suppressed during Training; entering Training cancels queued title/game narration. Tutorial uses one HTMLAudioElement at a time and now has *Play, Pause, Stop, Replay and Mute* controls. Mute persists across training chapters. Stale HALO subtitles are cleared when stopping.
2. **P0 navigation:** Retain the real QR encoder and Back to Lobby route, with no second room creation. Test the round trip in a real Chromium browser. The legitimate TV host and phone host start actions remain; the server blocks multiple starts after a phase change.
3. **P1 legibility:** TV clue bar shows crew vote threshold, live vote counts and brief locking/ending states. Mobile word cells now identify positions and available ownership information for assistive technology, mark selected votes, and show crew votes out of the required majority. Operator keys are read-only.
4. **P1 role secrecy:** Clear stale handset Operator/Runner secrets when joining a different seat or starting another game. A new Operator receives only the key from the server, never the previous match key.
5. **P1 thematic risk and payoff:** Inline caution for the Operator and Runner explains Zero Day and off-team consequences, without hiding the grid. Phone result now explains *why* a team won or lost. Existing effects and approved narrations remain intact.

## Automated QA coverage

| Test | Purpose | Status |
|---|---|---|
| `npm test` | Rules, clue limits, privacy, navigation and audio checks | **PASS — 40/40, no failures** |
| `npm run build` | Static/client build | **PASS** |
| `node tools/live-acceptance.js` | Independent WebSocket clients, privacy and reconnect | **PASS — 17/17** |
| `node tools/stage25-multiplayer.js` | 2/3/4/6/10 players, spectators and reconnection | **PASS — 26/26** |
| `npm run smoke` | Entire six-player simulated versus game, secrecy and rematch | **PASS — finished with winner, rematch started** |
| `node tools/browser-acceptance.js` | HALO chapter, voice controls, QR, 25 cells, mobile and cropped-word tests | **PASS — all checks** |
| `qa/screenshots/review-*.png` | Real 1920px TV, 390px Operator and 320px Runner screenshots | **Captured as CI artifact** |

**Evidence:** [successful branch-head acceptance run #44 (commit d94c61d9)](https://github.com/connex222/CYBER-CYPHER/actions/runs/43219537335). Screenshot ZIP: [GitHub Actions artifact 13945576234](https://github.com/connex222/CYBER-CYPHER/actions/runs/43219537335/artifacts/13945576234). The historical browser/physical-device limits remain.

## Acceptance evidence to review

The Chromium browser acceptance script is configured to capture:

- `review-tv-qr.png` — active room QR, back navigation
- `review-tv-5x5.png` — live 25-word grid with a transmitted clue
- `review-phone-operator-390.png` — 390 px private Operator grid
- `review-phone-runner-320.png` — 320 px Runner controls, clue and public-only grid

**Still required for physical-device acceptance:** play HALO audio on a physical TV, manually check phone taps at 320/390 px, complete a full match with humans on at least two real handsets, confirm reconnects, and measure observed clue/guess and idle times. The owner has authorised deployment without waiting for this separate sign-off. Automated bot matches cannot replace real-room acceptance. One team wins or loses under the existing rules; ties only apply to the separate Mole identification vote.

## Social pacing targets (not measured results)

- From clue transmission to public clue display: immediate server update.
- Majority to lock: **1.6 seconds** (existing rule).
- Post-reveal hold: **1.4 seconds** (existing rule).
- Avoid additional animated delays before a new clue or next turn.
- During the real-room test, record time to produce each clue, deliberate each guess, and move to the next team. Only adjust actual delays once those measurements show a problem.

No game balance, art, avatar bindings, audio recordings, database or deployment configuration changed.
