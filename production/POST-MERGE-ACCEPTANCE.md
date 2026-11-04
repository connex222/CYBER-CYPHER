# CYBER CYPHER — Post-merge acceptance gate

Date: 4 November 2026. Scope: merged 24-avatar pack, TV and phone interfaces, 11-chapter HALO tutorial, audio and multiplayer stability.

## Confirmed from repository
- 24 native WebP portrait files exist, IDs 00–23; automated image and name-mapping validation previously passed on the artwork branch.
- `tools/live-acceptance.js` checks independent WebSocket clients, room creation, QR redirects, host and spectator permissions, public/private game data, reconnections and pause/resume.
- These tests **do not** measure on-screen bounds, subject identity, visible controls, audio playback or physical-device gameplay.

## Automated gate
- `npm ci --ignore-scripts && npm test && npm run build`
- `python -m pip install Pillow && python production/verify_native_avatars.py`
- With the local server running on PORT=3123, BOTS=1, CC_SPEED=10: `CC_ACCEPTANCE_HTTP=http://127.0.0.1:3123 node tools/live-acceptance.js`
- The native-avatar workflow should now execute for PR changes to avatar images, the client avatar renderer, the acceptance suite, its verifier, or the workflow itself; also for matching pushes to `main`. This replaces the retired staging-branch-only push trigger.
- Workflow uses GitHub Actions minutes; if unavailable, execute local commands and record the actual results rather than assuming PASS.

## Visual gate (human browser/device review required)
At each resolution, record a screenshot and PASS/FAIL with exact viewport and browser:
- Phone portrait 360×800 and 390×844; phone landscape 844×390
- Tablet 768×1024 and 1024×768
- Desktop 1366×768
- TV 1920×1080 (also inspect overscan/safe area on the actual TV)

For all screens: verify the title and lobby are contained, QR is entirely visible and scannable, all controls can be tapped or focused, no text clips, avatar choices and names match, and no scroll/overlay prevents gameplay. For TV verify the 5×5 board, crew panels, timer and navigation at 1920×1080. For phone verify the 5×5 voting board, operator-only controls, overlays, high-contrast options and safe-area insets.

For each avatar 00–23: check face and costume identity, correct name, no severed head/chin, visible selection indicator, correct lobby/team display and consistent cropping at 48px and 64px. Pay particular attention to Onyx (11), Halcyon (13) and Quark (14): their art descriptions were flagged for editorial review. Do not call visual acceptance complete from SHA/dHash checks alone.

## HALO audio and tutorial gate (not yet certified)
- On real TV/browser, press Play and hear a complete chapter beyond its first word; check chapters 1–11 in sequence and after Previous/Next; verify play/pause/replay and disabled/enabled mute states.
- Check music consistency between the title and lobby, correct audio ducking during speech, no overlap, no abrupt narration cutoff, and graceful handling of browsers that require user interaction to unlock sound.
- Confirm tutorial buttons and Back to Lobby remain visible and actionable throughout.

## Human multiplayer gate (not yet certified)
- One TV and two real phones, separate browsers and Wi-Fi/cellular reconnects.
- QR entry, avatar selection, join, start, operator clues, runner pings, spectator restrictions, end-of-round and rematch; test disconnect/reconnect at lobby and mid-game.
- Run a complete session at ordinary speed; never run destructive/fast acceptance against a public room.

## Promotion rule
Automated PASS + screenshot-reviewed visual PASS + chapter-by-chapter audio PASS + real-device multiplayer PASS are all required for final production sign-off. Missing evidence means PENDING, not PASS. Keep edits on an isolated PR; avoid deploying during an active game. No new Creative Claw credits are needed for this gate.
