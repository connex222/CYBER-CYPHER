# CYBER CYPHER — Visual 2.0 review branch

Started from Alpha main `299e6901bf958c09c60242dc3e7ff1f0c6425af3` on 5 November 2026.

Approved samples: #1 lobby, #2 5×5 game environment, #3 original avatar presentation (CSS frame only), #4 Zero Day and #5 results. This is a **cosmetics-only, pre-merge review branch**.

The new CSS and gated loader link to four separately delivered files:
- `public/assets/visual2/lobby.webp` (1920×1080 native-centred composite from approved 1672×941 art)
- `public/assets/visual2/board.webp` (1920×1080)
- `public/assets/visual2/results.webp` (1920×1080 native-centred composite from approved 1672×941 art)
- `public/assets/visual2/zero-day.webp` (474×300)

**IMPORTANT: the approved binary WebP files are NOT YET ON THIS GITHUB BRANCH.** The local downloadable production package contains them and an optional Windows BAT to upload these to this branch only. The loader deliberately leaves all original Alpha imagery intact until the four binaries are present. Do NOT merge or deploy in this intermediate state.

No original avatars, card art, narration, audio files, rules, server logic or 5×5 geometry are changed. Full live browser and multiplayer acceptance remain required after all binaries are uploaded.
