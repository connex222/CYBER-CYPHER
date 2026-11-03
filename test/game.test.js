'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { WORDS, FAMILY_BLOCK } = require('../src/config');
const { Game, checkClue } = require('../src/game');
const { makeRng } = require('../src/rng');
const views = require('../src/views');
const { Room } = require('../src/room');

function mkGame(extra) {
  const rng = makeRng('T' + Math.random());
  const words = rng.shuffle(WORDS.family).slice(0, 25);
  return new Game(Object.assign({ rng, deck: 'family', words, mode: 'versus', startTeam: 'volt', timer: 'off',
    teams: { volt: { operator: 'v0', runners: ['v1', 'v2', 'v3'] }, flare: { operator: 'f0', runners: ['f1', 'f2'] } } }, extra || {}));
}
const idx = (g, owner) => g.cards.findIndex(c => c.owner === owner && !c.revealed);
function run(g, ms) { for (let t = 0; t < ms; t += 50) g.update(50); }
function majority(g, target) { run(g, 1500); const r = g.teams[g.turnTeam].runners; for (let i = 0; i < g.needed(); i++) g.ping(r[i], target); run(g, 1700); }

test('word decks: 1,000 each, unique, single words, no overlap, family deck clean', () => {
  for (const d of ['family', 'adult']) {
    const l = WORDS[d]; assert.strictEqual(l.length, 1000); assert.strictEqual(new Set(l.map(w => w.toLowerCase())).size, 1000);
    for (const w of l) assert.match(w, /^[A-Z][a-z]{1,11}$/, w);
  }
  const fam = new Set(WORDS.family.map(w => w.toLowerCase()));
  assert.ok(!WORDS.adult.some(w => fam.has(w.toLowerCase())));
  assert.ok(!WORDS.family.some(w => FAMILY_BLOCK.includes(w.toLowerCase())));
  for (const k of Object.keys(WORDS.definitions)) assert.ok(WORDS.adult.includes(k), k);
});

test('board composition: versus 9/8/7/1 and co-op 9/8/7/1', () => {
  const g = mkGame(); const c = o => g.cards.filter(x => x.owner === o).length;
  assert.deepStrictEqual([c('volt'), c('flare'), c('noise'), c('zero')], [9, 8, 7, 1]);
  const k = mkGame({ mode: 'coop', teams: { volt: { operator: 'v0', runners: ['v1'] } } }); const d = o => k.cards.filter(x => x.owner === o).length;
  assert.deepStrictEqual([d('volt'), d('ice'), d('noise'), d('zero')], [9, 8, 7, 1]);
});

test('clue rules', () => {
  const b = ['Penguin', 'Rocket', 'Snowman', 'Lamp', 'Swimming'];
  assert.strictEqual(checkClue('Penguin', b, 'family'), 'clueOnBoard');
  assert.strictEqual(checkClue('penguins', b, 'family'), 'clueFormOfBoard');
  assert.strictEqual(checkClue('snow', b, 'family'), 'clueContainsBoard');
  assert.strictEqual(checkClue('two words', b, 'family'), 'clueFormat');
  assert.strictEqual(checkClue('bloody', b, 'family'), 'clueBlocked');
  assert.strictEqual(checkClue('bloody', b, 'adult'), null);
  assert.strictEqual(checkClue('Antarctic', b, 'family'), null);
  assert.strictEqual(checkClue('ice-cold', b, 'family'), null);
});

test('only the turn Operator can give a clue; guess limit is number + 1', () => {
  const g = mkGame();
  assert.strictEqual(g.giveClue('f0', 'ANIMAL', 2), 'notOperator');
  assert.strictEqual(g.giveClue('v0', 'ZZTOP', 2), null);
  assert.strictEqual(g.phase, 'GUESS'); assert.strictEqual(g.guessesLeft, 3);
  majority(g, idx(g, 'volt')); assert.strictEqual(g.turnTeam, 'volt'); assert.strictEqual(g.guessesLeft, 2);
  majority(g, idx(g, 'volt')); majority(g, idx(g, 'volt'));
  assert.strictEqual(g.turnTeam, 'flare'); assert.strictEqual(g.phase, 'CLUE');
});

test('majority is needed: one of three runners cannot lock a node alone', () => {
  const g = mkGame(); g.giveClue('v0', 'ZZTOP', 1);
  g.ping('v1', idx(g, 'volt')); run(g, 2000);
  assert.ok(g.cards.every(c => !c.revealed));
  g.ping('v2', g.pings.v1); run(g, 1700);
  assert.strictEqual(g.cards.filter(c => c.revealed).length, 1);
});

test('noise and enemy nodes end the turn; Zero Day loses the game', () => {
  let g = mkGame(); g.giveClue('v0', 'ZZTOP', 3); majority(g, idx(g, 'noise')); assert.strictEqual(g.turnTeam, 'flare');
  g = mkGame(); g.giveClue('v0', 'ZZTOP', 3); majority(g, idx(g, 'flare')); assert.strictEqual(g.turnTeam, 'flare');
  g = mkGame(); g.giveClue('v0', 'ZZTOP', 3); majority(g, idx(g, 'zero')); assert.strictEqual(g.winner, 'flare'); assert.strictEqual(g.reason, 'zero');
});

test('pass ends the turn; timers end turns', () => {
  let g = mkGame(); g.giveClue('v0', 'ZZTOP', 1); majority(g, 'pass'); assert.strictEqual(g.turnTeam, 'flare');
  g = mkGame({ timer: 'overclock' }); run(g, 61000); assert.strictEqual(g.turnTeam, 'flare');
});

test('co-op: ICE claims a node every turn and wins if it finishes first', () => {
  const g = mkGame({ mode: 'coop', teams: { volt: { operator: 'v0', runners: ['v1'] } } });
  for (let t = 0; t < 8 && g.phase !== 'OVER'; t++) { g.giveClue('v0', 'ZZTOP', 1); majority(g, 'pass'); }
  assert.strictEqual(g.winner, 'ice'); assert.strictEqual(g.reason, 'iceComplete');
});

test('secrets: the TV never sees unrevealed owners during play; only Operators get the key', () => {
  const g = mkGame({ mole: true });
  const pub = views.publicGame(g, {});
  assert.ok(pub.cards.every(c => c.owner === undefined));
  assert.ok(views.secretFor(g, 'v0').key); assert.ok(!views.secretFor(g, 'v1').key);
  const moles = Object.values(g.moles); assert.strictEqual(moles.length, 2);
  const others = ['v1', 'v2', 'v3', 'f1', 'f2'].filter(id => !moles.includes(id));
  for (const id of others) assert.ok(!views.secretFor(g, id).mole);
  assert.ok(!JSON.stringify(pub).includes(moles[0]) || pub.teams.volt.runners.includes(moles[0]));
  assert.ok(!('moles' in pub));
});

test('mole vote: caught mole when the team names them', () => {
  const g = mkGame({ mole: true }); g.giveClue('v0', 'ZZTOP', 3); majority(g, idx(g, 'zero'));
  assert.strictEqual(g.phase, 'MOLEVOTE');
  const vm = g.moles.volt, fm = g.moles.flare;
  for (const id of ['v0', 'v1', 'v2', 'v3']) if (id !== vm) g.voteMole(id, vm); g.voteMole(vm, ['v1', 'v2', 'v3'].find(x => x !== vm));
  for (const id of ['f0', 'f1', 'f2']) g.voteMole(id, ['f1', 'f2'].find(x => x !== id));
  assert.strictEqual(g.phase, 'OVER');
  const r = g.result(); assert.strictEqual(r.moles.volt.caught, true);
});

test('full bot games finish for both modes and both decks', () => {
  for (const [n, deck] of [[2, 'family'], [3, 'adult'], [4, 'family'], [6, 'adult'], [10, 'family']]) {
    process.env.BOTS = '1';
    const r = new Room('TEST', 0);
    for (let i = 0; i < n; i++) r.hostCmd({ cc: { kind: 'tv' } }, { cmd: 'fillBots' }, 0);
    r.hostCmd({ cc: { kind: 'tv' } }, { cmd: 'settings', value: { deck, adultConfirm: true, timer: 'off', mole: n >= 6 } }, 0);
    r.hostCmd({ cc: { kind: 'tv' } }, { cmd: 'start' }, 0);
    assert.ok(r.game, 'started ' + n);
    for (let t = 0; t < 20 * 60 * 1000 && r.game.phase !== 'OVER'; t += 50) { r.game.update(50); r.runBots(); }
    assert.strictEqual(r.game.phase, 'OVER', `players ${n} ended in ${r.game.phase}`);
    assert.ok(r.lastResult && r.lastResult.winner);
  }
});
