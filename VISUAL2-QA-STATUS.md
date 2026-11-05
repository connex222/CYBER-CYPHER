# Visual 2.0 — post-upload QA gate (5 November 2026)

- Original source provenance: supplied ZIP matched GitHub main at `299e6901bf958c09c60242dc3e7ff1f0c6425af3` at baseline.
- GitHub media upload: **VERIFIED** on `visual-2.0/approved-art-integration`:
  - `public/assets/visual2/lobby.webp` — 300,460 bytes
  - `public/assets/visual2/board.webp` — 92,752 bytes
  - `public/assets/visual2/results.webp` — 226,248 bytes
  - `public/assets/visual2/zero-day.webp` — 7,262 bytes
- GitHub branch comparison: **7 commits ahead**, **0 behind** `main`. Only new Visual 2.0 media, style, loader, manifests, QA and two HTML linker additions; no server, rule, audio or original asset files changed.
- Local npm test + build: **PASS** (22/22 automated tests, 0 failures, built in local review copy before upload).
- Local visual static checks: **PASS** (6/6).
- Original 24 agent files retained: **PASS** in local review copy.
- Native pixel dimensions and WebP decoding: **PASS** in local review copy.
- Live host + WebSocket smoke: **NOT RUN** — npm `ws` dependency unavailable in sandbox.
- Live browser viewport screenshots: **NOT RUN** — Chromium navigation denied by sandbox administrator (including local HTTP URL).
- TV + 2 phone, role secrecy, 5×5, reveal/replay and audio across rounds: **NOT RUN** — real end-to-end acceptance required.
- Merge: **NOT AUTHORISED**. Render deployment: **NOT AUTHORISED**.

All four production media files now exist on the development branch; the loader activates the Visual 2.0 skin only after they decode. Do not infer visually correct positioning or playable multiplayer from presence checks.

## Remaining sign-off tasks

Run actual screenshots at TV 1920×1080, desktop 1366×768, tablet 1024×768, phone 390×844 and narrow 320 px. Verify QR, lobby, 25 game cells and live words, operator secrecy, Zero Day reveal and text overlay, portraits/identity and crop, audio controls, cinematic results, tutorial navigation and full multiplayer. Investigate any failures on this branch; owner must explicitly approve any merge/deployment.
