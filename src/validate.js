'use strict';
// One schema per client message. Unknown fields or wrong types are rejected.
const { LIMITS } = require('./config');
const str = (min, max, re) => v => typeof v === 'string' && v.length >= min && v.length <= max && (!re || re.test(v));
const int = (min, max) => v => Number.isInteger(v) && v >= min && v <= max;
const oneOf = l => v => l.includes(v);
const obj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const bool = v => typeof v === 'boolean';
const opt = f => v => v === undefined || f(v);
const ROOM = str(4, 4, /^[A-Z]{4}$/);

const SCHEMAS = {
  tvCreate: {}, tvRejoin: { room: ROOM, token: str(8, 64) },
  join: { room: ROOM, name: str(1, 12, /^[A-Za-z0-9 ]+$/), avatar: int(0, 23), spectator: opt(bool) },
  rejoin: { room: ROOM, playerId: str(8, 64), token: str(8, 64) },
  ping: { target: v => v === 'pass' || int(0, 24)(v) },
  host: { cmd: oneOf(['start', 'next', 'lobby', 'settings', 'shuffleTeams', 'kick', 'fillBots', 'pause', 'resume']), target: opt(str(1, 64)), value: opt(obj) },
  team: { team: opt(oneOf(['volt', 'flare'])), operator: opt(bool) },
  clue: { word: str(1, 24), number: v => v === 'inf' || int(0, 9)(v) },
  moleVote: { suspect: str(8, 64) },
  react: { kind: oneOf(['wow', 'laugh', 'fire', 'facepalm', 'clap', 'shock']) },
  clock: { c: v => typeof v === 'number' && isFinite(v) }
};

function parse(raw) {
  const text = raw.toString();
  if (Buffer.byteLength(text) > LIMITS.MAX_MSG_BYTES) return { ok: false, error: 'tooBig', fatal: true };
  let m; try { m = JSON.parse(text); } catch (e) { return { ok: false, error: 'badJson' }; }
  if (!obj(m) || typeof m.t !== 'string') return { ok: false, error: 'badEnvelope' };
  if (m.t === 'ping' && obj(m.d) && 'c' in m.d) m.t = 'clock';  // clock sync shares the name "ping" with the client helper
  const schema = SCHEMAS[m.t]; if (!schema) return { ok: false, error: 'unknownType' };
  const d = m.d === undefined ? {} : m.d; if (!obj(d)) return { ok: false, error: 'badData' };
  for (const k of Object.keys(d)) if (!(k in schema)) return { ok: false, error: 'unknownField:' + k };
  for (const [k, f] of Object.entries(schema)) if (!f(d[k])) return { ok: false, error: 'badField:' + k };
  return { ok: true, type: m.t, data: d };
}

function makeLimiter() {
  let start = 0, count = 0, bursts = 0;
  return now => {
    if (now - start >= 1000) { start = now; count = 0; }
    count++;
    if (count > LIMITS.MSG_PER_SEC) { if (count === LIMITS.MSG_PER_SEC + 1) bursts++; return { allowed: false, kick: bursts >= LIMITS.BURSTS_BEFORE_KICK }; }
    return { allowed: true, kick: false };
  };
}
module.exports = { parse, makeLimiter };
