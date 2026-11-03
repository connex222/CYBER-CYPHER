'use strict';
// CYBER CYPHER — all tuning numbers.
const WORDS = require('./words.json');

const TEAMS = ['volt', 'flare'];
const TEAM_INFO = {
  volt:  { name: 'VOLT',  colour: '#22E4FF' },
  flare: { name: 'FLARE', colour: '#FFB020' },
  ice:   { name: 'ICE',   colour: '#B48CFF' }
};

// Seconds for the Operator's clue and the Runners' guesses. 0 = no limit.
const TIMERS = {
  off:       { clue: 0,   guess: 0 },
  relaxed:   { clue: 180, guess: 180 },
  standard:  { clue: 120, guess: 120 },
  overclock: { clue: 60,  guess: 60 }
};

const BOARD = {
  SIZE: 25,
  VERSUS: { first: 9, second: 8, noise: 7, zero: 1 },
  COOP:   { crew: 9, ice: 8, noise: 7, zero: 1 }
};

const T = {
  BREACH_MS: 1600,        // a node locks in after the team majority holds for this long
  REVEAL_PAUSE_MS: 1400,  // beat after a reveal before the next action
  MOLE_VOTE_MS: 45000,
  AUTO_PAUSE_MS: 5000,
  RESUME_COUNTDOWN_MS: 3000,
  HOST_HANDOVER_MS: 30000
};

const LIMITS = { MAX_PLAYERS: 10, MAX_SPECTATORS: 12, MAX_MSG_BYTES: 4096, MSG_PER_SEC: 20, BURSTS_BEFORE_KICK: 3,
  ROOM_IDLE_MS: 3 * 3600 * 1000, ROOM_TV_GONE_MS: 30 * 60 * 1000, MIN_VERSUS: 4, MIN_PLAYERS: 2 };

const ROOM_LETTERS = 'BCDFGHJKLMNPQRSTVWXZ';

// Clue words that are blocked in the Family deck (kept short and generic).
const FAMILY_BLOCK = ['fuck', 'shit', 'cunt', 'bitch', 'bastard', 'dick', 'cock', 'wank', 'twat', 'piss', 'arse', 'arsehole', 'bollocks',
  'prick', 'slut', 'whore', 'tits', 'boob', 'boobs', 'penis', 'vagina', 'sex', 'sexy', 'porn', 'nude', 'naked', 'drunk', 'booze', 'damn', 'hell', 'crap', 'bloody'];
const ALWAYS_BLOCK = ['cunt', 'whore', 'slut', 'porn'];

const DEFAULT_SETTINGS = { deck: 'family', mode: 'auto', mole: false, timer: 'standard', match: 3, definitions: true, ice: 'normal', lockOperators: false };

module.exports = { WORDS, TEAMS, TEAM_INFO, TIMERS, BOARD, T, LIMITS, ROOM_LETTERS, FAMILY_BLOCK, ALWAYS_BLOCK, DEFAULT_SETTINGS };
