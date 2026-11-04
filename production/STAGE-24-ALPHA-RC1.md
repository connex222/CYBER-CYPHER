# CYBER CYPHER — Stage 24 Alpha RC1

**Release candidate:** `1.0.0-alpha.1`
**Prepared:** 4 November 2026
**Status:** Alpha release candidate, *not* final production acceptance.

## Included in this candidate
- Original 2035 cyber-noir title, TV lobby and phone-controller interfaces.
- Fixed **5 × 5 = 25** node grid, with 9/8/7/1 distribution.
- Co-op against ICE (2–3 players), versus crews (4–10 players), optional Mole mode.
- 24 native 256px WebP player portraits.
- HALO's 11 prerecorded tutorial chapters with Play, Pause, Resume, Replay, Back, Next, automatic advancement and return controls.
- Title/lobby/game audio, recorded HALO prompts, original card graphics.
- Four-letter room and QR phone join, host controls, spectator security, reconnect and rematch.

## Technical release gates
`npm ci --ignore-scripts`
`npm test` — game rules and explicit Alpha board invariants
`npm run build`
`python -m pip install Pillow mutagen`
`python production/verify_native_avatars.py`
`python production/verify_halo_audio.py`
`CC_ACCEPTANCE_HTTP=http://127.0.0.1:3123 node tools/live-acceptance.js` against isolated local `PORT=3123 BOTS=1 CC_SPEED=10 node server.js`.
`CC_ACCEPTANCE_HTTP=http://127.0.0.1:3123 node tools/browser-acceptance.js` using Chromium/Playwright on an isolated local server.

The CI workflow runs these tests, including full Playwright provisioning, on a matching PR or workflow change. Do not report a pass unless the current commit's run actually passed.

## Manual sign-off before calling this a finished Alpha
- TV at 1920×1080 and 1366×768: inspect real screenshot, 5×5 board, QR, safe margins, crew panels, tutorial navigation and sound.
- Phones at 360×800, 390×844 and landscape; tablets 768×1024 and 1024×768: inspect interactive controller layout and avatar cropping.
- Listen through all 11 HALO recordings on real hardware; verify no premature cutoff, overlapping speech or lost audio after repeated pause/resume.
- Test 2, 3, 4, 6 and 10 players in realistic sessions; reconnect TV and players during lobby and play; repeat matches.
- Inspect Onyx (11), Halcyon (13), Quark (14) and all other portraits in game, not only as image files.
- Confirm licensing and permission for all media before selling or redistributing.

**These manual gates are pending until an actual device/session test is recorded.** Prior automatic GitHub CI results do not substitute for them.

## Deployment and rollback
- Render service: https://cyber-cypher-j2ry.onrender.com
- Default deploy branch: `main`; health check `/healthz`; start command `node server.js`.
- Deployment occurs automatically after a `main` merge. Do not manually trigger a second deploy.
- Deploy when no active game is in progress. A restart destroys in-memory rooms; reconnect cannot restore rooms after a server restart.
- If production regression occurs, use Render's previous known-good deploy or revert the merge in GitHub and allow automatic redeploy.
- A GitHub PR and a deployed build are not a GitHub Release/tag. Do not describe this candidate as a tagged release until a tag exists.

## Scope deliberately unchanged
No rules redesign, board resizing, avatar replacement, paid audio generation, account system, payment service or persistence architecture.
