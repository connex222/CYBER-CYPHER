'use strict';
// Browser WebSocket upgrades must come from the hosted game or an explicitly
// approved origin. The browser sends Origin independently of the Host header.
const GAME_ORIGIN = 'https://cyber-cypher-j2ry.onrender.com';

function isAllowedOrigin(origin, env = process.env) {
  // Non-browser clients generally omit Origin. Keep them usable for local
  // acceptance tools, but never accept origin-less upgrades in production.
  if (origin === undefined) return env.NODE_ENV !== 'production';
  if (typeof origin !== 'string') return false;

  let parsed;
  try { parsed = new URL(origin); } catch { return false; }
  // Origin is a scheme + authority only. Reject paths, query strings,
  // fragments, opaque origins ("null"), credentials and malformed values.
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) return false;

  if (origin === GAME_ORIGIN) return true;
  if (parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
      parsed.port !== '') return true;

  return (env.ALLOWED_ORIGINS || '')
    .split(',')
    .some(entry => entry.trim() === origin);
}

module.exports = { isAllowedOrigin };
