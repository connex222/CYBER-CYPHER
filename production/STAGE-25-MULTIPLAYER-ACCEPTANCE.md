# CYBER CYPHER — Stage 25 multiplayer acceptance

**Scope:** Isolated local testing of the Alpha RC1 multiplayer release, with **no live rooms created**.

## Automated acceptance
- New `tools/stage25-multiplayer.js` makes independent real WebSocket connections for **2, 3, 4, 6 and 10** participants.
- Asserts the actual starting mode (co-op for 2–3, versus for 4+), unique player identities, 25-node public board and private operator-only keys.
- Tests spectator permissions, late-join spectator restriction, runner disconnect/rejoin seat identity and TV disconnection/reconnection (4-player scenario).
- Mole mode is exercised in the 6- and 10-player setups.
- Existing `npm test` includes full bot-game runs for 2/3/4/6/10 and game-rule checks for ICE, Mole, timers, Zero Day and majority pings.
- Existing `tools/live-acceptance.js` covers operator clue, voting/pass, ICE turn advancement, secrets and reconnection.
- Existing Playwright browser suite checks tutorial playback and responsive TV/phone viewports.
- GitHub Actions executes these on a temporary local server with `BOTS=0 CC_SPEED=1` for Stage 25. It does not change the production server.

## Manual acceptance still necessary before *final* Alpha
- Conduct a real session with **one TV and 2+ separate phones**; verify QR scanning, lobby, operator clues, runner votes and match progression.
- Conduct group sessions with 4, 6, and if practical 10 people, confirming correct crew balancing and readable 5×5 screen.
- Disconnect and reconnect Wi-Fi during the lobby, during a clue and during voting; confirm seat recovery.
- Finish and rematch, then return to lobby and restart. Observe actual runtime behaviour and audio.
- Check phone portrait/landscape and TV readability, especially portrait crop and volume in long sessions.
- Confirm that active rooms **do not survive a Render restart**; in-memory continuity after server restart is not supported. Avoid production deploy during an active session.

## Release criteria
- The new multiplayer matrix, prior WebSocket integration, unit/bot-game tests, WebP/MP3 checks, and Playwright tests must pass on the exact PR commit.
- Manual physical-device, on-screen visual and narration sign-off **remains pending** until user-tested. A passing CI job must not be described as real-device acceptance.
- Stage 25 should remain a separate QA PR until automatic results are reviewed. Merge/deploy only when appropriate: the changes are tests and docs, not gameplay fixes.
