'use strict';
// Real WebSocket integration acceptance for isolated local test rooms, not public active games.
const assert=require('node:assert/strict');
const WebSocket=require('ws');
const base=process.env.CC_ACCEPTANCE_HTTP||'http://127.0.0.1:3123';
const wsUrl=base.replace(/^http/,'ws');
const TIMEOUT=Number(process.env.CC_ACCEPTANCE_TIMEOUT||9000);
const clients=new Set();
let count=0;
const ok=s=>console.log('PASS '+String(++count).padStart(2,'0')+' '+s);
class Client {
 constructor(name){
  this.name=name;this.messages=[];this.waiters=[];this.ws=new WebSocket(wsUrl);clients.add(this);
  this.ws.on('message',raw=>{
   let msg;try{msg=JSON.parse(raw)}catch(e){this.error=e;return}
   const index=this.messages.push(msg)-1;
   for(const w of [...this.waiters])if(index>=w.from&&msg.t===w.type&&w.pred(msg.d)){
    clearTimeout(w.timer);this.waiters=this.waiters.filter(x=>x!==w);w.resolve(msg.d);
   }
  });
  this.ws.on('error',e=>{this.error=e});
  this.open=new Promise((resolve,reject)=>{this.ws.once('open',resolve);this.ws.once('error',reject)});
 }
 mark(){return this.messages.length}
 send(t,d={}){assert.equal(this.ws.readyState,WebSocket.OPEN,this.name+' not connected');this.ws.send(JSON.stringify({t,d}))}
 wait(type,pred=()=>true,from=0,timeout=TIMEOUT){
  for(let i=from;i<this.messages.length;i++){const m=this.messages[i];if(m.t===type&&pred(m.d))return Promise.resolve(m.d)}
  return new Promise((resolve,reject)=>{
   const w={type,pred,from,resolve,timer:null};
   w.timer=setTimeout(()=>{this.waiters=this.waiters.filter(x=>x!==w);reject(Error('Timed out '+this.name+':'+type+'; seen '+this.messages.slice(-7).map(x=>x.t).join(',')))},timeout);
   this.waiters.push(w);
  });
 }
 count(t){return this.messages.filter(m=>m.t===t).length}
 close(){return new Promise(resolve=>{
  if(this.ws.readyState===WebSocket.CLOSED)return resolve();
  const timeout=setTimeout(()=>{this.ws.terminate();resolve()},1200);
  this.ws.once('close',()=>{clearTimeout(timeout);resolve()});
  this.ws.close();
 })}
}
async function get(path,mime){
 const res=await fetch(base+path,{redirect:'manual',signal:AbortSignal.timeout(TIMEOUT)});
 assert.equal(res.status,200,path+' HTTP '+res.status);
 if(mime)assert.match(res.headers.get('content-type')||'',mime,path+' wrong content type');
 assert.ok((await res.arrayBuffer()).byteLength>0,'empty '+path);
}
function publicOnly(g){
 assert.equal(g.cards.length,25);
 assert.ok(g.cards.filter(c=>!c.revealed).every(c=>!Object.hasOwn(c,'owner')),'Secret board key leaked');
 assert.ok(!Object.hasOwn(g,'moles'),'Moles leaked');
}
async function main(){
 await get('/healthz',/text\/plain/);ok('/healthz responds');
 await get('/',/text\/html/);await get('/play',/text\/html/);ok('TV and phone routes respond');
 await get('/assets/ui/logo.webp',/image\/webp/);await get('/audio/vo_tut_1.mp3',/audio\/mpeg/);
 ok('Local art and repaired tutorial audio are served');
 const tv=new Client('TV');await tv.open;let m=tv.mark();tv.send('tvCreate');
 const created=await tv.wait('tvCreated',()=>true,m);
 const room=created.room;assert.match(room,/^[BCDFGHJKLMNPQRSTVWXZ]{4}$/);assert.ok(created.token);ok('TV creates four-letter room');
 const redirect=await fetch(base+'/'+room,{redirect:'manual'});
 assert.equal(redirect.status,302);assert.equal(redirect.headers.get('location'),'/play.html?room='+room);ok('Room QR destination routes to phone join');
 const a=new Client('Phone A'),b=new Client('Phone B'),spec=new Client('Spectator');
 await Promise.all([a.open,b.open,spec.open]);
 m=a.mark();a.send('join',{room,name:'Alpha',avatar:0});const joinedA=await a.wait('joined',()=>true,m);
 m=b.mark();b.send('join',{room,name:'Beta',avatar:1});const joinedB=await b.wait('joined',()=>true,m);
 assert.notEqual(joinedA.playerId,joinedB.playerId);assert.ok(joinedA.token&&joinedB.token);
 const lobby=await tv.wait('room',v=>v.players.length===2);
 assert.equal(lobby.hostId,joinedA.playerId);assert.equal(lobby.mode,'coop');ok('Two distinct phones join with correct host and co-op mode');
 m=spec.mark();spec.send('join',{room,name:'Watcher',avatar:2,spectator:true});
 assert.equal((await spec.wait('joined',()=>true,m)).spectator,true);
 m=spec.mark();spec.send('host',{cmd:'settings',value:{mode:'versus'}});
 await spec.wait('error',v=>v.code==='notHost',m);ok('Spectator cannot change host settings');
 await a.close();const ar=new Client('Phone A rejoined');await ar.open;
 m=ar.mark();ar.send('rejoin',{room,playerId:joinedA.playerId,token:joinedA.token});
 const rejoin=await ar.wait('joined',v=>v.playerId===joinedA.playerId,m);
 assert.equal(rejoin.token,joinedA.token);
 const lobby2=await tv.wait('room',v=>v.players.length===2&&v.players.some(p=>p.id===joinedA.playerId&&p.connected));
 assert.equal(lobby2.hostId,joinedA.playerId);ok('Phone reconnect keeps original seat and host');
 m=tv.mark();tv.send('host',{cmd:'start'});
 const initial=await tv.wait('game',g=>g?.phase==='CLUE',m);assert.equal(initial.mode,'coop');publicOnly(initial);
 ok('Game starts with public data on TV');
 const secret=await ar.wait('secret',s=>s.operator&&Array.isArray(s.key));
 assert.equal(secret.key.length,25);
 const bSecret=await b.wait('secret',s=>s.team==='volt'&&!s.operator);
 assert.equal(bSecret.key,undefined);assert.equal(bSecret.mole,undefined);
 await spec.wait('game',g=>g?.phase==='CLUE');assert.equal(spec.count('secret'),0);assert.equal(tv.count('secret'),0);
 ok('Only Operator receives the unrevealed 25-node key');
 m=b.mark();b.send('clue',{word:'ZZTOP',number:1});await b.wait('error',e=>e.code==='notOperator',m);
 m=spec.mark();spec.send('ping',{target:0});await spec.wait('error',e=>e.code==='notPlayer',m);
 ok('Non-operators and spectators cannot take privileged actions');
 m=tv.mark();ar.send('clue',{word:'ZZTOP',number:1});const guess=await tv.wait('game',g=>g?.phase==='GUESS',m);publicOnly(guess);
 m=tv.mark();b.send('ping',{target:'pass'});const next=await tv.wait('game',g=>g?.phase==='CLUE'&&g.iceTurns>=1,m,15000);
 publicOnly(next);ok('Real phone vote passes; turn advances; ICE claims node');
 const late=new Client('Late Joiner');await late.open;m=late.mark();late.send('join',{room,name:'Late',avatar:7});
 const lateJoin=await late.wait('joined',()=>true,m);assert.equal(lateJoin.spectator,true);
 await late.wait('game',g=>g?.phase==='CLUE');assert.equal(late.count('secret'),0);
 ok('Late joiner cannot join active game or obtain secrets');
 const pauseFrom=ar.mark();await tv.close();
 await ar.wait('room',v=>v?.paused?.reason==='tv',pauseFrom,7000);ok('TV disconnect automatically pauses match');
 const tv2=new Client('TV rejoined');await tv2.open;
 m=tv2.mark();tv2.send('tvRejoin',{room,token:created.token});
 const tvReturned=await tv2.wait('tvCreated',v=>v.room===room&&v.rejoined,m);
 assert.equal(tvReturned.token,created.token);
 await tv2.wait('room',v=>v?.paused===null,m,10000);assert.equal(tv2.count('secret'),0);
 ok('TV reconnect restores match without leaked secrets');
 await ar.close();const restored=new Client('Operator returned');await restored.open;
 const roomFrom=tv2.mark();m=restored.mark();restored.send('rejoin',{room,playerId:joinedA.playerId,token:joinedA.token});
 await restored.wait('joined',v=>v.playerId===joinedA.playerId,m);
 const key=await restored.wait('secret',v=>v.operator&&Array.isArray(v.key),m);assert.equal(key.key.length,25);
 const latest=await tv2.wait('room',v=>v.players.length===2&&v.players.some(p=>p.id===joinedA.playerId&&p.connected),roomFrom);
 assert.equal(latest.players.length,2);ok('Operator returns mid-game with private key and same seat');
 for(const c of clients)assert.equal(c.error,undefined,c.name+' WebSocket error');
 ok('No protocol connection errors');
}
(async()=>{
 try{await main();console.log('LIVE ACCEPTANCE PASS: '+count+' checks using independent real WebSocket clients')}
 catch(e){console.error('LIVE ACCEPTANCE FAIL:',e.stack||String(e));process.exitCode=1}
 finally{await Promise.allSettled([...clients].map(c=>c.close()))}
})();
