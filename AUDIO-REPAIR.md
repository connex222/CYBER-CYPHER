# CYBER CYPHER — HALO narration repair

**Audit:** 3 November 2026  
**Status:** Audio delivery blocked until the recordings are repaired and validated.

## What was found

The repository already contains all 73 requested audio filenames. Presence does not mean that their content is usable. Analysis of the committed `AUDIO-QA.json` measurements against `ASSET-MANIFEST.md` identified:

- **33 of 45 HALO files flagged as short or inaudible** under a conservative minimum speaking-time screen (0.19 seconds per spoken word, at least 0.5 seconds per file).
- **13 HALO files measured at approximately −70 LUFS**, consistent with almost-silent output.
- **3 effects** exceed the requested −3 dBFS peak ceiling: `clue_arrive.mp3`, `reveal_ice.mp3`, `turn_change.mp3`.
- **2 music stings** slightly exceed their stated limits: `mus_win.mp3` (7.027 s), `mus_lose.mp3` (6.034 s).
- The full audio folder is within the specified 20 MiB maximum.

The previous two-pass FFmpeg voice pre-filter contained `silenceremove=...:stop_periods=1`. This stops processing **at the first natural pause**, truncating the rest of the speech. The fix trims silence at the *beginning and end* by reversing audio temporarily, without removing pauses between words.

A deterministic regression fixture with a 0.6-second tone, 0.4-second silence and 1.1-second tone measured **2.1 seconds**. The old filter truncated it to **0.72 seconds**, whereas the new filter preserves **2.20 seconds**, including 50 milliseconds of padding at each end.

## Repair using Windows CMD

1. Download the updated repository as a ZIP using GitHub **Code → Download ZIP**, then extract it.
2. Install Node.js LTS and FFmpeg if not already installed. In CMD: `winget install --id Gyan.FFmpeg --exact`.
3. Open the extracted `CYBER-CYPHER` folder and double-click `INSTALL-AUDIO.cmd`. The corrected installer automatically detects and replaces suspiciously short voice recordings.
4. For a full forced HALO rebuild, open CMD in that folder and run `node tools\\install-audio.js --repair-voices`. The generator does **not** charge additional credits: this downloads the existing Creative Claw recordings and remasters them locally.
5. Run `node tools\\install-audio.js --verify-only`, then review `AUDIO-QA.json` for `complete: true`, `defectiveVoices: []`, no failures and under 20 MiB.
6. Upload the repaired MP3 files to this repository before promoting the release.

This is **not** evidence of successful re-mastering on GitHub. The committed MP3 files remain in their previous state until they are actually replaced.

## Restrictions preserved

No changes to `server.js`, `src/`, `test/`, `tools/smoke.js`, `tools/qr.js`, `tools/build.js`, network messages, timers or gameplay. No new credits consumed.

Before commercial distribution, confirm licensing terms for the selected speech, music and effects models.
