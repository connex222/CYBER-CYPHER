# CYBER CYPHER — Game Design

**London, 2035.** Two rival hacker crews race to breach their own nodes on a grid of 25 code words. One player per crew, the **Operator**, can see which word belongs to whom. They may say only **one word and a number**. Everyone else, the **Runners**, must work out what they mean without tripping the **Zero Day**.

- **Players:** 2–10 (Versus 4–10; Co-op vs ICE 2–3)
- **Length:** 10–15 minutes per game; best of 3 by default
- **Platform:** TV shows the grid; phones are private controllers
- **Decks:** Family (1,000 words) and Adult 18+ (1,000 different words, 66 rare words with definitions)

---

## 1. Core rules

### The grid
25 word cards ("nodes") in a 5×5 grid on the TV.

| Owner | Versus | Co-op | Shape (colour-blind safe) |
|---|---|---|---|
| Starting crew | 9 | VOLT crew 9 | VOLT: hexagon · FLARE: triangle |
| Other crew | 8 | ICE 8 | ICE: diamond |
| Noise | 7 | 7 | Bar |
| Zero Day | 1 | 1 | Circled X |

The starting crew is random each game and has one extra node to find.

### A turn
1. **Clue (Operator).** The Operator of the crew in play types **one word** and picks a **number** from 0–9 or ∞ on their phone, then taps TRANSMIT. The TV shows it big.
2. **Guess (Runners).** Runners talk it through, then each taps a word on their phone to vote ("ping"). Their avatars appear on that card on the TV.
3. **Lock-in.** When a **majority** of that crew's connected Runners ping the same card, it starts a 1.6-second breach. If the majority holds, the card flips.
4. **Result:**
   - **Own node:** keep guessing. You may make up to **number + 1** guesses (0 or ∞ = unlimited).
   - **Noise:** turn ends.
   - **Other crew's node:** turn ends, and it counts for them.
   - **Zero Day:** your crew loses immediately.
5. Runners can also majority-vote **END TURN** at any point after the clue.

### Winning
Find all your crew's nodes first. If the other crew accidentally reveals your last node, you win.

### Clue rules (enforced by the server)
- One word: letters only, with one hyphen allowed (ICE-COLD).
- It can't be a word on the grid, a form of one (PENGUINS when PENGUIN is showing), or contain or be contained in one (SNOW when SNOWMAN is showing; applies to 4+ letters).
- Family deck: a small list of swear words and adult terms is blocked.
- The table rule the game can't enforce: **the Operator says nothing else**. No faces, no hints.

### Timers (host setting)
| Setting | Clue | Guessing | If time runs out |
|---|---|---|---|
| Off | — | — | — |
| Relaxed | 180 s | 180 s | Clue: turn skipped. Guessing: turn ends |
| Standard (default) | 120 s | 120 s | as above |
| Overclock | 60 s | 60 s | as above |

---

## 2. Modes

### Versus (4–10 players)
Two crews, VOLT (cyan) and FLARE (amber). Players pick a crew in the lobby; the host can shuffle. Each crew needs at least an Operator and one Runner.

### Co-op vs ICE (2–3 players, or chosen by the host)
One crew against the AI firewall, **ICE**. After every crew turn, ICE claims one of its own 8 nodes (Hard: 2 every second turn). Find your 9 nodes before ICE claims all 8. Revealing an ICE node helps ICE and ends your turn. The Zero Day still loses.

### Mole mode (Versus, 2+ Runners per crew)
At the start, one Runner in each crew is secretly the **Mole**; only their phone knows. The Mole tries to make their crew lose without getting caught. When the game ends, each crew votes on who their Mole was (45 seconds).
- **Caught:** the crew's vote names the Mole.
- **Mole wins:** their crew lost and they weren't caught.

### Match
Best of 3 (default) or a single game. Operators rotate every game, with volunteers first, unless the host locks them.

---

## 3. Word decks

| Deck | Words | Content |
|---|---|---|
| Family | 1,000 | Animals, food, places, objects, jobs, space, sport, fantasy, tech. Concrete and clean. |
| Adult 18+ | 1,000, none shared with Family | Grown-up life (mortgage, hangover, divorce), culture, crime and spy, tech, travel, drink and food, big ideas. No crude or sexual words. |
| Rare words | 66 of the Adult 1,000 | e.g. Petrichor, Zugzwang, Hiraeth, Codswallop, Kakistocracy. Each has a one-line definition. |

- **Adult gate:** the host must confirm everyone is 18+ before an Adult game starts.
- **Definitions:**
  - **TV:** cards with a definition show a "?" badge, and the definition appears in a strip under the grid while anyone pings that card.
  - **Phones:** long-press a word.
  - **Turning them off:** the host can switch them off.
- **No repeats:** words aren't reused within a session until the deck runs out.
- **No trademarks:** trademarked names (Lego, Lightsaber, Monopoly and similar) were removed.
- **Where they live:** `src/words.json`. The drafts and the trimming script are in `words/`.

---

## 4. Screens

### TV (1920×1080, scaled to any 16:9 screen)
| Screen | What it shows | Hero element |
|---|---|---|
| Title | Logo, tagline, Start a room / Training / Settings | Neon logo |
| Training | 11-step animated tutorial (script below) | Live demo grid |
| Lobby | Room code, QR, crews with avatars, settings chips, Start | Two crew columns |
| Game | Clue bar with timer ring; VOLT and FLARE side panels (emblem, nodes left, Operator, clue log); 5×5 grid with live pings, majority bar and breach pulse | The grid |
| Result | Winner bar, score, full key revealed, Mole results, Next / Lobby | Winner colour sweep |
| Pause | Waiting for a player (with QR) or the host's Resume | — |

### Phone (portrait, one thumb, Night and Daylight)
| Screen | What it does |
|---|---|
| Join | Letter keypad for the room code, codename, 24 avatars |
| Lobby | Pick crew, volunteer as Operator, host settings, start |
| Briefing | A role card at the start of each game (Operator / Runner / secret Mole) |
| Operator | Coloured key grid with shapes, legend, clue input, number pad 0–9 / ∞, TRANSMIT with live error messages |
| Runner | Word grid, current clue, votes needed, guesses left, END TURN, long-press definitions |
| Other crew's turn | Read-only grid plus 6 reaction buttons that float up on the TV |
| Mole vote | Tap the teammate you suspect |
| Result | Full key, Mole results, host Next / Lobby |
| Help (ⓘ) | Rules summary |
| Settings (⚙) | Theme, text size, board layout (Grid / List), vibration, sounds, pause (host), leave |

### Long words on phones
Words of 7+ letters break over two lines at a natural syllable (LUNCH-BOX, SPREAD-SHEET, OMNI-SHAMBLES). Every word in both decks has been checked to fit a 360-pixel-wide phone with no overflow. List layout gives 17 px text for anyone who needs it.

---

## 5. HALO, the narrator
HALO is the game's AI host: calm, dry and a little smug, with a British accent. She announces turns, reacts to every reveal, and runs Training. All 45 lines are listed in `ASSET-MANIFEST.md`. Until real voice files exist, the browser's built-in voice reads them and subtitles always show.

---

## 6. Tutorial script (Training)
Opened from the title screen or lobby on the TV. Use the on-screen buttons or the ← → keys. Each step plays HALO's line and animates the demo grid.

| # | Demo on screen | HALO says |
|---|---|---|
| 1 | Logo | "Welcome, operative. I am HALO. Let me show you how to crack the grid." |
| 2 | VOLT and FLARE crew panels | "There are two crews, VOLT and FLARE. Each crew has one Operator. Everyone else is a Runner." |
| 3 | 3×3 grid and owner legend | "The grid holds twenty-five words. Nine belong to the crew that starts, eight to the other crew. Seven are noise. One is the Zero Day." |
| 4 | Grid with the colour key shown | "Only the Operators can see which word is which. The secret key is on their phone." |
| 5 | Clue bar "OCEAN 2" | "The Operator sends one word and a number. Ocean, two, means two of your words link to ocean." |
| 6 | Two Runner pings on WHALE, majority bar filling | "Runners talk it through, then tap a word on their phones. When most of the crew agree, the node locks in." |
| 7 | WHALE flips to VOLT | "Hit one of your own words and you keep going. You get one more guess than the number." |
| 8 | ROCKET flips to noise | "Hit noise, or the other crew's word, and your turn is over." |
| 9 | DESERT flips to the red Zero Day | "Hit the Zero Day and your crew loses instantly. Avoid it at all costs." |
| 10 | Co-op and Mole cards | "Only two or three of you? Team up against ICE… Switch on Mole mode, and one Runner in each crew is secretly working for the other side." |
| 11 | "READY?" | "First crew to find all of their words wins. Good luck, operative." |

**On the phones as well:**
- **Role briefing:** each player gets a 3-tip briefing for their role at the start of every game (Operator or Runner, plus the secret Mole mission).
- **Rules sheet:** the ⓘ button opens the full rules sheet at any time.

---

## 7. Fairness and robustness
- **Operator key:** sent only to Operators. The TV and spectators never receive unrevealed owners during play, and this is tested.
- **Mole identity:** sent only to the Mole.
- **Majority vote:** counts only connected Runners, so a dropped phone doesn't block a vote.
- **Auto-pause:** after 5 seconds if the Operator drops during their clue, or every Runner drops during guessing. Play resumes with a 3-second countdown when they rejoin. Phones rejoin silently after a refresh.
- **Host:** the host passes to another player after 30 seconds away.
- **Server checks:** every message is checked (types, ranges, rate limit of 20 per second).

---

## 8. Accessibility
- **Colour-blind safe:** shapes on every revealed card and in every legend; colour is never the only signal.
- **TV settings:** text size (100/115/130 %), reduced motion, high contrast, subtitles, separate volumes for music, effects and voice.
- **Phone settings:** Night and Daylight themes, text size, List layout, vibration.
- **Touch targets:** at least 48 px; main buttons 56–68 px.
