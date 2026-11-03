# CYBER CYPHER — HALO and final audio repair

**Updated 3 November 2026 — full audio automated QA passed.**

## Fault and completed repair

The old audio installation contained an FFmpeg `silenceremove=stop_periods=1` bug: it discarded narration after the first pause. This originally left 33/45 HALO takes suspiciously short or silent, including all tutorial chapters.

[HALO restoration workflow](https://github.com/connex222/CYBER-CYPHER/actions/runs/41706095522) rebuilt **45/45 HALO Voice 1 MP3s** from the previously generated Creative Claw source files, preserving natural speech pauses and committing them to `main` after checking format, duration, loudness and peak levels. This cost **zero Creative Claw credits**.

The TV voice player now stops an interrupted voice clip, suppresses stale asynchronous audio starts and bypasses browser cache for revised MP3 URLs.

## Final SFX and music corrections

[Final audio workflow](https://github.com/connex222/CYBER-CYPHER/actions/runs/41709949429) repaired the three remaining SFX peak violations, trimmed the two overlong music stings with fades, and independently rechecked **all 73 MP3s**. Only these five MP3s and `AUDIO-QA.json` were changed in the final repair commit; every other audio file, including all 45 HALO recordings, was preserved byte-for-byte.

| File | Measured duration | Measured true peak |
|---|---:|---:|
| `clue_arrive.mp3` | 0.836s | −6.1 dBFS |
| `reveal_ice.mp3` | 0.731s | −5.1 dBFS |
| `turn_change.mp3` | 0.836s | −6.6 dBFS |
| `mus_win.mp3` | 6.792s | −8.5 dBFS |
| `mus_lose.mp3` | 5.799s | −5.7 dBFS |

Result: `AUDIO-QA.json` records 73 files, zero failures, zero missing voices, zero effect peak failures, zero sting duration violations and **18,970,922 total audio bytes**. The workflow also passed the existing 11 game tests and build.

## Scope limitations

Technical audio QA is **complete**; live device listening and multiplayer tests are **not**. A person should still listen to the entire tutorial on TV and check chapter transitions, play/pause and voice mute controls. Audio and artwork commercial licensing is separately required before selling the game.

No paid voice/music/effect generation was needed for either repair.
