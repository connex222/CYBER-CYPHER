'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { WORDS } = require('../src/config');
const packs = require('../src/packs');
const { createRoom, rooms } = require('../src/room');

const TV = { cc: { kind: 'tv' } };

function tmpDir(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-packs-'));
  for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), typeof body === 'string' ? body : JSON.stringify(body));
  return dir;
}
const makeWords = (n, prefix) => Array.from({ length: n }, (_, i) => prefix + String.fromCharCode(97 + (i % 26)) + String.fromCharCode(97 + (Math.floor(i / 26) % 26)) + 'zq');
const good = (id, extra) => Object.assign({ id, name: 'Test ' + id, rating: 'family', words: makeWords(80, 'Qx') }, extra);

test('the shipped packs load cleanly', () => {
  const r = packs.loadPacks(packs.PACK_DIR);
  assert.deepStrictEqual(r.problems, []);
  assert.ok(r.packs.length >= 1);
  for (const p of r.packs) assert.ok(p.words.length >= packs.LIMITS.MIN_WORDS, p.id);
});

test('shipped packs are big enough to play (at least 100 words, the bigger ones 175+)', () => {
  const by = Object.fromEntries(packs.loadPacks(packs.PACK_DIR).packs.map(p => [p.id, p.words.length]));
  for (const id of ['football-night', 'britain', 'future-2035']) assert.ok(by[id] >= 175, id + ' has ' + by[id]);
  assert.ok(by['christmas-2026'] >= 100);
});

test('shipped pack words never repeat a main-deck word', () => {
  const main = new Set([].concat(WORDS.family, WORDS.adult).map(w => w.toLowerCase()));
  for (const p of packs.loadPacks(packs.PACK_DIR).packs) for (const w of p.words) assert.ok(!main.has(w.toLowerCase()), p.id + ': ' + w);
});

test('a broken pack is skipped with a message and never throws', () => {
  const dir = tmpDir({
    'ok.json': good('ok-pack'),
    'notjson.json': '{ this is not json',
    'badid.json': good('Bad ID!'),
    'badrating.json': good('bad-rating', { rating: 'teen' }),
    'tiny.json': good('tiny-pack', { words: ['Alpha', 'Bravo'] }),
    'dupe.json': good('ok-pack')
  });
  const r = packs.loadPacks(dir);
  assert.deepStrictEqual(r.packs.map(p => p.id), ['ok-pack']);
  assert.ok(r.problems.length >= 5);
});

test('repeats, main-deck words, blocked words and non-words are dropped', () => {
  const words = makeWords(70, 'Zz').concat(['Zzaazq', WORDS.family[0], 'two words', 'Hi', 'B4d', 'sexy']);
  const r = packs.loadPacks(tmpDir({ 'p.json': good('mixed', { words }) }));
  const p = r.packs[0];
  assert.strictEqual(p.words.length, 70);
  assert.ok(!p.words.includes(WORDS.family[0]) && !p.words.includes('Sexy'));
});

test('an adult pack is only usable with the Adult deck', () => {
  const pk = { rating: 'adult' }, fam = { rating: 'family' };
  assert.ok(!packs.usableWith(pk, 'family'));
  assert.ok(packs.usableWith(pk, 'adult'));
  assert.ok(packs.usableWith(fam, 'family') && packs.usableWith(fam, 'adult'));
});

test('word pool: mixed adds pack words, only-mode uses pack words alone, unknown ids ignored', () => {
  const id = packs.catalogue()[0].id;
  const base = packs.wordPool('family', [], false);
  assert.strictEqual(base.length, WORDS.family.length);
  const mixed = packs.wordPool('family', [id], false);
  assert.ok(mixed.length > base.length);
  const only = packs.wordPool('family', [id], true);
  assert.strictEqual(only.length, packs.catalogue()[0].count);
  assert.ok(only.every(w => !WORDS.family.includes(w)));
  assert.strictEqual(packs.wordPool('family', ['nope'], true).length, base.length);   // nothing valid chosen: falls back to the main deck
});

test('host can switch packs on and off; settings stay clean', () => {
  const r = createRoom(0);
  const id = packs.catalogue()[0].id;
  r.hostCmd(TV, { cmd: 'settings', value: { packs: [id, id, 'nope', 7] } }, 0);
  assert.deepStrictEqual(r.settings.packs, [id]);
  r.hostCmd(TV, { cmd: 'settings', value: { packsOnly: true } }, 0);
  assert.strictEqual(r.settings.packsOnly, true);
  r.hostCmd(TV, { cmd: 'settings', value: { packs: [] } }, 0);
  assert.deepStrictEqual(r.settings.packs, []);
  assert.ok(r.roomView().packs.some(p => p.id === id));
  assert.ok(!JSON.stringify(r.roomView().packs).includes('"words"'), 'word lists must not be broadcast');
  rooms.delete(r.code);
});

test('a game started with "pack words only" draws every word from the pack', () => {
  const r = createRoom(0);
  const pack = packs.catalogue()[0], id = pack.id;
  r.hostCmd(TV, { cmd: 'settings', value: { packs: [id], packsOnly: true } }, 0);
  const words = r.pickWords({ shuffle: a => a.slice() });
  assert.strictEqual(words.length, 25);
  const poolSet = new Set(packs.wordPool('family', [id], true));
  assert.ok(words.every(w => poolSet.has(w)));
  rooms.delete(r.code);
});

test('settings sent in the lobby cannot smuggle in a pack the deck does not allow', () => {
  const r = createRoom(0);
  r.settings.deck = 'family';
  r.hostCmd(TV, { cmd: 'settings', value: { packs: ['definitely-not-a-pack'] } }, 0);
  assert.deepStrictEqual(r.settings.packs, []);
  rooms.delete(r.code);
});
