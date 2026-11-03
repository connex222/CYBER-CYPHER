# CYBER CYPHER — Asset Manifest

Every asset is **optional**. If a file is missing, the game shows its built-in placeholder (CSS/SVG art, synthesised sound, browser voice plus subtitles). Add files at these **exact paths and names** and they appear automatically, with no code changes needed.

> Already wired: every path below is referenced in the code. To check, run the game, open the TV, and watch the browser network tab: missing files show as 404s and fall back silently.

## Images (WebP)

| Path | Size (px) | Transparent | Where it appears | Placeholder now |
|---|---|---|---|---|
| public/assets/ui/logo.webp | 1600 × 520 | Yes | Title screen and Training step 1 (replaces the neon text logo) | Neon text logo |
| public/assets/ui/emblem-volt.webp | 512 × 512 | Yes | VOLT side panel, lobby crew heading | Cyan hexagon line icon |
| public/assets/ui/emblem-flare.webp | 512 × 512 | Yes | FLARE side panel, lobby crew heading | Amber triangle line icon |
| public/assets/ui/emblem-ice.webp | 512 × 512 | Yes | ICE side panel (co-op) | Violet diamond line icon |
| public/assets/ui/halo.webp | 512 × 512 | Yes (circle crop) | Small round portrait beside HALO subtitles | Hidden |
| public/assets/bg/title.webp | 1920 × 1080 | No | Title and Training background | Cyan glow and grid lines |
| public/assets/bg/lobby.webp | 1920 × 1080 | No | Lobby background | Cyan/amber glows |
| public/assets/bg/grid.webp | 1920 × 1080 | No | In-game background behind the 5×5 grid | Dark grid lines |
| public/assets/bg/result.webp | 1920 × 1080 | No | Result screen background | Soft glow |
| public/assets/bg/phone.webp | 1080 × 2400 | No | Phone background (Night theme only, fixed) | Dark gradient |
| public/assets/cards/node.webp | 474 × 300 | No | Face-down card (word printed on top by the game) | Dark glass gradient |
| public/assets/cards/volt.webp | 474 × 300 | No | Revealed VOLT card back | Cyan gradient |
| public/assets/cards/flare.webp | 474 × 300 | No | Revealed FLARE card back | Amber gradient |
| public/assets/cards/noise.webp | 474 × 300 | No | Revealed noise card back | Grey diagonal stripes |
| public/assets/cards/zero.webp | 474 × 300 | No | Revealed Zero Day card back | Red radial glow |
| public/assets/cards/ice.webp | 474 × 300 | No | Revealed ICE card back (co-op) | Violet gradient |
| public/assets/avatars/agent-00.webp … agent-23.webp | 256 × 256 | No | Player portraits on TV and phones (24, in the order of AVATAR_NAMES) | Visor silhouettes in 24 hues |

**Rules for every image:** no text, letters, logos or real brand names in the art (the game prints all words itself). Keep the centre of card art calm and dark enough that white bold text stays readable at 7:1 contrast. Avatars are only switched on when `agent-00.webp` exists, so add the whole set together.

Avatar names (index 0–23): 0 Static, 1 Cipher, 2 Neon, 3 Glitch, 4 Vector, 5 Pixel, 6 Nova, 7 Rook, 8 Echo, 9 Flux, 10 Kestrel, 11 Onyx, 12 Juno, 13 Halcyon, 14 Quark, 15 Raven, 16 Siren, 17 Tango, 18 Umbra, 19 Volta, 20 Wraith, 21 Xeno, 22 Yara, 23 Zephyr.

## Music (MP3, 44.1 kHz, stereo, 192 kbps, −20 LUFS, true peak ≤ −1.5 dB)

| File | Length | Brief |
|---|---|---|
| public/audio/mus_title.mp3 | 64 bars, loop | Main theme. Dark synthwave / cyberpunk: pulsing analogue bass, arpeggiated synth, gated drums, one memorable 4-bar hook. 100 BPM, A minor. No intro or ending. |
| public/audio/mus_lobby.mp3 | 32 bars, loop | Lighter version of the theme for the lobby: bass and arps, sparse drums, room to talk over. 100 BPM, A minor. |
| public/audio/mus_game_1.mp3 | 64 bars, loop | In-game layer 1 (always on): low pulse bass, ticking hi-hat, sparse pads. 112 BPM, A minor. |
| public/audio/mus_game_2.mp3 | identical length | Layer 2 (fades in when a crew has 5 or fewer nodes left): driving kick and snare, filtered arpeggio. Additive layer, not a full mix. |
| public/audio/mus_game_3.mp3 | identical length | Layer 3 (fades in at 2 or fewer nodes left): urgent lead synth, risers, extra percussion. Additive layer. |
| public/audio/mus_win.mp3 | 5–7 s | Victory sting, bright and triumphant, resolving to A major. |
| public/audio/mus_lose.mp3 | 4–6 s | ICE-wins sting: cold, descending, glitchy shutdown. |

The three game layers must have **identical sample counts** and loop seamlessly; the game starts them together and fades layers in and out over 1.5 s.

## Sound effects (MP3, 44.1 kHz, mono, 128 kbps, peaks ≤ −3 dBFS, sound starts within 5 ms)

| File | Brief | Length |
|---|---|---|
| public/audio/ui_tap.mp3 | Soft digital click for menu buttons | 80–150 ms |
| public/audio/ui_join.mp3 | Bright two-note chime when an agent joins the lobby | 400 ms |
| public/audio/ui_back.mp3 | Short descending blip (Training back) | 150 ms |
| public/audio/clue_arrive.mp3 | Data-burst whoosh plus decoding chatter as the clue appears on the TV | 0.8 s |
| public/audio/ping.mp3 | Tiny sonar blip when a Runner votes for a card | 120 ms |
| public/audio/ping_remove.mp3 | Softer, lower blip when a vote is withdrawn | 120 ms |
| public/audio/breach_start.mp3 | Rising charge-up hum over the 1.6 s lock-in (must fit inside 1.6 s) | 1.6 s |
| public/audio/breach_cancel.mp3 | Power-down zap when the majority breaks | 300 ms |
| public/audio/reveal_volt.mp3 | Clean, positive cyan unlock: two-note rise with a glassy shimmer | 0.6 s |
| public/audio/reveal_flare.mp3 | Warm amber unlock, same family as VOLT but a different interval | 0.6 s |
| public/audio/reveal_noise.mp3 | Dull static burst, slightly comic | 0.5 s |
| public/audio/reveal_ice.mp3 | Crystalline freeze crackle | 0.7 s |
| public/audio/reveal_zero.mp3 | Red-alert alarm: two-tone klaxon, three pulses | 1.2 s |
| public/audio/turn_change.mp3 | Sweep and low swell as play passes to the other crew | 0.8 s |
| public/audio/timer_warn.mp3 | Short tick for the last 10 seconds | 60 ms |
| public/audio/timer_end.mp3 | Descending buzzer when time runs out | 0.8 s |
| public/audio/ice_claim.mp3 | Icy digital stab as ICE takes one of its nodes | 0.6 s |
| public/audio/pass.mp3 | Neutral swish when a crew ends its turn | 0.4 s |
| public/audio/mole_reveal.mp3 | Dramatic low sting as the Mole result is shown | 1.2 s |
| public/audio/glitch.mp3 | Short digital glitch / data tear (pause, Zero Day) | 250 ms |
| public/audio/react.mp3 | Light pop when a reaction emoji floats up | 150 ms |

## HALO voice (MP3, 44.1 kHz, mono, 160 kbps, −16 LUFS, true peak ≤ −1.5 dB, 50 ms silence each end)

**Character:** HALO, the game's AI host. A woman with a British accent, calm, precise, dry and a little smug, with a faint digital sheen (subtle, never robotic). Warmer in Training, crisper in game. An original voice, not an imitation of any real person.

Lines with `_1`, `_2`… are variations: record each with a different delivery.

| File | Line |
|---|---|
| public/audio/vo_title.mp3 | Welcome to Cyber Cypher. London, twenty thirty-five. Every word is a secret. |
| public/audio/vo_join_1.mp3 | New operative connected. |
| public/audio/vo_join_2.mp3 | Signal acquired. Welcome to the grid. |
| public/audio/vo_join_3.mp3 | Another agent online. |
| public/audio/vo_start_versus.mp3 | Two crews. Twenty-five nodes. One Zero Day. Breach your nodes first. |
| public/audio/vo_start_coop.mp3 | ICE is awake. Find your nodes before it locks you out. |
| public/audio/vo_turn_volt.mp3 | VOLT crew. Your Operator has the floor. |
| public/audio/vo_turn_flare.mp3 | FLARE crew. Your Operator has the floor. |
| public/audio/vo_clue_1.mp3 | Transmission received. |
| public/audio/vo_clue_2.mp3 | Clue uploaded. |
| public/audio/vo_clue_3.mp3 | Signal decoded. Runners, over to you. |
| public/audio/vo_correct_1.mp3 | Clean breach. |
| public/audio/vo_correct_2.mp3 | Node secured. |
| public/audio/vo_correct_3.mp3 | That one is yours. |
| public/audio/vo_correct_4.mp3 | Nice work. |
| public/audio/vo_noise_1.mp3 | Just noise. |
| public/audio/vo_noise_2.mp3 | Dead end. Turn over. |
| public/audio/vo_noise_3.mp3 | Static. Nothing there. |
| public/audio/vo_wrong_1.mp3 | That node belongs to the other crew. |
| public/audio/vo_wrong_2.mp3 | Ouch. You just helped the opposition. |
| public/audio/vo_wrong_3.mp3 | Wrong network. |
| public/audio/vo_ice_wrong.mp3 | You tripped the ICE. |
| public/audio/vo_ice_claim.mp3 | ICE is spreading. |
| public/audio/vo_zero.mp3 | Zero Day. System compromised. |
| public/audio/vo_pass.mp3 | Crew passes. |
| public/audio/vo_timeout.mp3 | Time is up. |
| public/audio/vo_last_node.mp3 | One node left. |
| public/audio/vo_volt_wins.mp3 | VOLT takes the grid. |
| public/audio/vo_flare_wins.mp3 | FLARE takes the grid. |
| public/audio/vo_crew_wins.mp3 | All nodes secured. ICE defeated. |
| public/audio/vo_ice_wins.mp3 | ICE has locked the grid. Mission failed. |
| public/audio/vo_mole_vote.mp3 | Someone in your crew was working against you. Name the mole. |
| public/audio/vo_mole_caught.mp3 | Mole exposed. |
| public/audio/vo_mole_free.mp3 | The mole got away with it. |
| public/audio/vo_tut_1.mp3 | Welcome, operative. I am HALO. Let me show you how to crack the grid. |
| public/audio/vo_tut_2.mp3 | There are two crews, VOLT and FLARE. Each crew has one Operator. Everyone else is a Runner. |
| public/audio/vo_tut_3.mp3 | The grid holds twenty-five words. Nine belong to the crew that starts, eight to the other crew. Seven are noise. One is the Zero Day. |
| public/audio/vo_tut_4.mp3 | Only the Operators can see which word is which. The secret key is on their phone. |
| public/audio/vo_tut_5.mp3 | The Operator sends one word and a number. Ocean, two, means two of your words link to ocean. |
| public/audio/vo_tut_6.mp3 | Runners talk it through, then tap a word on their phones. When most of the crew agree, the node locks in. |
| public/audio/vo_tut_7.mp3 | Hit one of your own words and you keep going. You get one more guess than the number. |
| public/audio/vo_tut_8.mp3 | Hit noise, or the other crew’s word, and your turn is over. |
| public/audio/vo_tut_9.mp3 | Hit the Zero Day and your crew loses instantly. Avoid it at all costs. |
| public/audio/vo_tut_10.mp3 | Only two or three of you? Team up against ICE, which takes one of its nodes every turn. Want a twist? Switch on Mole mode, and one Runner in each crew is secretly working for the other side. |
| public/audio/vo_tut_11.mp3 | First crew to find all of their words wins. Good luck, operative. |

**Totals:** 17 image slots (plus 24 avatars), 7 music files, 21 effects, 45 voice lines.
