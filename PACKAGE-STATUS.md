# Package status — Audio staging, not final commercial release

**Date:** 3 November 2026

## Finished and in this ZIP

- Original, integrated stereo MP3 files: `mus_lobby.mp3`, `mus_game_1.mp3`, `mus_game_2.mp3`, `mus_game_3.mp3`.
- All three game stems are additive, exactly 137.143 seconds and decode to 6,048,000 samples each. Their combined measured loudness is −18.4 LUFS, below the −16 LUFS ceiling.
- Original game source, rules, test files, protocol and front end are unchanged.
- `AUDIO-SOURCES.json` maps all 45 HALO recordings, 21 sound effects and four additional Creative Claw music candidates to the original service URLs.
- `INSTALL-AUDIO.cmd` downloads the 45 lines and 21 effects and installs the accepted three additional music files, with a mastering stage when FFmpeg is installed.
- `AUDIO-LOCAL-QA.json` measures the four included local tracks.

## Pending, and not falsely reported as finished

- Cloud-generated recordings cannot be downloaded by the production environment used to assemble this ZIP; consequently these **69 files are not yet physically bundled**. On a Windows computer with internet, `INSTALL-AUDIO.cmd` completes that step. `mus_game_1` from Creative Claw is listed as an audition alternative but is intentionally not substituted for the precisely synchronised local base.
- The Windows downloader has not been run against the external CDN here. After installation, verify every download and complete loudness measurements before commercial distribution.
- At the current stage the original image placeholders remain; 40 WebP assets and front-end motion polish are outstanding.
- Real WebSocket smoke test was attempted but cannot start in this sandbox because the `ws` npm dependency is not installed; npm is unavailable offline (`ENOTCACHED`). Run `npm install` on the user's Windows PC and then follow the original smoke instructions.
- The original 11 automated rules tests pass, and the build command passes.
- No statement of successful live phone/TV gameplay, Fire Stick frame-rate testing, or final copyright clearance is made.

## Why the source URLs, not fake audio

The service returns permanent audio URLs, but this file-building environment cannot fetch their bytes. Rather than create silent files or claim audio was installed, the package provides the actual proven source URLs and a downloader that uses them unchanged.
