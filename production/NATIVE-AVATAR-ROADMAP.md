# CYBER CYPHER — native individual avatar replacement

> **4 November 2026 production update:** All three groups of eight have now been prepared locally. There are **24 individual 256×256 WebP output files** (448,072 bytes total) with no repeated file hashes or near-identical average-hash matches. User preview downloads include Batch 3 and a single ZIP containing all 24, a review sheet, and a one-click Windows Git staging script. **These binary artwork files are still NOT in GitHub**. This branch is documentation-only until someone stages the ZIP artwork; live avatar fallbacks remain unchanged. Batches 2–3 were cropped into separate files from ChatGPT-generated character sheets; do not falsely claim sixteen separate image generation source calls. Some names need visual identity sign-off. Creative Claw credits used: **0**.


**Current direction (4 November 2026): ChatGPT-native images only. Do not use Creative Claw for avatars.**

This specification **supersedes** the previous Creative Claw six-character atlas plan in `production/AVATAR-PRODUCTION.md`. The user's approved final direction is **24 individual, uniquely recognisable portraits**, produced and reviewed in **three batches of eight**.

## Current review status

| Batch | IDs | Characters | Current status |
|---|---|---|---|
| 1 | 00–07 | Static, Cipher, Neon, Glitch, Vector, Pixel, Nova, Rook | **Eight separate original full-resolution ChatGPT-generated portraits; user approved** |
| 2 | 08–15 | Echo, Flux, Kestrel, Onyx, Juno, Halcyon, Quark, Raven | **Eight separate 256×256 WebPs prepared from ChatGPT-generated character sheets; not yet independently approved** |
| 3 | 16–23 | Siren, Tango, Umbra, Volta, Wraith, Xeno, Yara, Zephyr | Not created |

**Important fidelity note:** Batch 2 consists of individual deliverable files, but they were cropped from two generated grids rather than individually generated as unique original source canvases. **Onyx, Halcyon and Quark do not yet fully match their character descriptions and should not be approved for production as-is.** No Creative Claw credits were used for Batch 1 or 2.

**Artifacts:** The Batch 2 eight individual PNG/WebP files and the first-16 WebP bundle are available as conversation downloads. These binary files are **not yet uploaded to this GitHub repository**. Do not mark the game art as fully deployed or claim otherwise.

## Identity and numbering lock

Preserve the authoritative `AVATAR_NAMES` ordering from `tools/shared.js` and client `public/tv.html` / `public/play.html`. Never reorder IDs or change player storage/rejoin keys.

`agent-00.webp` through `agent-23.webp` are all mandatory, each **256×256**, as one complete set. Filenames must be exact, and `public/assets/avatars/` should contain none of them until all 24 pass visual and technical QA.

The existing clients use `detectArt('/assets/avatars/agent-00.webp')` to enable every portrait slot. **Uploading only one or eight to the runtime assets would activate missing images**, so the switch happens once in a single complete production commit.

## Visual style lock

Premium photorealistic game-character render, London 2035 midnight cyber-noir, smoked titanium clothing, dark rain-glass background, convincing skin/hair materials, restrained cyan `#22E4FF` and amber `#FFB020` highlights, varied ages, shapes, hair and wardrobe. Faces must be recognisable at 48px on phones and on a 4K TV lobby; keep eyes unobstructed and shoulders visible. No typography, logos, HUD frames, signs or character names in the delivered portrait images.

Batch 2's interim portrait crops should be visually reviewed for cut-off hair, previous grid borders and baked-in nameplate fragments. Where a source portrait is inconsistent with the character bible, replace that individual artwork, not the full batch.

## Final integration checklist

- [ ] 24 unique character identities and all mappings approved.
- [ ] All 24 files available together, valid WebP 256×256, each under 60 KB.
- [ ] No near-identical faces and no inadvertently shared generated reference imagery.
- [ ] No remaining UI text or frame fragments baked into files.
- [ ] Preserve CSS/SVG fallback until the complete pack is installed.
- [ ] Install the complete group in a **single GitHub commit** and validate on phone and TV.
- [ ] Run `npm test`, `npm run build`, browser picker and remote WebSocket acceptance after integration.
- [ ] Do not merge the unrelated WebSocket security PR #13 during active multiplayer games.

Remaining costs for avatars using ChatGPT-native generation: **zero Creative Claw credits**.
