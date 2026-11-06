'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const tv=fs.readFileSync(path.join(__dirname,'../public/tv.html'),'utf8');
function part(begin,end) {
 const a=tv.indexOf(begin),b=tv.indexOf(end,a+begin.length);
 assert.ok(a>=0 && b>a, 'missing source segment '+begin); return tv.slice(a,b);
}
const titleSource=part('  function titleHtml() {','  function settingsHtml() {');
const goSource=part('  function go(w) {','  function bind() {');
const lobbySource=part('  function lobbyHtml() {','  // ----- game board -----');
function context(session) {
 const S={screen:'title',session,room:null,tut:0,lastKey:''};
 const actions=[];
 const AUDIO={unlock:()=>{},sfx:()=>{},playMusic:x=>actions.push(['music',x]),stopVoice:()=>{}};
 const TUTORIAL_AUDIO={stop:()=>{},play:()=>{}};
 const ctx={S,AUDIO,TUTORIAL_AUDIO,net:{send:(type,data)=>actions.push(['net',type,data])},
  titleVoiceTimer:null,clearTimeout:()=>{},render:()=>actions.push(['render'])};
 vm.createContext(ctx);
 vm.runInContext(titleSource+'\n'+goSource,ctx);
 return {ctx,S,actions};
}
test('premium first page has live controls and main logo',()=>{
 const f=context(null),h=f.ctx.titleHtml();
 assert.match(h,/v3-logo-word cyber/);assert.match(h,/v3-logo-word cypher/);
 for(const command of ['start','tutorial','settings'])assert.ok(h.includes('data-go="'+command+'"'));
 assert.match(h,/START A ROOM/);assert.ok(!h.includes('<img src="/assets/visual3/fake-qr'));
});
test('existing room shows RETURN TO ROOM, not create',()=>{
 const f=context({room:'ABCD',token:'opaque'});
 assert.match(f.ctx.titleHtml(),/RETURN TO ROOM/);
 f.ctx.go('start');assert.equal(f.S.screen,'room');
 assert.equal(f.actions.filter(x=>x[0]==='net').length,0);
 assert.equal(f.S.session.room,'ABCD');
});
test('new game still creates only one real room',()=>{
 const f=context(null);f.ctx.go('start');assert.equal(f.S.screen,'opening');
 assert.deepEqual(JSON.parse(JSON.stringify(f.actions.filter(x=>x[0]==='net'))),[['net','tvCreate',{}]]);
});
test('QR lobby has working Back to Lobby action and keeps QR encoder',()=>{
 assert.match(lobbySource,/class=\\"qr\\"/);assert.match(lobbySource,/qrSvg\(url\)/);
 assert.match(lobbySource,/BACK TO LOBBY/);
 assert.match(lobbySource,/data-go=\\"title\\"/);
 assert.match(tv,/scene\.querySelectorAll\('\[data-go\]'\)/);
 const f=context({room:'ABCD',token:'opaque'});f.S.screen='room';f.ctx.go('title');
 assert.equal(f.S.screen,'title');
 assert.equal(f.S.session.room,'ABCD');
 assert.match(f.ctx.titleHtml(),/RETURN TO ROOM/);
});
test('visual3 is linked, and previous HALO overlap fix is retained',()=>{
 assert.match(tv,/<link rel="stylesheet" href="\/visual3\.css\?v=1">/);
 assert.match(tv,/titleVoiceTimer/);assert.match(tv,/TUTORIAL_AUDIO\.play\(0, false\)/);
});
