# Word packs

A pack is one small file in this folder. Drop a new `.json` file in here and, next time the server starts, it appears in the host's lobby under **Expansion packs**. No code changes needed.

## Adding a pack, step by step

1. Copy `christmas-2026.json` and rename the copy, for example `football-night.json`.
2. Open it in Notepad. Change these four things:
   - `"id"`: a short label with only lower-case letters, numbers and hyphens, e.g. `"football-night"`. It must be different from every other pack.
   - `"name"`: what players see, up to 30 characters, e.g. `"Football Night"`.
   - `"description"`: one short line (optional).
   - `"rating"`: `"family"` or `"adult"`.
3. Replace the words in the `"words"` list. Keep each word in quotes, separated by commas, with no comma after the last one.
4. Run `npm test`. It checks every pack and tells you if something is wrong.
5. Commit and push. Remember: pushing to `main` restarts the server and ends live games, so never do it during a game night.

## Rules for words

- One word only. Letters A to Z, 3 to 12 letters. No spaces, numbers or hyphens.
- Aim for **150 or more** words. The minimum is 60. Anything less and the pack is skipped.
- Words already in the Family or Adult deck are ignored automatically (so are repeats inside the pack and blocked words). The server prints a warning when it ignores any.
- A **family** pack can be used with either deck. An **adult** pack only shows up when the host picks the Adult deck, and the existing "everyone is 18+" confirmation still applies.

## How hosts use packs

In the host's phone lobby, under **Word deck**, tap a pack to switch it on (tap again to switch it off). Then choose:

- **Mixed into deck**: pack words are shuffled in with the normal 1,000 words. A small pack will only show up a few times per board.
- **Pack words only**: every word on the board comes from the chosen pack(s). Best for themed nights.

The TV lobby shows a chip such as `+ CHRISTMAS CHAOS` or `CHRISTMAS CHAOS ONLY`.

## If a pack does not appear

Start the server and read the lines starting `[cc] pack warning:`. They say which file has a problem and why. A broken pack never stops the game; it is just left out.
