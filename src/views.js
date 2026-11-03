'use strict';
// What each client may see. The TV and spectators get the public view only.
// The key (who owns each unrevealed node) goes ONLY to Operators; mole identity ONLY to the mole.

function publicGame(g, settings) {
  const v = {};
  v.phase = g.phase; v.mode = g.mode; v.deck = g.deck; v.gt = g.gt; v.deadlineGt = g.deadlineGt;
  v.turnTeam = g.turnTeam; v.startTeam = g.startTeam;
  v.clue = g.clue ? Object.assign({}, g.clue) : null;
  v.guessesLeft = g.guessesLeft;
  const over = g.phase === 'OVER' || g.phase === 'MOLEVOTE';
  v.cards = g.cards.map(c => {
    const o = { word: c.word, revealed: c.revealed };
    if (c.revealed) { o.owner = c.owner; o.by = c.by; }
    else if (over) { o.owner = c.owner; o.unrevealed = true; }   // full key shown once the game is over
    if (c.def && settings.definitions !== false) o.def = c.def;
    return o;
  });
  const tally = {};
  const active = new Set(g.activeRunners(g.turnTeam));
  for (const [pid, t] of Object.entries(g.pings)) if (active.has(pid)) { (tally[t] = tally[t] || []).push(pid); }
  v.pings = g.phase === 'GUESS' ? tally : {};
  v.needed = g.phase === 'GUESS' ? g.needed() : 0;
  v.breach = g.breach ? { target: g.breach.target, endsGt: g.breach.endsGt } : null;
  v.holdUntilGt = g.holdUntilGt;
  v.clueLog = g.clueLog.slice(-16);
  v.remaining = { volt: g.remaining('volt'), flare: g.remaining('flare'), ice: g.remaining('ice') };
  v.teams = {};
  for (const t of Object.keys(g.teams)) v.teams[t] = { operator: g.teams[t].operator, runners: g.teams[t].runners.slice() };
  v.moleMode = Object.keys(g.moles).length > 0;
  v.iceTurns = g.iceTurns;
  if (over) {
    v.winner = g.winner; v.reason = g.reason;
    v.moleVoted = Object.keys(g.moleVotes);
    if (g.phase === 'OVER') v.result = g.result();
  }
  return v;
}

function secretFor(g, pid) {
  const s = { team: g.teamOf(pid) };
  const team = s.team;
  if (team && g.teams[team].operator === pid) {
    s.operator = true;
    s.key = g.cards.map(c => c.owner);
  }
  if (team && g.moles[team] === pid) s.mole = true;
  if (g.phase === 'MOLEVOTE' && team && g.moles[team]) {
    s.moleVote = { candidates: g.teams[team].runners.filter(id => id !== pid), voted: g.moleVotes[pid] || null };
  }
  return s;
}

module.exports = { publicGame, secretFor };
