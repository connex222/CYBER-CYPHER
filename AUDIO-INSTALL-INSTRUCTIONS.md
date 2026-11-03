# Installing CYBER CYPHER audio on Windows

You only need to do this once after extracting the ZIP.

1. Open the extracted **cyber-cypher** folder in File Explorer.
2. Double-click **INSTALL-AUDIO.cmd**.
3. The script downloads the 45 HALO recordings, 21 effects and the approved Creative Claw title/victory/defeat music directly into the game's `public/audio` folder. **It never modifies the game rules, code or saved games.**
4. Wait until it says how many recordings are present. If everything succeeds, it should report **73/73 files**. The four locally generated gameplay/lobby tracks are already included in the ZIP.
5. Open **AUDIO-QA.json** to see the file report. If there are missing files, run the same `.cmd` file again. Completed files are skipped.

## Important: audio mastering

To produce the specified voice and effect formats, install **FFmpeg**. If you have not installed it, open **Command Prompt** by typing `cmd` into the Windows Start menu, and enter this **one command**:

```cmd
winget install --id Gyan.FFmpeg --exact
```

Press Enter. When it finishes, close and reopen the Command Prompt window. Then double-click `INSTALL-AUDIO.cmd` again.

If the installer had already downloaded unmixed files **before FFmpeg was installed**, open a CMD window in the game folder and enter:

```cmd
node tools\install-audio.js --remaster
```

That command re-downloads the source recordings and applies the required audio format conversion and loudness checks. If FFmpeg is not installed, the recordings are still playable, but they do **not** satisfy the final audio specification.

## Check the game

Open a CMD window in the game folder and type:

```cmd
npm install
npm test
npm run build
npm start
```

Enter one command at a time. `npm start` keeps running because it is hosting the game. Open `http://localhost:3000` in your browser. Close the server with **Ctrl+C**.

For the separate real-network smoke test, use two CMD windows. First:

```cmd
set BOTS=1
set CC_SPEED=10
npm start
```

Then in the second CMD window:

```cmd
npm run smoke
```

This stage has not been signed off until the cloud recordings are downloaded, mastered, checked and actually played in a browser.
