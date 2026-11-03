'use strict';
// Seeded random numbers. Never use Math.random() in game logic.

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(a) {
  let s = a >>> 0;
  return function next() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRng(seedString) {
  const seed = String(seedString);
  const next = mulberry32(fnv1a(seed));
  const rng = {
    seed,
    next,
    /** Integer in [min, max] inclusive. */
    int(min, max) { return min + Math.floor(next() * (max - min + 1)); },
    /** Float in [min, max). */
    float(min, max) { return min + next() * (max - min); },
    pick(arr) { return arr[Math.floor(next() * arr.length)]; },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    },
    chance(p) { return next() < p; },
    /** A new independent RNG for a sub-generator. */
    child(suffix) { return makeRng(seed + '|' + suffix); }
  };
  return rng;
}

module.exports = { fnv1a, mulberry32, makeRng };
