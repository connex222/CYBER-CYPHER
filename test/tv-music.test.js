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

test('first visit attempts the actual title music before any user gesture',()=>{
 const boot = page.slice(page.lastIndexOf('  if (S.session) S.screen'));
 const render = boot.indexOf('  render();');
 const unlock = boot.indexOf('  AUDIO.unlock();',render);
 const music = boot.indexOf("  AUDIO.playMusic(S.session ? 'lobby' : 'title');",unlock);
 assert.ok(render >= 0 && unlock > render && music > unlock,'initial music attempt must follow rendering, with no user event');
 assert.match(page,/if \(ctx\.state === 'suspended'\) \{\s*var attempt = ctx\.resume\(\);/);
 assert.match(page,/attempt\.catch\(syncSoundPrompt\)/);
 assert.match(page,/get state\(\) \{ return ctx \? ctx\.state : 'unavailable'; \}/);
});
test('lobby and title have fullscreen and browser-safe sound controls',()=>{
 assert.match(page,/<button id="fullscreenToggle"[^>]*aria-label="Enter fullscreen">FULL SCREEN<\/button>/);
 assert.match(page,/<button id="soundUnlock"[^>]*hidden>ENABLE SOUND<\/button>/);
 assert.match(page,/#stage:not\(\[data-screen="title"\]\):not\(\[data-screen="lobby"\]\) #screenTools\{display:none\}/);
 assert.match(page,/document\.addEventListener\('fullscreenchange', syncFullscreenButton\)/);
 assert.match(page,/document\.documentElement\.requestFullscreen\(\)/);
 assert.match(page,/document\.exitFullscreen\(\)/);
 assert.ok(page.includes("$('#fullscreenToggle').addEventListener('click'"));
});
