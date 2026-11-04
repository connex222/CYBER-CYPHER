'use strict';
// Stage 25: real independent WebSocket-client matrix against an isolated local server.
// Never point CC_ACCEPTANCE_HTTP at a public service or an active game night.
const assert = require('node:assert/strict');
const WebSocket = require('ws');
const base = process.env.CC_ACCEPTANCE_HTTP || 'http://127.0.0.1:3123';
assert.match(base, /^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/, 'Stage 25 may only test a local service');
const wsUrl = base.replace(/^http/, 'ws');
const active = new Set();
let checks = 0;
class Client {
  constructor(name) {
    this.name = name; this.messages = []; this.waiters = []; this.errors = [];
    this.ws = new WebSocket(wsUrl); active.add(this);
    this.open = new Promise((resolve, reject) => {
      this.ws.once('open', resolve); this.ws.once('error', reject);
    });
    this.ws.on('error', e => this.errors.push(e.message));
    this.ws.on('message', buf => {
      let msg;
      try { msg = JSON.parse(buf); } catch (e) { this.errors.push('bad JSON'); return; }
      const at = this.messages.push(msg) - 1;
      for (const w of [...this.waiters]) if (at >= w.from && msg.t === w.type && w.pred(msg.d)) {
        clearTimeout(w.timer); this.waiters.splice(this.waiters.indexOf(w), 1); w.resolve(msg.d);
      }
    });
  }
  mark() { return this.messages.length; }
  send(t, d={}) { assert.equal(this.ws.readyState, WebSocket.OPEN); this.ws.send(JSON.stringify({t,d})); }
  wait(type, pred=()=>true, from=0, timeout=12000) {
    for (let i=from;i<this.messages.length;i++) {
      const m=this.messages[i]; if (m.t===type && pred(m.d)) return Promise.resolve(m.d);
    }
    return new Promise((resolve,reject) => {
      const w={type,pred,from,resolve,timer:null};
      w.timer=setTimeout(()=>{this.waiters.splice(this.waiters.indexOf(w),1);reject(Error(this.name+': timed out '+type));},timeout);
      this.waiters.push(w);
    });
  }
  async close() {
    if (this.ws.readyState === WebSocket.CLOSED) return;
    await new Promise(resolve => {
      const timer=setTimeout(()=>{this.ws.terminate();resolve();},1200);
      this.ws.once('close',()=>{clearTimeout(timer);resolve()});
      this.ws.close();
    });
  }
}
function pass(s) { console.log('PASS '+String(++checks).padStart(2,'0')+' '+s); }
async function scenario(n) {
  const tv=new Client('TV '+n); await tv.open;
  let m=tv.mark(); tv.send('tvCreate');
  const created=await tv.wait('tvCreated',()=>true,m);
  const room=created.room;
  assert.match(room,/^[BCDFGHJKLMNPQRSTVWXZ]{4}$/);
  const phones=[];
  for (let i=0;i<n;i++) {
    const client=new Client('Player '+n+'/'+i); await client.open;
    m=client.mark();client.send('join',{room,name:'Agent'+i,avatar:i});
    const joined=await client.wait('joined',()=>true,m);
    assert.equal(joined.spectator,false);
    phones.push({client,joined});
  }
  const roomView=await tv.wait('room',r=>r.players.length===n);
  assert.equal(roomView.players.length,n);
  assert.equal(roomView.mode,n<4?'coop':'versus');
  assert.equal(new Set(roomView.players.map(p=>p.id)).size,n);
  pass(n+' independent phones joined; correct '+roomView.mode+' mode');

  const spectator=new Client('Spectator '+n);await spectator.open;
  m=spectator.mark();spectator.send('join',{room,name:'Observer',avatar:23,spectator:true});
  assert.equal((await spectator.wait('joined',()=>true,m)).spectator,true);
  m=spectator.mark();spectator.send('host',{cmd:'start'});
  assert.equal((await spectator.wait('error',x=>x.code==='notHost',m)).code,'notHost');
  pass(n+'-player spectator cannot start the game');

  if (n>=6) {
    m=tv.mark();tv.send('host',{cmd:'settings',value:{mole:true,match:3}});
    await tv.wait('room',r=>r.players.length===n && r.settings.mole===true,m);
  }
  m=tv.mark();tv.send('host',{cmd:'start'});
  const game=await tv.wait('game',g=>g?.phase==='CLUE',m);
  assert.equal(game.cards.length,25);
  assert.equal(game.mode,n<4?'coop':'versus');
  assert.ok(game.cards.every(c=>!Object.hasOwn(c,'owner')),'TV received private card owners');
  assert.ok(!Object.hasOwn(game,'moles'),'TV received secret mole identities');
  if (n>=6) assert.equal(game.moleMode,true);
  const secrets=await Promise.all(phones.map(({client})=>client.wait('secret',()=>true,0)));
  const ops=secrets.filter(x=>x.operator);
  assert.equal(ops.length,n<4?1:2);
  for (let i=0;i<n;i++) {
    if (secrets[i].operator) assert.equal(secrets[i].key.length,25);
    else assert.equal(secrets[i].key,undefined);
  }
  assert.equal(tv.messages.filter(x=>x.t==='secret').length,0);
  assert.equal(spectator.messages.filter(x=>x.t==='secret').length,0);
  pass(n+'-player private keys, operators and 25-card TV view verified');

  const index=secrets.findIndex(s=>!s.operator);
  assert.ok(index>=0,'No runner to reconnect');
  const old=phones[index], identity=old.joined;
  await old.client.close();
  const returned=new Client('Rejoined '+n);await returned.open;
  m=returned.mark();returned.send('rejoin',{room,playerId:identity.playerId,token:identity.token});
  const restored=await returned.wait('joined',x=>x.playerId===identity.playerId,m);
  assert.equal(restored.token,identity.token);
  const restoredSecret=await returned.wait('secret',()=>true,m);
  assert.equal(restoredSecret.operator,false);
  assert.equal(restoredSecret.key,undefined);
  const updated=await tv.wait('room',r=>r.players.length===n && r.players.some(p=>p.id===identity.playerId && p.connected));
  assert.equal(updated.players.length,n);
  pass(n+'-player runner reconnect preserved seat and secret isolation');

  if (n===4) {
    const mark=phones[0].client.mark();
    await tv.close();
    await phones[0].client.wait('room',r=>r?.paused?.reason==='tv',mark,8000);
    const tvBack=new Client('TV rejoined '+n); await tvBack.open;
    m=tvBack.mark();tvBack.send('tvRejoin',{room,token:created.token});
    assert.equal((await tvBack.wait('tvCreated',r=>r.rejoined===true,m)).token,created.token);
    await tvBack.wait('room',r=>r.paused===null,m,12000);
    assert.equal(tvBack.messages.filter(x=>x.t==='secret').length,0);
    pass('4-player TV reconnection resumes without leaking private keys');
  }

  const late=new Client('Late join '+n);await late.open;
  m=late.mark();late.send('join',{room,name:'LateArrival',avatar:21});
  assert.equal((await late.wait('joined',()=>true,m)).spectator,true);
  await late.wait('game',g=>g?.phase==='CLUE',m);
  assert.equal(late.messages.filter(x=>x.t==='secret').length,0);
  pass(n+'-player late join remains spectator');
}
(async()=>{
  try {
    const health=await fetch(base+'/healthz');
    assert.equal(health.status,200);
    for (const n of [2,3,4,6,10]) await scenario(n);
    for (const c of active) assert.deepEqual(c.errors,[],c.name+' WebSocket errors');
    console.log('STAGE 25 MATRIX PASS: '+checks+' checks across 2, 3, 4, 6, 10 real WebSocket-client counts');
  } catch(e) {
    console.error('STAGE 25 MATRIX FAIL:',e.stack||e);
    process.exitCode=1;
  } finally {
    await Promise.allSettled([...active].map(c=>c.close()));
  }
})();
