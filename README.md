# CYBER CYPHER — Alpha RC1

**Current candidate version:** `1.0.0-alpha.1` (Stage 24). See [`production/STAGE-24-ALPHA-RC1.md`](production/STAGE-24-ALPHA-RC1.md) for the acceptance gates, known limits and rollback. Automated tests are not a substitute for real TV/phone testing.

A 2035 cyberpunk team word-spy party game for a TV and phones, for 2–10 players. Two hacker crews race to find their own words on a **5 × 5 grid of 25**. Only each crew's Operator knows which word is which, and they may say just one word and a number. Hit the Zero Day and you lose.

- `GAME-DESIGN.md`: rules, modes, screens, narrator and the tutorial script
- `ASSET-MANIFEST.md`: original asset specification; approved native portraits and audio are now integrated, not merely placeholders
- `CHATGPT-ART-AUDIO-PROMPT.md`: the prompt for ChatGPT + Creative Claw to make the art and audio

---

## 1. Play it on your own computer

1. Install **Node.js 20 or newer** from [nodejs.org](https://nodejs.org) (the "LTS" button).
2. Open a terminal in this folder. On Windows: click the File Explorer address bar, type `powershell`, press Enter.
3. Type `npm install` and press Enter. You only need to do this once.
4. Type `npm start` and press Enter.
5. Open **http://localhost:3000** in Chrome on the computer connected to your TV. That's the TV screen.
6. On phones connected to the same Wi-Fi, go to **http://YOUR-COMPUTER-ADDRESS:3000/CODE**. Use the four letters shown on the TV as the code.
   - To find the address on Windows, type `ipconfig` in PowerShell and look for "IPv4 Address" (for example `192.168.1.23`).

To stop the game, press **Ctrl + C** in the terminal.

## 2. Test it on your own with bots

In PowerShell, type: `$env:BOTS=1; npm start`

Join on one phone, then press **ADD BOT** in the lobby for each extra seat. Bots play every role, so you can run full games alone. Leave bots off for real game nights.

## 3. Live hosted game (Render)

The existing live service is **https://cyber-cypher-j2ry.onrender.com**, connected to `connex222/CYBER-CYPHER` branch `main` with automatic deployment, build `npm install`, start `node server.js` and health check `/healthz` (Render Free, Frankfurt). Open it on the TV and scan the lobby QR code on each phone.

Free services can sleep while idle. Open the TV page before a session to wake the service. **Never merge or redeploy during active games**: rooms are held in server memory and are lost on a server restart.

## Controls

| Where | Control | What it does |
|---|---|---|
| TV | Click / remote | Menus, Training, Start |
| TV | **← →** | Step through Training |
| TV | **Play / Pause / Replay / Back / Next** | Control HALO's eleven recorded tutorial chapters |
| TV | **Space** | Pause or resume a game |
| TV | **F** | Full screen |
| Phone | ⓘ button | Rules summary |
| Phone | ⚙ button | Theme, text size, Grid or List board, vibration, pause (host) |

## Checks

Run `npm ci --ignore-scripts`, `npm test` and `npm run build`. The GitHub acceptance workflow additionally checks all 24 avatars, 11 HALO recordings, local WebSocket behaviour and Chromium browser playback/viewport controls.

- `npm test`: rules, board invariants and automated regression tests. They cover both word decks, the board setup, clue rules, majority voting, turn endings, the Zero Day, timers, co-op ICE, the Mole vote, secrets staying off the TV, and full bot games at 2, 3, 4, 6 and 10 players.
- `npm run smoke`: plays a whole Adult-deck game with Mole mode over real connections, then starts a rematch. It also checks that no secret reaches the TV or spectators. First start a server with bots on: `$env:BOTS=1; $env:CC_SPEED=10; npm start`

## Changing things

| To change | Edit this |
|---|---|
| Timers, board makeup, limits | `src/config.js` |
| Word decks | `src/words.json` (drafts and the trimming script are in `words/`) |
| Screens | `public/tv.html` and `public/play.html` |
| Network code, icons, avatars, word splitting | `tools/shared.js`, then run `npm run build` |
| Art and sound | Drop files into `public/assets/` and `public/audio/` with the names in `ASSET-MANIFEST.md`. No code changes needed. |

Fonts: Orbitron and Atkinson Hyperlegible, both under the SIL Open Font License, embedded in the HTML.
