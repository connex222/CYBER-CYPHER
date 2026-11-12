'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Game } = require('../src/game');
const { makeRng } = require('../src/rng');
const { WORDS } = require('../src/config');
const { publicGame, secretFor } = require('../src/views');

const tv = fs.readFileSync(path.join(__dirname, '../public/tv.html'), 'utf8');
const phone = fs.readFileSync(path.join(__dirname, '../public/play.html'), 'utf8');
const makeGame = (opts = {}) => new Game({
  rng: makeRng('cyber-cypher-play-qa'),
  mode: 'versus', deck: 'family', timer: 'off', startTeam: 'volt',
  words: WORDS.family.slice(0, 25),
  teams: { volt: { operator: 'vo', runners: ['vr1', 'vr2'] }, flare: { operator: 'fo', runners: ['fr1'] } },
  ...opts
});
const advance = (g, ms) => { for (let i = 0; i < ms; i += 50) g.update(50); };

test('UI keeps exactly 25 grid cells and no extra game modes', () => {
  assert.match(tv, /\.grid\{[^}]*grid-template-columns:repeat\(5,1fr\)/s);
  assert.match(phone, /\.board\{[^}]*grid-template-columns:repeat\(5,1fr\)/s);
  for (const g of [makeGame(), makeGame({ mode:'coop',teams: {volt:{operator:'vo',runners:['vr1']}} })]) {
    assert.equal(g.cards.length, 25);
    assert.equal(g.cards.filter(c => c.owner === 'zero').length, 1);
  }
});

test('TV QR Back to Lobby preserves the room and title has one start choice', () => {
  assert.match(tv, /BACK TO LOBBY<\/button>/);
  assert.match(tv, /data-go="title" aria-label="Back to main lobby without closing this room"/);
  assert.match(tv, /if \(S\.session\) \{ S\.screen = 'room'; \}/);
  const title = tv.slice(tv.indexOf('  function titleHtml() {'), tv.indexOf('  function settingsHtml() {'));
  assert.equal((title.match(/data-go="start"/g) || []).length, 1);
});

test('HALO training has explicit play, pause, stop, replay and mute; live VO is gated', () => {
  for (const control of ['play','pause','stop','replay','mute']) assert.match(tv,new RegExp('data-tut-'+control));
  assert.match(tv, /S\.screen === 'tutorial'\)\) return;/);
  assert.match(tv, /player\.muted = muted \|\| settings\.voice <= 0/);
  assert.match(tv, /if \(ticket !== sequence\) return;/);
});

test('Operator key is read-only, refreshed per game; Runner votes show threshold and risk', () => {
  assert.match(phone, /nodeHtml\(c, i, \{ key: s\.key, disabled: true \}\)/);
  assert.match(phone, /S\.secret = null; S\.clue/);
  assert.match(phone, /crew pings of/);
  assert.match(phone, /aria-pressed/);
  assert.match(phone, /risk-hint/);
  assert.match(phone, /Zero Day loses instantly/);
});

test('all ownership outcomes preserve turn rules and reveal semantics', () => {
  for (const owner of ['volt','flare','noise','zero']) {
    const g = makeGame();
    const target = g.cards.findIndex(c => c.owner === owner);
    assert.ok(target >= 0);
    assert.equal(g.giveClue('vo', 'ZZTOP', 3), null);
    g.ping('vr1',target); g.ping('vr2',target); advance(g, 1700);
    assert.equal(g.cards[target].revealed,true,owner);
    assert.equal(g.cards[target].by,'volt');
    const pub = publicGame(g,{});
    assert.equal(pub.cards[target].owner,owner);
    if (owner === 'zero') { assert.equal(g.phase,'OVER'); assert.equal(g.winner,'flare'); }
    else if (owner === 'volt') assert.equal(g.turnTeam,'volt');
    else assert.equal(g.turnTeam,'flare');
  }
});

test('withdrawn majority cancels the breach and does not reveal a card', () => {
  const g=makeGame(), target=g.cards.findIndex(c=>c.owner==='volt');
  assert.equal(g.giveClue('vo','ZZTOP',1),null);
  g.ping('vr1',target);g.ping('vr2',target);
  advance(g,600);
  g.ping('vr2',target);
  assert.equal(g.breach,null);
  advance(g,1800);
  assert.equal(g.cards[target].revealed,false);
});

test('secret key is never broadcast in the public view or to Runners', () => {
  const g = makeGame({mole:true});
  const pub = publicGame(g,{});
  assert.equal(pub.cards.length,25);
  assert.ok(pub.cards.every(c=>!Object.hasOwn(c,'owner')));
  assert.equal(secretFor(g,'vo').key.length,25);
  assert.equal(secretFor(g,'vr1').key,undefined);
  assert.equal(secretFor(g,'fr1').key,undefined);
  assert.equal(pub.moles,undefined);
});

test('numeric, zero and infinity clues keep the established guess caps', () => {
  for (const number of [0, 1, 9, 'inf']) {
    const g = makeGame();
    assert.equal(g.giveClue('vo', 'ZZTOP', number), null);
    assert.equal(g.guessesLeft, number === 'inf' || number === 0 ? null : number + 1);
  }
});

test('a tied Mole accusation never convicts an agent', () => {
  const g = makeGame({mole:true, teams:{
    volt:{operator:'vo',runners:['vr1','vr2']},
    flare:{operator:'fo',runners:['fr1','fr2']}
  }});
  const zero = g.cards.findIndex(c => c.owner === 'zero');
  g.reveal(zero,'volt');
  assert.equal(g.phase,'MOLEVOTE');
  assert.equal(g.voteMole('vo','vr1'),null);
  assert.equal(g.voteMole('vr1','vr2'),null);
  assert.equal(g.result().moles.volt.caught,false);
});
