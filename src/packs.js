'use strict';
// CYBER CYPHER — word packs.
// A pack is one JSON file in the /packs folder. The server reads every pack at start-up, checks it,
// and offers the good ones in the lobby. A broken pack is skipped with a warning; it can never stop the game.
const fs = require('fs');
const path = require('path');
const { WORDS, FAMILY_BLOCK, ALWAYS_BLOCK } = require('./config');

const PACK_DIR = path.join(__dirname, '..', 'packs');
const LIMITS = { MIN_WORDS: 60, MAX_WORDS: 600, MIN_LEN: 3, MAX_LEN: 12, MAX_SELECTED: 12 };
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const WORD_RE = /^[A-Za-z]+$/;
const RATINGS = ['family', 'adult'];

const tidy = w => { const t = String(w).trim(); return t.charAt(0).toUpperCase() + t.slice(1); };

/**
 * Reads and checks every *.json file in `dir`.
 * Returns { packs: [{ id, name, description, rating, words }], problems: [string] }.
 */
function loadPacks(dir, base) {
  const baseWords = base || WORDS;
  const taken = new Set([].concat(baseWords.family, baseWords.adult).map(w => w.toLowerCase()));
  const packs = [], problems = [], seen = new Set();
  let files = [];
  try { files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.json')).sort(); } catch (e) { return { packs, problems: ['No packs folder found.'] }; }

  for (const file of files) {
    const bad = msg => problems.push(file + ': ' + msg);
    let raw;
    try { raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')); } catch (e) { bad('not valid JSON (' + e.message + ')'); continue; }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) { bad('must be a JSON object'); continue; }
    if (typeof raw.id !== 'string' || !ID_RE.test(raw.id) || raw.id.length > 40) { bad('"id" must be lower-case letters, numbers and hyphens, e.g. "christmas-2026"'); continue; }
    if (seen.has(raw.id)) { bad('duplicate id "' + raw.id + '"'); continue; }
    if (typeof raw.name !== 'string' || raw.name.trim().length < 1 || raw.name.length > 30) { bad('"name" must be 1 to 30 characters'); continue; }
    if (!RATINGS.includes(raw.rating)) { bad('"rating" must be "family" or "adult"'); continue; }
    if (!Array.isArray(raw.words)) { bad('"words" must be a list'); continue; }
    const description = typeof raw.description === 'string' ? raw.description.slice(0, 90) : '';

    const block = raw.rating === 'family' ? FAMILY_BLOCK : ALWAYS_BLOCK;
    const mine = new Set(), words = [];
    let dropped = 0;
    for (const w of raw.words) {
      if (typeof w !== 'string') { dropped++; continue; }
      const t = tidy(w), key = t.toLowerCase();
      if (!WORD_RE.test(t) || t.length < LIMITS.MIN_LEN || t.length > LIMITS.MAX_LEN) { dropped++; continue; }
      if (block.includes(key)) { dropped++; continue; }
      if (taken.has(key) || mine.has(key)) { dropped++; continue; }   // already in a main deck, or repeated in this pack
      mine.add(key); words.push(t);
    }
    if (dropped) problems.push(file + ': ' + dropped + ' word(s) ignored (repeats, words already in the main decks, blocked words, or not a single word of 3 to 12 letters).');
    if (words.length < LIMITS.MIN_WORDS) { bad('needs at least ' + LIMITS.MIN_WORDS + ' usable words, has ' + words.length + '. Pack skipped.'); continue; }
    if (words.length > LIMITS.MAX_WORDS) words.length = LIMITS.MAX_WORDS;
    seen.add(raw.id);
    packs.push({ id: raw.id, name: raw.name.trim(), description, rating: raw.rating, words });
  }
  return { packs, problems };
}

const loaded = loadPacks(PACK_DIR);
for (const p of loaded.problems) console.warn('[cc] pack warning:', p);
const BY_ID = new Map(loaded.packs.map(p => [p.id, p]));

/** A family pack works with either deck; an adult pack works only with the Adult deck. */
const usableWith = (pack, deck) => pack.rating === 'family' || deck === 'adult';

/** What the lobby needs to draw the Packs section (no word lists, so it stays small). */
const catalogue = () => loaded.packs.map(p => ({ id: p.id, name: p.name, description: p.description, rating: p.rating, count: p.words.length }));

/** Keeps only known pack ids that suit the deck, without repeats. */
function cleanSelection(ids, deck) {
  if (!Array.isArray(ids)) return [];
  const out = [];
  for (const id of ids) {
    if (typeof id !== 'string' || out.includes(id)) continue;
    const p = BY_ID.get(id);
    if (p && usableWith(p, deck)) out.push(id);
    if (out.length >= LIMITS.MAX_SELECTED) break;
  }
  return out;
}

/** The words a game can draw from: the main deck, plus (or instead of it) the chosen packs. */
function wordPool(deck, ids, packsOnly) {
  const chosen = cleanSelection(ids, deck).map(id => BY_ID.get(id));
  const seen = new Set(), pool = [];
  const add = w => { const k = w.toLowerCase(); if (!seen.has(k)) { seen.add(k); pool.push(w); } };
  if (!(packsOnly && chosen.length)) WORDS[deck].forEach(add);
  chosen.forEach(p => p.words.forEach(add));
  return pool;
}

module.exports = { loadPacks, catalogue, cleanSelection, wordPool, usableWith, PACK_DIR, LIMITS };
