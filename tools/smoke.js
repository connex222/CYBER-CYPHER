'use strict';
// End-to-end check over real WebSockets. Start the server with BOTS=1 CC_SPEED=10, then: npm run smoke
const WebSocket = require('ws');
const URL = process.env.URL || 'ws://localhost:3000';
const log = (...a) => console.log('[smoke]', ...a);
function client() {
  const ws = new WebSocket(URL), c = { ws, on: {}, send: (t, d) => ws.send(JSON.stringify({ t, d: d || {} })) };
  ws.on('message', raw => { const m = JSON.parse(raw); (c.on[m.t] || []).forEach(f => f(m.d)); });
  c.when = (t, f) => { (c.on[t] = c.on[t] || []).push(f); };
  c.open = new Promise(r => ws.on('open', r));
  return c;
}
const until = (c, t, pred, ms, label) => new Promise((res, rej) => { const to = setTimeout(() => rej(new Error('timeout: ' + label)), ms); c.when(t, d => { if (pred(d)) { clearTimeout(to); res(d); } }); });
(async () => {
  const tv = client(); await tv.open; tv.send('tvCreate');
  const { room } = await new Promise(r => tv.when('tvCreated', r)); log('room', room);
  let tvSecrets = 0; tv.when('secret', () => tvSecrets++);
  let sawKeyOnTv = false;
  tv.when('game', g => { if (g && g.phase !== 'OVER' && g.phase !== 'MOLEVOTE' && g.cards.some(c => !c.revealed && c.owner)) sawKeyOnTv = true; });
  for (let i = 0; i < 6; i++) tv.send('host', { cmd: 'fillBots' });
  tv.send('host', { cmd: 'settings', value: { deck: 'adult', timer: 'standard', mole: true } });
  tv.send('host', { cmd: 'settings', value: { adultConfirm: true } });
  const spec = client(); await spec.open; spec.send('join', { room, name: 'Watcher', avatar: 3, spectator: true });
  let specSecrets = 0; spec.when('secret', () => specSecrets++);
  await new Promise(r => setTimeout(r, 400));
  tv.send('host', { cmd: 'start' });
  const first = await until(tv, 'game', g => g && g.phase === 'CLUE', 5000, 'game start');
  log('started: deck', first.deck, 'mode', first.mode, 'mole mode', first.moleMode, 'first crew', first.turnTeam);
  let reveals = 0, clues = 0; tv.when('event', e => { if (e.kind === 'reveal') reveals++; if (e.kind === 'clue') clues++; });
  const over = await until(tv, 'game', g => g && g.phase === 'OVER', 240000, 'game over');
  log('OVER: winner', over.winner, 'reason', over.reason, '| clues', clues, 'reveals', reveals, '| moles', JSON.stringify(Object.fromEntries(Object.entries(over.result.moles).map(([t, m]) => [t, m.caught ? 'caught' : 'escaped']))));
  tv.ws.send('garbage'); tv.ws.send(JSON.stringify({ t: 'ping', d: { target: 99 } })); tv.ws.send(JSON.stringify({ t: 'nope' }));
  tv.send('host', { cmd: 'next' });
  await until(tv, 'game', g => g && g.phase === 'CLUE', 5000, 'next game');
  log('next game started; server healthy');
  log('secrets to TV:', tvSecrets, '| secrets to spectator:', specSecrets, '| key visible on TV during play:', sawKeyOnTv);
  if (tvSecrets || specSecrets || sawKeyOnTv) { log('FAIL: secret leak'); process.exit(1); }
  log('PASS'); process.exit(0);
})().catch(e => { console.error('[smoke] FAIL', e.message); process.exit(1); });
