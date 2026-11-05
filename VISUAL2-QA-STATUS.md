# Visual 2.0 — current QA gate (5 November 2026)

- Original source provenance: ZIP commit 299e690 matches current GitHub main commit at start.
- Local npm test + build: PASS (22/22 tests, 0 failures).
- Local asset path and preservation QA: PASS (6 checks).
- Asset dimensions and file decoding: PASS in local package.
- Original 24 avatar files unchanged: PASS.
- 5×5 grid CSS, rule source and audio files preserved: PASS by file hash + source inspection.
- Live host + WebSocket smoke: NOT RUN — npm `ws` dependency unavailable in sandbox; offline npm install failed.
- Browser screenshots (TV, desktop, tablet, phone): NOT RUN — browser navigation blocked by sandbox restrictions.
- Full human/multiplayer session: NOT RUN.
- Branch binary media upload: PENDING; local download kit includes all approved files.
- Merge: NOT AUTHORISED. Render deployment: NOT AUTHORISED.

Final pre-merge acceptance requires loading the branch with the binary assets, testing all target viewports, joining with TV and two phones, verifying secrecy and reveal states, replaying a match, rechecking audio across rounds, and reviewing actual screenshots.
