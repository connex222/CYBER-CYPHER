# ChatGPT + Creative Claw prompt — Cyber Cypher art, audio and AAA polish

**How to use:** attach `cyber-cypher.zip` to a new ChatGPT chat with the Creative Claw plugin switched on, then paste everything inside the box below as your first message.

```text
You are the art director, audio director and senior front-end engineer finishing "CYBER CYPHER", a 2035 cyberpunk team word-spy party game for a TV plus phones (2–10 players). The attached zip is a complete, working, tested game with PLACEHOLDER art and sound. Your job is to replace the placeholders with premium generated assets (Creative Claw) and raise the presentation to AAA party-game quality, without changing how the game plays.

Read these files first, in this order:
  GAME-DESIGN.md      — rules, modes, screens, the HALO narrator, the tutorial script
  ASSET-MANIFEST.md   — EVERY asset slot: exact path, size, format, loudness, brief, and the 45 HALO voice lines
  README.md           — how to run, test and build
  public/tv.html, public/play.html, tools/shared.js — the front end

=====================================================================
PART 0 — RULES FOR THE WHOLE JOB (read twice)
=====================================================================
0.1 DO NOT CHANGE: server.js, anything in src/ (including words.json), test/, tools/smoke.js, tools/qr.js, tools/build.js. Do not change the message protocol, phase names, field names, rules or timings.
0.2 The TV must never show anything from a "secret" message (the Operator's key, the Mole's identity). Never add owner colours to unrevealed cards on the TV.
0.3 Asset names and paths are fixed by ASSET-MANIFEST.md. The code already loads them; most of the time you only need to drop files in. Every asset must keep working when its file is missing (placeholders stay as fallbacks; do not delete them).
0.4 Formats: images WebP only (no PNG/JPG in public/). Audio MP3 only. Per-file size limits: backgrounds ≤ 300 KB, cards ≤ 60 KB, emblems/logo ≤ 120 KB, avatars ≤ 25 KB, phone background ≤ 250 KB. Total public/assets ≤ 3 MB; total public/audio ≤ 20 MB.
0.5 NO TEXT IN ANY IMAGE: no letters, numbers, signs, logos, brand names, monograms, UI labels, or fake writing. The game prints every word itself. This includes the card art and backgrounds. The logo is the only exception, and it must read exactly "CYBER CYPHER".
0.6 No real people's likenesses, no copyrighted characters, no real company names or logos. Original designs only.
0.7 Before any Creative Claw generation that costs credits, tell me what you will generate, how many items, and the estimated credits. Wait for "go". Generate ONE sample of each asset type first and wait for my approval before batch-generating.
0.8 CSS DISCIPLINE: edit the existing rules IN PLACE. Do not append "Stage N" override blocks. Do not add !important (except inside the existing reduced-motion and high-contrast rules). One organised stylesheet per file.
0.9 After editing tools/shared.js run `npm run build`. Write complete files, with no placeholders, no "TODO" and no "rest unchanged". If a file is too long for one reply, split it into numbered parts and wait for "continue".
0.10 Explain every command as if I have never used a terminal (I use Windows PowerShell).

=====================================================================
PART 1 — ART DIRECTION (approve before generating)
=====================================================================
World: London, 2035. Neon-lit, rain-slick, high-tech but human. Rival hacker crews: VOLT (electric cyan #22E4FF, hexagon motif, cool, precise) and FLARE (solar amber #FFB020, triangle motif, warm, bold). The AI host HALO (soft white/cyan halo ring motif). The rogue firewall ICE (violet #B48CFF, crystalline diamond motif). Danger: ZERO DAY (alarm red #FF2E5B).

Style: premium cinematic cyberpunk, like a polished Netflix title sequence. Deep near-black navy base (#05070D), glassy panels, crisp neon edge light, subtle volumetric haze, fine circuit and grid textures. Clean, not cluttered; high contrast; readable from 3 metres. Avoid grime, gore, weapons and anything that would make it 12+.

Give me first (no generation yet):
  a) A one-page style guide: palette (with hex), lighting, texture rules, line weights, the VOLT/FLARE/ICE/ZERO DAY motifs, typography pairing (keep Orbitron for display and Atkinson Hyperlegible for words; both are already embedded).
  b) A shot list of every image in ASSET-MANIFEST.md with a one-line prompt for each.
  c) The credit estimate for Parts 2–4.
Wait for "approved".

=====================================================================
PART 2 — IMAGES (Creative Claw image generation)
=====================================================================
Generate exactly the files in ASSET-MANIFEST.md, at the listed sizes, then convert to WebP and save at the listed paths.

2.1 Logo — public/assets/ui/logo.webp (1600×520, transparent). "CYBER CYPHER" as a neon-and-glass wordmark: cyan main glow, a thin amber accent, a subtle digital glitch split. Must read clearly. If text generation is unreliable, design the logo as vector SVG yourself and export to WebP instead.

2.2 Emblems — emblem-volt / emblem-flare / emblem-ice (512×512, transparent). Bold, simple, icon-like crests built on their motif (hexagon / triangle / diamond). Must read at 64 px. No letters.

2.3 HALO portrait — public/assets/ui/halo.webp (512×512, transparent, designed for a circle crop). An abstract AI presence: a luminous ring with a soft face-like glow inside. Not a human face, not a real person.

2.4 Backgrounds (1920×1080, no text):
   - bg/title.webp — night London skyline in 2035 seen from a rooftop, rain, holographic adverts as abstract light shapes only. Keep the centre band darker: the logo and menu sit there.
   - bg/lobby.webp — a hacker safehouse with two glowing workstation zones, cyan on the left and amber on the right. Keep the middle 70% calm (panels sit on top).
   - bg/grid.webp — abstract cyberspace: a deep perspective data grid with faint particles. Very low contrast behind the central 1200×780 area (cards sit there); richer at the edges.
   - bg/result.webp — the moment after a breach: a light burst through glass and data shards. Calm centre.
   - bg/phone.webp (1080×2400) — vertical rainy neon street, very dark (it sits behind the phone UI in Night theme). Contrast must stay low.

2.5 Card art (474×300, no text, the game prints the word in the centre):
   - cards/node.webp — face-down card: dark smoked glass with fine circuit traces at the edges, empty dark centre.
   - cards/volt.webp, flare.webp — revealed crew cards: rich team colour, the motif as a large faint watermark, energy edge.
   - cards/noise.webp — grey static / analogue noise, a little comic.
   - cards/zero.webp — red alarm: cracked glass, warning glow.
   - cards/ice.webp — violet crystalline frost.
   The centre 60% of every card must stay dark and even enough that white bold text keeps 7:1 contrast. Test by placing white Atkinson Bold text on it.

2.6 Avatars — avatars/agent-00.webp … agent-23.webp (256×256). 24 original operatives, head and shoulders, three-quarter view, one consistent painted cyberpunk style and framing, dark backdrop with a rim light. Each must be instantly distinguishable at 44 px (a strong silhouette plus a distinctive visor, hair, mask or headwear). A genuinely diverse cast: a balanced mix of genders, ages (20s to 60s), and skin tones from very light to very dark, chosen respectfully; at least one character with visible glasses or a hearing aid, one with a prosthetic, and one older operative. Match each to its name in AVATAR_NAMES (tools/shared.js), for example Static, Cipher, Neon, Glitch… Family-friendly: no revealing outfits, no weapons. No text. Show me a contact sheet of all 24 at 44 px and 128 px for approval.

2.7 Image QA: report each file's dimensions and file size, and confirm no text appears in any image except the logo.

=====================================================================
PART 3 — AUDIO (Creative Claw voice, music and sound)
=====================================================================
3.1 HALO voice. Design an original voice: a woman with a British accent, calm, precise, dry and a little smug, with a faint digital sheen that is never robotic. Save it as a reusable voice. Generate vo_title first and play it to me. After approval, generate all 45 lines in ASSET-MANIFEST.md with EXACT wording, named exactly as listed. Variation files (_1, _2…) must differ in delivery. Mono MP3, 44.1 kHz, 160 kbps, two-pass loudness normalised to −16 LUFS, true peak ≤ −1.5 dB, 50 ms silence at each end. Report a table of loudness and peak for every file.

3.2 Music (stereo MP3, 192 kbps, −20 LUFS, true peak ≤ −1.5 dB), all original:
   - mus_title: dark synthwave theme, 100 BPM, A minor, exactly 64 bars (153.6 s), a memorable 4-bar hook, loops with no intro or ending.
   - mus_lobby: lighter version of the same theme, 100 BPM, A minor, exactly 32 bars (76.8 s), loops.
   - mus_game_1 / _2 / _3: ONE piece delivered as three ADDITIVE stems (layer 2 sits on top of 1, layer 3 on top of 1 + 2), 112 BPM, A minor, exactly 64 bars (137.143 s), identical sample counts (report all three to 3 decimal places), loopable. Layer 1 alone −20 LUFS; all three together ≤ −16 LUFS.
   - mus_win (5–7 s, triumphant, ends in A major) and mus_lose (4–6 s, cold descending shutdown).
   Loop check for every looping file: the RMS of the last 0.5 s and the first 0.5 s must be within 2 dB of each other, and there must be no fade-out at the end. If the generator adds an ending, generate 2 bars longer, cut at the exact bar line, and crossfade the extra bars into the start (equal-power), applying the identical edit to all three game stems.
   Prove the tracks are different files: list the MD5 of all 7.

3.3 Sound effects: all 21 in ASSET-MANIFEST.md, mono MP3, 128 kbps, peaks ≤ −3 dBFS. The sound must start within 5 ms (trim leading silence) with no long silent tail. breach_start must fit inside 1.6 s. ping and timer_warn must be short (≤ 150 ms) because they repeat quickly. One cohesive sound palette: glassy, digital, premium.

=====================================================================
PART 4 — AAA POLISH IN THE FRONT END (public/tv.html, public/play.html)
=====================================================================
Raise the visual quality around the new art. Keep every element id that update(), flipNew() and bind() use (search for $('#…') and getElementById before renaming anything).

TV:
   4.1 Title: a cinematic intro (about 2.5 s) where the logo assembles from glitch slices over the title background, then the menu slides up. Skippable by any click or key. Reduced motion: simple fade.
   4.2 Transitions: a 300–450 ms "data wipe" between screens (lobby → game → result) using transform and opacity only.
   4.3 Cards: a hover-free idle shimmer on face-down cards (very subtle, staggered); flip reveal stays 0.7 s; add a burst of team-coloured particles on reveal (canvas, capped at 30 fps, at most 60 particles); a screen shake (6 px, 250 ms) and red vignette pulse on Zero Day.
   4.4 Pings: the avatars on a card should pop in with a scale bounce; the majority bar fills smoothly; during a breach the card border runs a light around its edge in 1.6 s.
   4.5 Clue reveal: the clue word decodes letter by letter (scramble → final word over 600 ms).
   4.6 Turn change: the active side panel brightens and the inactive one dims; a sweeping light crosses the clue bar.
   4.7 Result: the winning crew's colour floods in from their side; the full key reveals card by card (40 ms stagger); the score counter ticks up.
   4.8 Keep 60 fps on a 2020 Fire TV Stick: animate only transform and opacity; avoid large blur filters during gameplay; no more than one canvas.

Phone:
   4.9 Join: avatar picker as a 4-column portrait grid with the name under the selected one (already present; restyle to match).
   4.10 Operator: the key grid gets the card art for each owner in miniature (CSS background on each node), plus the shape icons that already exist; TRANSMIT plays a send animation.
   4.11 Runner: tapping a node gives a 120 ms press-in, a ripple in the crew colour, and haptics (already wired); the breach pulse matches the TV.
   4.12 Long words: do NOT change the splitting logic (CC.splitWord) or the fitting rules; every word in both decks has been verified to fit at 360 px width.
   4.13 Night and Daylight themes must both stay readable in sunlight and darkness: 7:1 contrast for words and numbers.

Accessibility (both): reduced motion removes shakes, particles and scrambles (fades only); high contrast removes background images and glows; colour is never the only signal (shapes stay on every revealed card).

=====================================================================
PART 5 — QA AND DELIVERY
=====================================================================
Run and report:
   npm run build
   npm test                          (must stay 11/11 passing)
   $env:BOTS=1; $env:CC_SPEED=10; npm start     (in one PowerShell window)
   npm run smoke                     (in a second window; must print PASS)
Then play a full game with one phone plus bots (Family deck, Versus), a co-op game, and an Adult game with Mole mode on, and capture screenshots:
   TV: title, Training step 6 and 9, lobby, board mid-guess with pings, Zero Day reveal, result. Phone: join avatars, lobby, Operator with clue entry, Runner mid-vote, result. Also run the phone at 360×740 in Daylight.
Confirm with evidence:
   - Every manifest file is present at the right size and format (list them with sizes).
   - No text in any image except the logo.
   - Loudness and peak tables for the voice, music and effects; loop checks; MD5s.
   - No secrets on the TV (smoke test PASS).
   - The game still works with public/assets and public/audio emptied (rename the folders temporarily and play one turn).
   - Fire Stick performance note (how you checked frame rate).
Create CREDITS.md listing every generated asset group, the tool or model used, the date, and the commercial-use terms for a free game and for a paid one. Flag anything that needs my action.

Finally give me the complete changed files and all assets as ONE zip with the same folder structure, plus a short CHANGELOG.md.

Start with PART 0: read the files, then give me the Part 1 style guide, shot list and credit estimate. Do not generate anything until I say "go".
```

## After ChatGPT finishes

1. Unzip its files over your project folder.
2. Run `npm run build`, then `npm test`.
3. Bring the zip back to Claude for review against this prompt.
