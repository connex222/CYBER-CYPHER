# CYBER CYPHER — Live multiplayer acceptance status

**Recorded:** 3 November 2026  
**Repository:** [connex222/CYBER-CYPHER](https://github.com/connex222/CYBER-CYPHER)

## Automated integration — PASS

The new `tools/live-acceptance.js` test uses separate **real WebSocket connections** for one TV, two phones, and spectators against an isolated running Node.js server. The existing `tools/smoke.js` then executes an entire bot-driven match with Mole mode and rematch.

The new checks cover:
- `/healthz`, TV and phone HTML, local AAA WebP logo and fixed HALO narration MP3;
- four-letter TV room creation and room-code-to-phone redirect;
- two real phone joins with distinct seat IDs and reconnect tokens, correct host and co-op mode;
- spectator host restrictions, Operator-only secret key, hidden unrevealed card owners, and no spectators receiving secret data;
- rejection of unauthorised clue transmission and guessing;
- live clue, vote/pass, turn ending and ICE progression;
- late joiner becoming spectator;
- TV disconnect automatically pausing gameplay, and token rejoin resuming safely without exposing secret key;
- Operator phone reconnecting mid-game, retaining their seat and own key;
- existing full bot match, spectator-secret checks, Mole mode, invalid packet resilience and rematch.

**Evidence:** [Successful GitHub Actions main-branch run](https://github.com/connex222/CYBER-CYPHER/actions/runs/41739322360). Existing **11 game tests**, `npm run build`, new WebSocket acceptance, and full bot smoke all passed.

The new regression tests are part of the [merged PR #11](https://github.com/connex222/CYBER-CYPHER/pull/11). They do not alter the engine, network protocol, artwork, audio, avatars or protected scripts.

## Prior approved releases

- All 73 audio files passed automated checks. [AUDIO-QA.json](AUDIO-QA.json) reports `productionReady: true`, including 45 approved HALO Voice 1 recordings.
- All 16 approved non-avatar WebP assets are installed, with no avatars regenerated.
- Automated WebSocket acceptance is **not** evidence of human multiplayer acceptance on physical devices.

## Remaining before final user acceptance

- [ ] Confirm Render workspace, actual CYBER CYPHER service and deployed commit; check `/healthz` live and production WebSocket connection.
- [ ] Browser visual QA: TV 1920×1080 and smaller living-room screens, laptop, tablet landscape/portrait, Android/iOS phone layouts, no clipped text or QR.
- [ ] Play the entire 11-chapter tutorial with HALO, checking pause, previous, next, sound settings and voice continuity on physical TV.
- [ ] Human test: TV plus two phones; disconnect/rejoin both roles; try four- to ten-player versus and rematch; check role secrecy.
- [ ] Confirm any commercial media licences before selling or distributing the game.

**Deployment:** Repository `main` and GitHub acceptance tests passed. A Render deployment has **not** yet been verified. No claim of physical-device sign-off.
