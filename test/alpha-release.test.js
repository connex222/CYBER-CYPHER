'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { BOARD, LIMITS } = require('../src/config');
const root = path.join(__dirname, '..');

test('Alpha contract: 5 by 5 board contains exactly 25 nodes', () => {
  assert.equal(BOARD.SIZE, 5 * 5);
  assert.deepEqual(BOARD.VERSUS, { first: 9, second: 8, noise: 7, zero: 1 });
  assert.deepEqual(BOARD.COOP, { crew: 9, ice: 8, noise: 7, zero: 1 });
  for (const group of [BOARD.VERSUS, BOARD.COOP]) {
    assert.equal(Object.values(group).reduce((a, b) => a + b, 0), BOARD.SIZE);
  }
});

test('Alpha contract: full play range is 2–10 players', () => {
  assert.equal(LIMITS.MIN_PLAYERS, 2);
  assert.equal(LIMITS.MAX_PLAYERS, 10);
  assert.equal(LIMITS.MIN_VERSUS, 4);
});

test('Alpha contract: TV and phone grids both use five columns', () => {
  const tv = fs.readFileSync(path.join(root, 'public/tv.html'), 'utf8');
  const phone = fs.readFileSync(path.join(root, 'public/play.html'), 'utf8');
  assert.match(tv, /\.grid\s*\{[^}]*grid-template-columns:\s*repeat\(5\s*,\s*1fr\)/s);
  assert.match(tv, /\.grid\s*\{[^}]*grid-template-rows:\s*repeat\(5\s*,\s*1fr\)/s);
  assert.match(phone, /\.board\s*\{[^}]*grid-template-columns:\s*repeat\(5\s*,\s*1fr\)/s);
});

test('Alpha contract: release version matches npm lockfile', () => {
  const pkg = require('../package.json');
  const lock = require('../package-lock.json');
  assert.equal(pkg.version, lock.version);
  assert.equal(pkg.version, lock.packages[''].version);
  assert.match(pkg.version, /-alpha(?:\.\d+)?$/);
});
