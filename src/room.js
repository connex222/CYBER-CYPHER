'use strict';
const crypto = require('crypto');
const { WORDS, TEAMS, T, LIMITS, ROOM_LETTERS, DEFAULT_SETTINGS, TIMERS } = require('./config');
const { Game, checkClue } = require('./game');
const { makeRng } = require('./rng');
const views = require('./views');

const rooms = new Map();
const BOT_NAMES = ['Byte', 'Nyx', 'Patch', 'Vex', 'Glitch', 'Kilo', 'Rook', 'Juno', 'Echo', 'Zed'];
const BOT_CLUES = ['ALPHA', 'BRAVO', 'DELTA', 'GAMMA', 'OMEGA', 'SIGMA', 'KAPPA', 'THETA', 'ZULU', 'NOVA', 'PRISM', 'QUARTZ'];
const TV_ONLY = new Set(['react']);

function newId() { return crypto.randomUUID(); }
function code4() { let s = ''; const b = crypto.randomBytes(4); for (let i = 0; i < 4; i++) s += ROOM_LETTERS[b[i] % ROOM_LETTERS.length]; return s; }

class Room {
  constructor(code, now) {
    this.code = code; this.createdAt = now; this.lastActivity = now;
    this.tv = { socket: null, token: newId(), connected: false, goneSince: now };
    this.players = []; this.spectators = [];
    this.hostId = null;
    this.phase = 'LOBBY';             // LOBBY | GAME | MATCHEND
    this.settings = Object.assign({}, DEFAULT_SETTINGS);
    this.adultConfirmed = false;
    this.score = { volt: 0, flare: 0, crewWins: 0, crewLosses: 0 };
    this.gameNo = 0;
    this.opIndex = { volt: 0, flare: 0 };
    this.used = { family: new Set(), adult: new Set() };
    this.game = null;
    this.paused = null; this.resumeAt = null;
    this.lastTick = now; this.lastMeters = 0; this.dirty = true;
    this.lastResult = null;
  }

  // ---------- sending ----------
  sendTo(sock, t, d) { if (sock && sock.readyState === 1) { try { sock.send(JSON.stringify({ t, d })); } catch (e) { /* closed */ } } }
  sockets() { const o = []; if (this.tv.socket) o.push(this.tv.socket); for (const p of this.players) if (p.socket) o.push(p.socket); for (const s of this.spectators) if (s.socket) o.push(s.socket); return o; }
  broadcast(t, d) { for (const s of this.sockets()) this.sendTo(s, t, d); }
  event(kind, data) { const m = Object.assign({ kind }, data); if (TV_ONLY.has(kind)) return this.sendTo(this.tv.socket, 'event', m); this.broadcast('event', m); }
  error(sock, code, message) { this.sendTo(sock, 'error', { code, message: message || code }); }
  player(id) { return this.players.find(p => p.id === id) || null; }
  spectator(id) { return this.spectators.find(p => p.id === id) || null; }
  humans() { return this.players.filter(p => !p.bot); }
  connected(id) { const p = this.player(id); return !!p && (p.bot || p.connected); }

  effectiveMode() {
    if (this.settings.mode !== 'auto') return this.settings.mode;
    return this.players.length >= LIMITS.MIN_VERSUS ? 'versus' : 'coop';
  }

  roomView() {
    return {
      code: this.code, phase: this.phase, hostId: this.hostId, paused: this.paused, resumeAt: this.resumeAt,
      players: this.players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar, team: p.team, wantsOperator: !!p.wantsOperator, connected: p.bot || p.connected, bot: !!p.bot })),
      spectators: this.spectators.length, settings: this.settings, adultConfirmed: this.adultConfirmed,
      mode: this.effectiveMode(), score: this.score, gameNo: this.gameNo, lastResult: this.lastResult,
      timers: TIMERS, serverTime: Date.now()
    };
  }

  sync(now) {
    this.dirty = false;
    this.broadcast('room', this.roomView());
    this.broadcast('game', this.game ? views.publicGame(this.game, this.settings) : null);
    if (this.game) {
      for (const p of this.players) if (p.socket) this.sendTo(p.socket, 'secret', views.secretFor(this.game, p.id));
      this.sendMeters(now);
    }
  }
  sendMeters(now) { if (!this.game) return; this.lastMeters = now; this.broadcast('meters', { gt: this.game.gt, serverTime: now, paused: !!this.paused }); }

  // ---------- joining ----------
  attachTv(sock, now) {
    this.tv.socket = sock; this.tv.connected = true; this.tv.goneSince = null; sock.cc = { room: this.code, kind: 'tv' };
    this.lastActivity = now; if (this.paused && this.paused.reason === 'tv') this.beginResume(now); this.dirty = true;
  }
  join(sock, d, now) {
    this.lastActivity = now;
    const asSpec = d.spectator || this.players.length >= LIMITS.MAX_PLAYERS || this.phase === 'GAME';
    const id = newId(), token = newId(), name = d.name.trim().slice(0, 12) || 'Agent';
    if (asSpec) {
      if (this.spectators.length >= LIMITS.MAX_SPECTATORS) return this.error(sock, 'roomFull', 'This room is full.');
      this.spectators.push({ id, token, name, avatar: d.avatar, socket: sock, connected: true, lastReact: 0 });
      sock.cc = { room: this.code, kind: 'spectator', id };
      this.sendTo(sock, 'joined', { playerId: id, token, room: this.code, spectator: true });
    } else {
      const counts = { volt: this.players.filter(p => p.team === 'volt').length, flare: this.players.filter(p => p.team === 'flare').length };
      const team = counts.volt <= counts.flare ? 'volt' : 'flare';
      this.players.push({ id, token, name, avatar: d.avatar, team, wantsOperator: false, socket: sock, connected: true, goneSince: null, bot: false });
      sock.cc = { room: this.code, kind: 'player', id };
      if (!this.hostId || !this.player(this.hostId) || this.player(this.hostId).bot) this.hostId = id;
      this.sendTo(sock, 'joined', { playerId: id, token, room: this.code, spectator: false });
      this.event('playerJoined', { id, name });
    }
    this.dirty = true;
  }
  rejoin(sock, d, now) {
    const p = this.player(d.playerId) || this.spectator(d.playerId);
    if (!p || p.token !== d.token) return this.error(sock, 'badRejoin', 'That seat has gone. Join again with the room code.');
    if (p.socket && p.socket !== sock) { try { p.socket.cc = null; p.socket.close(4000, 'replaced'); } catch (e) { /* ignore */ } }
    p.socket = sock; p.connected = true; p.goneSince = null;
    sock.cc = { room: this.code, kind: this.spectator(p.id) ? 'spectator' : 'player', id: p.id };
    this.sendTo(sock, 'joined', { playerId: p.id, token: p.token, room: this.code, spectator: !!this.spectator(p.id) });
    this.lastActivity = now;
    if (this.game) this.game.rosterChanged();
    if (this.paused && this.paused.reason === 'disconnect' && !this.blockingAbsent()) this.beginResume(now);
    this.dirty = true;
  }
  disconnect(sock, now) {
    const v = sock.cc; if (!v) return;
    if (v.kind === 'tv') { this.tv.socket = null; this.tv.connected = false; this.tv.goneSince = now; if (this.liveGame() && !this.paused) this.pause('tv', null, now); }
    else { const p = this.player(v.id) || this.spectator(v.id); if (p && p.socket === sock) { p.socket = null; p.connected = false; p.goneSince = now; } if (this.game) this.game.rosterChanged(); }
    this.dirty = true;
  }

  liveGame() { return this.phase === 'GAME' && this.game && ['CLUE', 'GUESS', 'MOLEVOTE'].includes(this.game.phase); }
  /** The player whose absence stops play: the operator during a clue, or every runner during guessing. */
  blockingAbsent() {
    const g = this.game; if (!g || !this.liveGame()) return null;
    if (!this.tv.connected) return { reason: 'tv' };
    const team = g.teams[g.turnTeam];
    if (g.phase === 'CLUE' && !this.connected(team.operator)) return { id: team.operator };
    if (g.phase === 'GUESS' && team.runners.every(id => !this.connected(id))) return { id: team.runners[0] };
    return null;
  }

  // ---------- pause ----------
  pause(reason, by, now) { this.paused = { reason, by: by || null, at: now }; this.resumeAt = null; this.event('paused', { reason }); this.dirty = true; }
  beginResume(now) { if (!this.paused || this.blockingAbsent()) return; this.resumeAt = now + T.RESUME_COUNTDOWN_MS; this.event('resuming', { at: this.resumeAt }); this.dirty = true; }

  // ---------- starting a game ----------
  pickWords(rng) {
    const deck = this.settings.deck, list = WORDS[deck], used = this.used[deck];
    let pool = list.filter(w => !used.has(w));
    if (pool.length < 25) { used.clear(); pool = list.slice(); }
    const words = rng.shuffle(pool).slice(0, 25);
    words.forEach(w => used.add(w));
    return words;
  }

  buildTeams(mode) {
    const teams = {};
    const sides = mode === 'coop' ? ['volt'] : TEAMS;
    for (const t of sides) {
      const members = mode === 'coop' ? this.players.slice() : this.players.filter(p => p.team === t);
      const volunteers = members.filter(p => p.wantsOperator);
      let op;
      if (this.settings.lockOperators && volunteers.length) op = volunteers[0];
      else {
        const order = volunteers.length ? volunteers.concat(members.filter(p => !p.wantsOperator)) : members;
        op = order[this.opIndex[t] % order.length];
      }
      teams[t] = { operator: op.id, runners: members.filter(p => p !== op).map(p => p.id) };
    }
    return teams;
  }

  canStart() {
    const mode = this.effectiveMode(), n = this.players.length;
    if (n < LIMITS.MIN_PLAYERS) return 'You need at least 2 agents.';
    if (this.settings.deck === 'adult' && !this.adultConfirmed) return 'Confirm everyone is 18+ to use the Adult deck.';
    if (mode === 'versus') {
      for (const t of TEAMS) if (this.players.filter(p => p.team === t).length < 2) return 'Each crew needs at least 2 agents (an Operator and a Runner).';
    }
    return null;
  }

  startGame(now) {
    const mode = this.effectiveMode();
    const rng = makeRng(crypto.randomBytes(8).toString('hex'));
    const startTeam = mode === 'coop' ? 'volt' : rng.pick(TEAMS);
    this.gameNo += 1;
    this.game = new Game({
      rng, deck: this.settings.deck, words: this.pickWords(rng), mode, teams: this.buildTeams(mode), startTeam,
      timer: this.settings.timer, mole: this.settings.mole, ice: this.settings.ice,
      emit: (k, d) => this.event(k, d), changed: () => { this.dirty = true; }, ended: r => this.onGameOver(r),
      isConnected: id => this.connected(id)
    });
    this.phase = 'GAME'; this.paused = null; this.resumeAt = null; this.lastTick = now; this.lastResult = null;
    for (const p of this.players) if (p.bot) p.botNext = 0;
    this.dirty = true;
  }

  onGameOver(r) {
    if (r.mode === 'coop') { if (r.winner === 'volt') this.score.crewWins++; else this.score.crewLosses++; }
    else if (r.winner) this.score[r.winner]++;
    if (!this.settings.lockOperators) { this.opIndex.volt++; this.opIndex.flare++; }
    const need = this.settings.match === 3 ? 2 : 1;
    r.matchOver = r.mode === 'coop' || this.score.volt >= need || this.score.flare >= need;
    this.lastResult = r;
    this.dirty = true;
  }

  // ---------- host & lobby commands ----------
  isHost(sock) { return sock.cc && sock.cc.kind === 'player' && sock.cc.id === this.hostId; }
  isTv(sock) { return sock.cc && sock.cc.kind === 'tv'; }

  hostCmd(sock, d, now) {
    if (!(this.isHost(sock) || this.isTv(sock))) return this.error(sock, 'notHost', 'Only the host can do that.');
    switch (d.cmd) {
      case 'start': {
        if (this.phase !== 'LOBBY') return this.error(sock, 'wrongPhase');
        const why = this.canStart(); if (why) return this.error(sock, 'cannotStart', why);
        this.score = { volt: 0, flare: 0, crewWins: 0, crewLosses: 0 }; this.gameNo = 0;
        this.startGame(now); break;
      }
      case 'next':
        if (!this.game || this.game.phase !== 'OVER') return this.error(sock, 'wrongPhase');
        if (this.lastResult && this.lastResult.matchOver && this.effectiveMode() === 'versus') this.score = { volt: 0, flare: 0, crewWins: this.score.crewWins, crewLosses: this.score.crewLosses };
        { const why = this.canStart(); if (why) return this.error(sock, 'cannotStart', why); }
        this.startGame(now); break;
      case 'lobby': this.game = null; this.phase = 'LOBBY'; this.paused = null; this.resumeAt = null; this.lastResult = null; break;
      case 'settings': {
        if (this.phase !== 'LOBBY') return this.error(sock, 'wrongPhase');
        const v = d.value || {}, s = this.settings;
        if (['family', 'adult'].includes(v.deck)) { s.deck = v.deck; if (v.deck === 'family') this.adultConfirmed = false; }
        if (['auto', 'versus', 'coop'].includes(v.mode)) s.mode = v.mode;
        if (typeof v.mole === 'boolean') s.mole = v.mole;
        if (TIMERS[v.timer]) s.timer = v.timer;
        if (v.match === 1 || v.match === 3) s.match = v.match;
        if (typeof v.definitions === 'boolean') s.definitions = v.definitions;
        if (['normal', 'hard'].includes(v.ice)) s.ice = v.ice;
        if (typeof v.lockOperators === 'boolean') s.lockOperators = v.lockOperators;
        if (v.adultConfirm === true && s.deck === 'adult') this.adultConfirmed = true;
        break;
      }
      case 'shuffleTeams': {
        if (this.phase !== 'LOBBY') return this.error(sock, 'wrongPhase');
        const rng = makeRng(crypto.randomBytes(4).toString('hex'));
        rng.shuffle(this.players.slice()).forEach((p, i) => { p.team = i % 2 === 0 ? 'volt' : 'flare'; });
        break;
      }
      case 'kick': {
        if (this.phase === 'GAME') return this.error(sock, 'wrongPhase', 'You can\u2019t remove agents mid-game.');
        const p = this.player(d.target); if (!p || p.id === this.hostId) return this.error(sock, 'badTarget');
        if (p.socket) { this.sendTo(p.socket, 'kicked', {}); p.socket.cc = null; try { p.socket.close(4001, 'kicked'); } catch (e) { /* ignore */ } }
        this.players = this.players.filter(x => x !== p); break;
      }
      case 'fillBots': {
        if (!process.env.BOTS || process.env.BOTS === '0') return this.error(sock, 'botsOff', 'Bots are switched off on this server.');
        if (this.phase !== 'LOBBY') return this.error(sock, 'wrongPhase');
        if (this.players.length >= LIMITS.MAX_PLAYERS) return this.error(sock, 'roomFull');
        const n = this.players.filter(p => p.bot).length;
        const counts = { volt: this.players.filter(p => p.team === 'volt').length, flare: this.players.filter(p => p.team === 'flare').length };
        this.players.push({ id: newId(), token: newId(), name: BOT_NAMES[n % BOT_NAMES.length], avatar: (n * 7) % 24, team: counts.volt <= counts.flare ? 'volt' : 'flare', wantsOperator: false, socket: null, connected: true, bot: true });
        break;
      }
      case 'pause': if (this.liveGame() && !this.paused) this.pause('host', sock.cc.id || 'tv', now); break;
      case 'resume': if (this.paused && !this.blockingAbsent()) this.beginResume(now); break;
      default: return this.error(sock, 'unknownCmd');
    }
    this.dirty = true;
  }

  handle(sock, type, d, now) {
    this.lastActivity = now;
    const v = sock.cc;
    if (type === 'host') return this.hostCmd(sock, d, now);
    if (type === 'react') {
      const who = v && (this.player(v.id) || this.spectator(v.id)); if (!who) return;
      if (now - (who.lastReact || 0) < 1500) return; who.lastReact = now;
      return this.event('react', { kind: d.kind, name: who.name });
    }
    if (!v || v.kind !== 'player') return this.error(sock, 'notPlayer');
    const p = this.player(v.id);
    if (type === 'team') {
      if (this.phase !== 'LOBBY') return this.error(sock, 'wrongPhase');
      if (d.team) p.team = d.team; if (typeof d.operator === 'boolean') p.wantsOperator = d.operator;
      this.dirty = true; return;
    }
    if (!this.game || this.phase !== 'GAME') return this.error(sock, 'noGame');
    if (this.paused) return this.error(sock, 'paused', 'The game is paused.');
    let err = null;
    if (type === 'clue') err = this.game.giveClue(v.id, d.word, d.number);
    else if (type === 'ping') err = this.game.ping(v.id, d.target);
    else if (type === 'moleVote') err = this.game.voteMole(v.id, d.suspect);
    if (err) this.error(sock, err);
  }

  // ---------- loop ----------
  tick(now) {
    const dt = Math.min(250, now - this.lastTick) * (Number(process.env.CC_SPEED) || 1);
    this.lastTick = now;
    const host = this.player(this.hostId);
    if (!host || host.bot || (!host.connected && host.goneSince && now - host.goneSince > T.HOST_HANDOVER_MS)) {
      const next = this.humans().find(p => p.connected);
      if (next && next.id !== this.hostId) { this.hostId = next.id; this.event('newHost', { id: next.id }); this.dirty = true; }
    }
    if (this.liveGame() && !this.paused) {
      const absent = this.blockingAbsent();
      if (absent) {
        const p = absent.id && this.player(absent.id);
        if (absent.reason === 'tv' || (p && p.goneSince && now - p.goneSince > T.AUTO_PAUSE_MS)) this.pause(absent.reason || 'disconnect', absent.id, now);
      }
    }
    if (this.paused && this.resumeAt && now >= this.resumeAt) { this.paused = null; this.resumeAt = null; this.event('resumed', {}); this.dirty = true; }
    if (this.paused && !this.resumeAt && this.paused.reason !== 'host' && !this.blockingAbsent()) this.beginResume(now);
    if (this.game && !this.paused) { this.game.update(dt); this.runBots(); }
    if (this.dirty) this.sync(now); else if (this.game && now - this.lastMeters >= 500) this.sendMeters(now);
  }

  // ---------- bots (BOTS=1, for solo testing) ----------
  runBots() {
    const g = this.game; if (!g || !['CLUE', 'GUESS', 'MOLEVOTE'].includes(g.phase)) return;
    for (const p of this.players) {
      if (!p.bot) continue;
      if (g.gt < (p.botNext || 0)) continue;
      p.botNext = g.gt + 900 + Math.floor(g.rng.next() * 1800);
      const team = g.teamOf(p.id);
      if (g.phase === 'MOLEVOTE') {
        if (g.moles[team] && !g.moleVotes[p.id]) { const opts = g.teams[team].runners.filter(id => id !== p.id); if (opts.length) g.voteMole(p.id, g.rng.pick(opts)); }
        continue;
      }
      if (team !== g.turnTeam) continue;
      if (g.phase === 'CLUE' && g.isOperator(p.id, team)) {
        const own = g.cards.filter(c => c.owner === team && !c.revealed).length;
        const words = g.cards.map(c => c.word);
        const word = g.rng.shuffle(BOT_CLUES).find(w => !checkClue(w, words, g.deck)) || 'NOVA';
        g.giveClue(p.id, word, Math.min(2, own));
      } else if (g.phase === 'GUESS' && g.teams[team].runners.includes(p.id) && g.gt >= g.holdUntilGt && !g.breach) {
        const isMole = g.moles[team] === p.id;
        const open = g.cards.map((c, i) => (!c.revealed ? i : -1)).filter(i => i >= 0);
        const mine = open.filter(i => g.cards[i].owner === team);
        // Follow a teammate's existing ping if there is one, otherwise choose.
        const existing = Object.entries(g.pings).find(([id, t]) => id !== p.id && g.teams[team].runners.includes(id));
        let target;
        if (existing && !isMole && g.rng.chance(0.8)) target = existing[1];
        else if (isMole) target = g.rng.pick(open.filter(i => g.cards[i].owner !== team && g.cards[i].owner !== 'zero')) ?? open[0];
        else if (g.guessesLeft !== null && g.guessesLeft <= 1 && g.rng.chance(0.5)) target = 'pass';
        else target = g.rng.chance(0.78) && mine.length ? g.rng.pick(mine) : g.rng.pick(open.filter(i => g.cards[i].owner !== 'zero' || g.rng.chance(0.15)));
        if (g.pings[p.id] !== target) g.ping(p.id, target);
      }
    }
  }

  expired(now) {
    if (this.tv.goneSince && now - this.tv.goneSince > LIMITS.ROOM_TV_GONE_MS) return true;
    return now - this.lastActivity > LIMITS.ROOM_IDLE_MS;
  }
}

function createRoom(now) { let c; do { c = code4(); } while (rooms.has(c)); const r = new Room(c, now); rooms.set(c, r); return r; }

module.exports = { Room, rooms, createRoom };
