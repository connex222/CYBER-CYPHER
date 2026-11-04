# CYBER CYPHER — 24 native avatar release

**Updated: 4 November 2026 — all 24 production portrait files committed on staging branch.**

## Production status

The 24 individually numbered, local 256 × 256 WebP files are now uploaded to `public/assets/avatars/` in one atomic GitHub commit, `b7cac821f28dad090ec7483b4de0d509338e08a5`. They total **448,072 bytes**.

The image binary data was compared byte-for-byte to the generated WebPs using Git blob SHA-1. GitHub Actions [run #41806921309](https://github.com/connex222/CYBER-CYPHER/actions/runs/41806921309) passed:
- all 24 contiguous avatar filenames, file sizes, valid WebP encoding, 256 × 256 dimensions and exact name mapping;
- zero binary/perceptual duplicates according to the automated image check;
- original `npm test` suite and `npm run build`;
- real WebSocket multiplayer acceptance and 24 live local HTTP routes serving exact image bytes.

The game client checks whether `agent-00.webp` exists before displaying portraits. **All 24 are committed together**; no partial upload activates broken avatar slots.

## Authoritative order (do not change)

| Batch | IDs | Names | Production state |
|---|---|---|---|
| 1 | 00–07 | Static, Cipher, Neon, Glitch, Vector, Pixel, Nova, Rook | Eight individually generated ChatGPT portraits, accepted by user |
| 2 | 08–15 | Echo, Flux, Kestrel, Onyx, Juno, Halcyon, Quark, Raven | Eight individually deliverable WebP crops from ChatGPT-created sheets, technically validated |
| 3 | 16–23 | Siren, Tango, Umbra, Volta, Wraith, Xeno, Yara, Zephyr | Eight individually deliverable WebP crops from ChatGPT-created sheets, technically validated |

**Creation method:** Creative Claw was **not** used for avatars. Batches 2 and 3 were cropped from generated contact sheets into 16 separate portrait files; they were not 16 individually generated source images. All runtime portraits are distinct files.

## Art direction

London 2035 premium cyber-noir with believable adult faces and distinct ages, skin, hair and fashion. Dark rain-glass and black titanium, restrained cyan `#22E4FF` and amber `#FFB020` rim lighting. Portraits must stay readable as 48px phone avatars and larger lobby portraits. Maintain the existing numeric ID mapping and stored player selections.

## Remaining visual sign-off

Automated validation is not a human review. The final review contact sheet shows that the appearance of a few Batch 2 portraits — particularly Onyx, Halcyon and Quark — differs from the original character-description brief. These are **visual editorial issues, not broken files**. Correct individual portraits where necessary, preserving the ID and filename.

Run direct browser checks on phone, tablet, desktop and TV for image sizing, borders, colour matching, popup/picker positions, avatar cropping and tap targets. Any future binary replacement should include the entire affected set in the tested branch and retain a working fallback.

**Credits:** Zero Creative Claw avatar generation credits. The unrelated `security/ws-8-22-1` PR must still be deployed separately during a quiet game window.
