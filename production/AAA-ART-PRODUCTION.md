# CYBER CYPHER — approved AAA artwork implementation

## Approved, generated and budgeted

- The **four previously approved samples** are VOLT emblem, HALO AI portrait, London title panorama and smoked-glass node card.
- An additional **11 non-avatar images** were generated in Creative Claw in the approved design family, at **208 credits total**: two faction emblems, four backgrounds and five revealed node cards.
- The last reported Creative Claw balance after the 11-item batch is **207 credits**.
- The exact **CYBER CYPHER** 1600×520 transparent logo is drawn locally with the existing OFL Orbitron font at **zero generation credits**.
- All 24 player avatars remain **untouched** and their existing generated placeholders continue to operate.

## Production installation (no runtime CDN calls)

\`production/art-sources.json\` records the 15 original generated PNG URLs, their **exact local game paths**, target dimensions and byte caps. These URLs are build-time inputs only.

\`production/build_art.py\` downloads PNGs, makes transparent alpha treatment for the four emblems/HALO inputs, darkens the centre of word cards to protect 7:1 white text contrast, creates the original logo, exports 16 WebP images, enforces per-file and combined 3 MiB budgets, and writes \`production/ART-QA.json\` with SHA-256 digests.

For convenience on Windows, double-click **\`INSTALL-ART.cmd\`**, which installs free Python image packages and runs the production builder and verifier. **This download/packaging operation consumes no Creative Claw generation credits.** The script requires network access only to fetch the original source artwork. The built game uses **only local \`/assets/\` files**.

### Automatic GitHub installation

The GitHub Actions workflow \`.github/workflows/approved-art-assets.yml\` is configured to run when this production pipeline merges to \`main\`. It should:
1. Fetch the original 15 Creative Claw PNGs.
2. Build all 16 local WebP assets and the QA JSON.
3. Run the existing 11 game tests and build.
4. Commit the verified local WebP files to \`main\`.

**Do not claim this completed until the GitHub Actions run actually succeeds and the 16 binary files are visible on \`main\`.** Some GitHub accounts have Actions permission, minutes, or network restrictions. If the workflow cannot run, the repository includes the Windows installer as a fallback.

### Required deployment checks

- **Expected local WebP files:** four UI icons + logo; five background images; six card images = **16** non-avatar files.
- No \`agent-00.webp\` or other avatar output; the default player silhouettes must remain.
- All images physically exist in \`public/assets\`, with the manifest's exact filenames, dimensions and sizes.
- Transparent logo/icons have alpha; card word areas meet **7:1** contrast against white text; all images together stay under **3 MiB**.
- TV and phone load their own local WebP files without making external CDN requests or exposing any secret Operator keys.
- Run \`npm test\`, \`npm run build\`, and real WebSocket smoke tests before any release claim.
- Visually inspect TV (1920×1080), tablet, desktop and phone; verify the art does not obscure the room code, QR code, player names, cards, buttons or tutorial controls.
- These procedural checks cannot guarantee artistic quality or detect incidental text printed in a generated image. Perform human visual inspection and commercial licensing review prior to release.

**Protected files unchanged:** \`server.js\`, \`src/\`, \`test/\`, \`tools/smoke.js\`, \`tools/qr.js\`, \`tools/build.js\`, game network protocol, rules, timers, and secret payload design.
