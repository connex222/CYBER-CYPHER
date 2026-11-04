# CYBER CYPHER — Alpha Final Sign-off Report

**Date:** 4 November 2026
**Candidate:** 1.0.0-alpha.1
**Branch/PR:** qa/stage25-multiplayer-acceptance / #23
**Decision:** **CONDITIONAL — NOT FINAL ALPHA SIGNED OFF**

## Verified automated evidence

| Gate | Result | Evidence |
|---|---|---|
| Game-rule/unit and build | PASS | Stage 25 GitHub Actions #41829659068 |
| Exact 5 × 5 = 25 board | PASS | Stage 24 invariant suite and Stage 25 25-card WebSocket assertions |
| 2, 3, 4, 6 and 10 independent WebSocket clients | PASS | 26 of 26 Stage 25 matrix assertions |
| Co-op, versus and Mole mode setup | PASS | Stage 25 matrix |
| Private operator keys / spectator permissions | PASS | Stage 25 matrix plus existing live-acceptance |
| Phone reconnect and TV reconnect | PASS (simulated clients) | Stage 25 matrix |
| HALO MP3 files and Chromium playback controls | PASS (automated) | Stage 25 workflow |
| Native avatar image integrity | PASS (automated) | Stage 25 workflow |
| Render Alpha RC1 deployment | LIVE | Render deploy dep-dbli4517lnhs739onotg, 4 Nov 2026 |

Successful automated workflow: https://github.com/connex222/CYBER-CYPHER/actions/runs/41829659068

## Required physical acceptance — NOT YET VERIFIED

| Gate | Status | What a human must confirm |
|---|---|---|
| 1920×1080 real TV and QR readability | PENDING | Picture fits safe margins; all controls/buttons legible; QR scan on real phone |
| Phone UI on Android/iPhone and tablet | PENDING | Avatar crop, room code, button touch size, portrait/landscape, voting |
| HALO narration, all 11 chapters | PENDING | Listen to complete chapters; pause/resume/replay; ducking; no overlap or first-word cutoff |
| Complete real game, not just synthetic clients | PENDING | Operator clues, vote majority, team wins, Zero Day, rematch |
| Real Wi-Fi/network disconnect | PENDING | Rejoin same seat and team, avoid duplicate players; TV recovers |
| 2–10 real people/player-device load | PENDING | At least 2 real phones + TV; larger player counts as available |
| Commercial sound/image licensing | PENDING | Verify provenance before any paid distribution |

## Sign-off procedure

1. Open https://cyber-cypher-j2ry.onrender.com on the TV. Scan its displayed QR with two physical phones.
2. Use the tutorial: hear chapter 1 all the way through, test pause/resume/replay, step through all 11.
3. Choose agents, join and start co-op; finish a full game, return to lobby and start another.
4. Repeat with four phones for versus and, where available, six for Mole; test a temporary phone Wi-Fi disconnection and TV reconnect.
5. Record PASS/FAIL for the pending items, actual device/browser and any defects. Do not declare final sign-off merely from automated GitHub checks.
6. Only after all required gates pass: promote Alpha RC1 to a final named Alpha release, document the accepted commit and deployed Render ID and create a release/tag if desired.

## Release and operations risks

- **Rooms are stored in process memory**: any Render restart/deployment loses active sessions. No resilient restart recovery is implemented.
- The service is on a free Render instance and may sleep while idle.
- CI is browser-automated; it cannot confirm actual speakers, TV overscan, handheld behaviour or real human playability.
- Do not merge a QA-only PR or redeploy during an ongoing game-night session.

**Final verdict: NOT YET SIGNED OFF.** The automated technical gate is passed; physical-device evidence is missing. This is a truthful release-blocking status, not an assessment that the game is broken.
