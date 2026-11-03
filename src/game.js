'use strict';
// One game of Cyber Cypher. Timers use game time (gt) that only advances while the room is not paused.
const { BOARD, T, TIMERS, WORDS, FAMILY_BLOCK, ALWAYS_BLOCK } = require('./config');

/** Normalise a word for clue checks. */
function norm(w) { return String(w).toLowerCase().replace(/[^a-z]/g, ''); }
function stem(w) {
  let s = norm(w);
  for (const suf of ['ings', 'ing', 'ers', 'er', 'ies', 'es', 'ed', 'ly', 's']) {
    if (s.endsWith(suf) && s.length - suf.length >= 3) { s = s.slice(0, -suf.length); break; }
  }
  return s;
}
/** Returns null if the clue is allowed, otherwise an error code. */
function checkClue(raw, boardWords, deck) {
  const word = String(raw || '').trim();
  if (!/^[A-Za-z]+(-[A-Za-z]+)?$/.test(word) || word.length < 2 || word.length > 20) return 'clueFormat';
  const n = norm(word);
  const block = deck === 'family' ? FAMILY_BLOCK : ALWAYS_BLOCK;
  if (block.includes(n)) return 'clueBlocked';
  for (const b of boardWords) {
    const bn = norm(b);
    if (n === bn) return 'clueOnBoard';
    if (stem(n) === stem(bn)) return 'clueFormOfBoard';
    if (n.length >= 4 && bn.length >= 4 && (n.includes(bn) || bn.includes(n))) return 'clueContainsBoard';
  }
  return null;
}

class Game {
  /**
   * opts: { rng, deck, words(25 strings), mode:'versus'|'coop', teams:{volt:{operator,runners[]}, flare:{...}},
   *         startTeam, timer, mole(bool), ice:'normal'|'hard', definitions(bool),
   *         emit(kind,data), changed(), ended(result), isConnected(pid) }
   */
  constructor(o) {
    this.o = o;
    this.rng = o.rng;
    this.emit = o.emit || (() => {});
    this.changed = o.changed || (() => {});
    this.ended = o.ended || (() => {});
    this.isConnected = o.isConnected || (() => true);
    this.mode = o.mode;
    this.deck = o.deck;
    this.teams = o.teams;
    this.timer = TIMERS[o.timer] || TIMERS.off;
    this.gt = 0;
    this.startTeam = o.startTeam;
    this.turnTeam = o.startTeam;
    this.cards = this.buildBoard(o.words);
    this.clue = null;
    this.guessesLeft = null;
    this.pings = {};          // playerId -> card index | 'pass'
    this.breach = null;       // { target, endsGt }
    this.holdUntilGt = 0;     // short beat after a reveal
    this.clueLog = [];
    this.iceTurns = 0;
    this.winner = null;
    this.reason = null;
    this.moles = {};          // team -> playerId
    if (o.mole && this.mode === 'versus') {
      for (const t of ['volt', 'flare']) {
        const r = this.teams[t].runners;
        if (r.length >= 2) this.moles[t] = this.rng.pick(r);
      }
    }
    this.moleVotes = {};      // voterId -> suspectId
    this.phase = null;
    this.startClue();
  }

  buildBoard(words) {
    const owners = [];
    if (this.mode === 'coop') {
      const c = BOARD.COOP;
      for (let i = 0; i < c.crew; i++) owners.push('volt');
      for (let i = 0; i < c.ice; i++) owners.push('ice');
      for (let i = 0; i < c.noise; i++) owners.push('noise');
      owners.push('zero');
    } else {
      const v = BOARD.VERSUS, other = this.startTeam === 'volt' ? 'flare' : 'volt';
      for (let i = 0; i < v.first; i++) owners.push(this.startTeam);
      for (let i = 0; i < v.second; i++) owners.push(other);
      for (let i = 0; i < v.noise; i++) owners.push('noise');
      owners.push('zero');
    }
    const shuffled = this.rng.shuffle(owners);
    return words.map((w, i) => {
      const def = this.deck === 'adult' && WORDS.definitions[w] ? WORDS.definitions[w] : null;
      return { word: w, owner: shuffled[i], revealed: false, by: null, def };
    });
  }

  // ---------- helpers ----------
  other(t) { return t === 'volt' ? 'flare' : 'volt'; }
  remaining(owner) { return this.cards.filter(c => c.owner === owner && !c.revealed).length; }
  activeRunners(team) { return this.teams[team].runners.filter(id => this.isConnected(id)); }
  isOperator(pid, team) { return this.teams[team] && this.teams[team].operator === pid; }
  teamOf(pid) { for (const t of ['volt', 'flare']) { const tm = this.teams[t]; if (!tm) continue; if (tm.operator === pid || tm.runners.includes(pid)) return t; } return null; }
  needed() { const n = this.activeRunners(this.turnTeam).length; return Math.floor(n / 2) + 1; }

  setPhase(p, seconds) {
    this.phase = p;
    this.deadlineGt = seconds ? this.gt + seconds * 1000 : null;
    this.changed();
  }

  startClue() {
    this.clue = null; this.guessesLeft = null; this.pings = {}; this.breach = null;
    this.setPhase('CLUE', this.timer.clue);
    this.emit('turn', { team: this.turnTeam });
  }

  // ---------- operator ----------
  giveClue(pid, word, number) {
    if (this.phase !== 'CLUE') return 'wrongPhase';
    if (!this.isOperator(pid, this.turnTeam)) return 'notOperator';
    const err = checkClue(word, this.cards.map(c => c.word), this.deck);
    if (err) return err;
    const n = number === 'inf' ? -1 : number;
    if (!(n === -1 || (Number.isInteger(n) && n >= 0 && n <= 9))) return 'badNumber';
    const clean = String(word).trim().toUpperCase();
    this.clue = { word: clean, number: n, team: this.turnTeam };
    this.guessesLeft = n >= 1 ? n + 1 : null; // 0 and ∞ allow unlimited guesses
    this.clueLog.push({ team: this.turnTeam, word: clean, number: n });
    this.emit('clue', { team: this.turnTeam, word: clean, number: n });
    this.setPhase('GUESS', this.timer.guess);
    return null;
  }

  // ---------- runners ----------
  ping(pid, target) {
    if (this.phase !== 'GUESS') return 'wrongPhase';
    if (!this.teams[this.turnTeam].runners.includes(pid)) return 'notYourTurn';
    if (this.gt < this.holdUntilGt) return 'wait';
    if (target !== 'pass') {
      if (!Number.isInteger(target) || target < 0 || target >= this.cards.length) return 'badValue';
      if (this.cards[target].revealed) return 'alreadyRevealed';
    }
    if (this.pings[pid] === target) delete this.pings[pid]; // tap again to un-ping
    else this.pings[pid] = target;
    this.emit('ping', { by: pid, target: this.pings[pid] === undefined ? null : this.pings[pid] });
    this.evaluatePings();
    this.changed();
    return null;
  }

  tally() {
    const counts = {};
    const active = new Set(this.activeRunners(this.turnTeam));
    for (const [pid, t] of Object.entries(this.pings)) if (active.has(pid)) counts[t] = (counts[t] || 0) + 1;
    return counts;
  }

  evaluatePings() {
    const counts = this.tally(), need = this.needed();
    let top = null;
    for (const [t, c] of Object.entries(counts)) if (c >= need) top = t === 'pass' ? 'pass' : Number(t);
    if (top === null) {
      if (this.breach) { this.emit('breachCancel', { target: this.breach.target }); this.breach = null; }
      return;
    }
    if (this.breach && this.breach.target === top) return;
    this.breach = { target: top, endsGt: this.gt + T.BREACH_MS };
    this.emit('breachStart', { target: top, ms: T.BREACH_MS });
  }

  resolveBreach() {
    const target = this.breach.target;
    this.breach = null;
    this.pings = {};
    if (target === 'pass') { this.emit('pass', { team: this.turnTeam }); this.endTurn('pass'); return; }
    this.reveal(target, this.turnTeam);
  }

  reveal(i, team) {
    const card = this.cards[i];
    card.revealed = true; card.by = team;
    this.emit('reveal', { index: i, owner: card.owner, team, word: card.word });
    this.holdUntilGt = this.gt + T.REVEAL_PAUSE_MS;
    if (card.owner === 'zero') { this.finish(this.mode === 'coop' ? 'ice' : this.other(team), 'zero'); return; }
    if (this.mode === 'coop') {
      if (this.remaining('volt') === 0) { this.finish('volt', 'allFound'); return; }
      if (this.remaining('ice') === 0) { this.finish('ice', 'iceComplete'); return; }
    } else {
      for (const t of ['volt', 'flare']) if (this.remaining(t) === 0) { this.finish(t, t === team ? 'allFound' : 'gifted'); return; }
    }
    if (card.owner === team) {
      if (this.guessesLeft !== null) {
        this.guessesLeft -= 1;
        if (this.guessesLeft <= 0) { this.endTurn('outOfGuesses'); return; }
      }
      this.changed();
      return;
    }
    this.endTurn(card.owner === 'noise' ? 'noise' : 'wrongTeam');
  }

  endTurn(reason) {
    if (this.phase === 'OVER') return;
    this.emit('turnEnd', { team: this.turnTeam, reason });
    this.pings = {}; this.breach = null;
    if (this.mode === 'coop') {
      this.iceTurns += 1;
      const claims = this.o.ice === 'hard' && this.iceTurns % 2 === 0 ? 2 : 1;
      for (let k = 0; k < claims; k++) {
        const left = this.cards.map((c, i) => (c.owner === 'ice' && !c.revealed ? i : -1)).filter(i => i >= 0);
        if (!left.length) break;
        const i = this.rng.pick(left);
        this.cards[i].revealed = true; this.cards[i].by = 'ice';
        this.emit('iceClaim', { index: i, word: this.cards[i].word });
        if (this.remaining('ice') === 0) { this.finish('ice', 'iceComplete'); return; }
      }
    } else this.turnTeam = this.other(this.turnTeam);
    this.startClue();
  }

  finish(winner, reason) {
    this.winner = winner; this.reason = reason;
    this.pings = {}; this.breach = null;
    for (const c of this.cards) c.revealedAtEnd = !c.revealed;
    this.emit('gameOver', { winner, reason });
    if (Object.keys(this.moles).length) this.setPhase('MOLEVOTE', T.MOLE_VOTE_MS / 1000);
    else { this.setPhase('OVER'); this.ended(this.result()); }
  }

  voteMole(pid, suspect) {
    if (this.phase !== 'MOLEVOTE') return 'wrongPhase';
    const team = this.teamOf(pid);
    if (!team || !this.moles[team]) return 'noMole';
    const tm = this.teams[team];
    if (!tm.runners.includes(suspect) || suspect === pid) return 'badValue';
    this.moleVotes[pid] = suspect;
    this.emit('moleVoted', { by: pid });
    const voters = [tm.operator].concat(tm.runners).filter(id => this.isConnected(id));
    const allVoted = ['volt', 'flare'].every(t => {
      if (!this.moles[t]) return true;
      const v = [this.teams[t].operator].concat(this.teams[t].runners).filter(id => this.isConnected(id));
      return v.every(id => this.moleVotes[id]);
    });
    if (allVoted && voters.length) this.closeMoleVote();
    this.changed();
    return null;
  }

  closeMoleVote() {
    if (this.phase !== 'MOLEVOTE') return;
    this.setPhase('OVER');
    this.ended(this.result());
  }

  result() {
    const moles = {};
    for (const t of Object.keys(this.moles)) {
      const tm = this.teams[t], votes = {};
      for (const id of [tm.operator].concat(tm.runners)) { const s = this.moleVotes[id]; if (s) votes[s] = (votes[s] || 0) + 1; }
      let top = null, best = 0, tie = false;
      for (const [s, c] of Object.entries(votes)) { if (c > best) { best = c; top = s; tie = false; } else if (c === best) tie = true; }
      const caught = !tie && top === this.moles[t];
      const moleWins = this.winner !== t && !caught;
      moles[t] = { mole: this.moles[t], caught, moleWins, votes };
    }
    return { winner: this.winner, reason: this.reason, mode: this.mode, moles, clueLog: this.clueLog.slice(),
      remaining: { volt: this.remaining('volt'), flare: this.remaining('flare'), ice: this.remaining('ice') } };
  }

  // ---------- loop ----------
  update(dt) {
    if (this.phase === 'OVER') return;
    this.gt += dt;
    if (this.phase === 'MOLEVOTE') { if (this.deadlineGt && this.gt >= this.deadlineGt) this.closeMoleVote(); return; }
    if (this.phase === 'GUESS') {
      if (this.breach && this.gt >= this.breach.endsGt) { this.resolveBreach(); return; }
      if (this.deadlineGt && this.gt >= this.deadlineGt && !this.breach) { this.emit('timeout', { phase: 'GUESS' }); this.endTurn('timeout'); return; }
    }
    if (this.phase === 'CLUE' && this.deadlineGt && this.gt >= this.deadlineGt) {
      this.emit('timeout', { phase: 'CLUE' });
      this.clueLog.push({ team: this.turnTeam, word: '—', number: 0, skipped: true });
      this.endTurn('clueTimeout');
    }
  }

  /** Re-check the majority when someone disconnects or reconnects. */
  rosterChanged() { if (this.phase === 'GUESS') { this.evaluatePings(); this.changed(); } }
}

module.exports = { Game, checkClue, stem, norm };
