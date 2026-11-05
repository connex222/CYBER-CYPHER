'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const tv = fs.readFileSync(path.join(__dirname, '../public/tv.html'), 'utf8');
const slice = (start, end) => {
  const a = tv.indexOf(start), b = tv.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, `Cannot locate ${start}`);
  return tv.slice(a, b);
};
const goSource = slice('  function go(w) {', '  function bind() {');
const gestureSource = slice("  addEventListener('pointerdown', function first() {", "  addEventListener('keydown', function (e) {");
function fixture() {
  const played=[], timers = new Map(), listeners = {}, S={screen:'title', session:null,lastKey:''};
  let nextId=1;
  const AUDIO={unlock:()=>{},sfx:()=>{},playMusic:m=>played.push(['music',m]),stopVoice:()=>played.push(['stopVoice']),say:v=>played.push(['voice',v])};
  const TUTORIAL_AUDIO={stop:()=>played.push(['stopTutorial']),play:(i,resume)=>played.push(['tutorial',i,resume])};
  const ctx={S,AUDIO,TUTORIAL_AUDIO,titleVoiceTimer:null,
    net:{send:()=>{}},render:()=>{},
    addEventListener:(k,fn)=>{listeners[k]=fn;},removeEventListener:()=>{},
    setTimeout:(fn,ms)=>{const id=nextId++;timers.set(id,{fn,ms});return id;},
    clearTimeout:(id)=>timers.delete(id)
  };
  vm.createContext(ctx);
  vm.runInContext(goSource + '\n' + gestureSource,ctx);
  return {ctx,played,S,click:(where)=>ctx.go(where),pointer:()=>listeners.pointerdown(),fireTimers:()=>{for(const [i,v] of [...timers]){timers.delete(i);v.fn();}},pending:()=>timers.size};
}
test('first click on TRAINING starts only one HALO tutorial voice, never a title voice',()=>{
 const f=fixture();f.pointer();f.click('tutorial');f.fireTimers();
 assert.equal(f.S.screen,'tutorial');
 assert.equal(f.pending(),0);
 assert.deepEqual(f.played.filter(x=>x[0]==='tutorial'),[['tutorial',0,false]]);
 assert.deepEqual(f.played.filter(x=>x[0]==='voice'),[]);
 assert.ok(f.played.some(x=>x[0]==='stopVoice'));
});
test('leaving title via START also prevents delayed title narration',()=>{
 const f=fixture();f.pointer();f.click('start');f.fireTimers();
 assert.equal(f.S.screen,'opening');
 assert.deepEqual(f.played.filter(x=>x[0]==='voice'),[]);
});
test('remaining on title still speaks title voice once',()=>{
 const f=fixture();f.pointer();f.fireTimers();
 assert.deepEqual(f.played.filter(x=>x[0]==='voice'),[['voice','vo_title']]);
});
test('already-started title voice is stopped when entering tutorial',()=>{
 const f=fixture();f.pointer();f.fireTimers();f.click('tutorial');
 assert.deepEqual(f.played.filter(x=>x[0]==='tutorial'),[['tutorial',0,false]]);
 const stop=f.played.findIndex(x=>x[0]==='stopVoice');
 const start=f.played.findIndex(x=>x[0]==='tutorial');
 assert.ok(stop>=0&&stop<start);
});
