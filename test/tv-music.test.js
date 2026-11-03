'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const page = fs.readFileSync(path.join(__dirname,'../public/tv.html'),'utf8');

test('title screen retains title music',()=>{
 assert.match(page,/if \(sc === 'title' && AUDIO\.unlocked\) AUDIO\.playMusic\('title'\)/);
});
test('second screen and room lobby use the same lobby music',()=>{
 assert.match(page,/if \(sc === 'opening' \|\| sc === 'lobby'\) AUDIO\.playMusic\('lobby'\)/);
});
test('start-room click changes the music immediately before waiting for a code',()=>{
 const go = page.match(/function go\(w\) \{([\s\S]*?)\n  \}\n  function bind\(/);
 assert.ok(go,'Missing navigation handler');
 const start = go[1].indexOf("if (w === 'start')");
 const music = go[1].indexOf("AUDIO.playMusic('lobby')",start);
 const create = go[1].indexOf("net.send('tvCreate'",start);
 assert.ok(start >=0 && music > start && create > music,'Lobby music must start before the room-creation request');
});
test('actual existing lobby track is used and the game track is unaffected',()=>{
 assert.match(page,/load\('mus_' \+ mode\)/);
 assert.match(page,/load\('mus_game_1'\), load\('mus_game_2'\), load\('mus_game_3'\)/);
 assert.match(page,/AUDIO\.playMusic\('game'\)/);
});
