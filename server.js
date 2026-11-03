'use strict';
// CYBER CYPHER — HTTP static server + WebSocket hub.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { parse, makeLimiter } = require('./src/validate');
const { rooms, createRoom } = require('./src/room');
const { LIMITS } = require('./src/config');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.webm': 'video/webm' };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = decodeURIComponent(url.pathname);
  if (p === '/healthz') { res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }); return res.end('ok'); }
  if (p === '/' || p === '/tv') p = '/tv.html';
  if (p === '/play' || p === '/join') p = '/play.html';
  if (/^\/[A-Z]{4}$/i.test(p)) { res.writeHead(302, { Location: '/play.html?room=' + p.slice(1).toUpperCase() }); return res.end(); }
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size, 'X-Content-Type-Options': 'nosniff',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
});

const wss = new WebSocketServer({ server, maxPayload: LIMITS.MAX_MSG_BYTES });
const send = (ws, t, d) => { if (ws.readyState === 1) ws.send(JSON.stringify({ t, d })); };

wss.on('connection', ws => {
  ws.isAlive = true; ws.cc = null;
  const limiter = makeLimiter();
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', raw => {
    const now = Date.now(), lim = limiter(now);
    if (!lim.allowed) { if (lim.kick) ws.close(4008, 'rate limit'); return; }
    const m = parse(raw);
    if (!m.ok) { if (m.fatal) ws.close(1009, 'too big'); else send(ws, 'error', { code: m.error, message: 'That message was not understood.' }); return; }
    ws.isAlive = true;
    try { route(ws, m.type, m.data, now); } catch (e) { console.error('[cc] handler error', m.type, e); send(ws, 'error', { code: 'server', message: 'Something went wrong on the server.' }); }
  });
  ws.on('close', () => { const v = ws.cc; if (v && rooms.has(v.room)) rooms.get(v.room).disconnect(ws, Date.now()); });
  ws.on('error', () => {});
});

function route(ws, type, d, now) {
  if (type === 'clock') return send(ws, 'pong', { c: d.c, s: now });
  if (type === 'tvCreate') { const room = createRoom(now); room.attachTv(ws, now); return send(ws, 'tvCreated', { room: room.code, token: room.tv.token }); }
  if (type === 'tvRejoin') {
    const room = rooms.get(d.room);
    if (!room || room.tv.token !== d.token) return send(ws, 'error', { code: 'badRejoin', message: 'That room has closed.' });
    room.attachTv(ws, now); return send(ws, 'tvCreated', { room: room.code, token: room.tv.token, rejoined: true });
  }
  if (type === 'join' || type === 'rejoin') {
    const room = rooms.get(d.room);
    if (!room) return send(ws, 'error', { code: 'noRoom', message: 'No game with that code. Check the TV.' });
    if (ws.cc && ws.cc.room !== d.room && rooms.has(ws.cc.room)) rooms.get(ws.cc.room).disconnect(ws, now);
    return type === 'join' ? room.join(ws, d, now) : room.rejoin(ws, d, now);
  }
  const v = ws.cc;
  if (!v || !rooms.has(v.room)) return send(ws, 'error', { code: 'notJoined', message: 'Join a game first.' });
  rooms.get(v.room).handle(ws, type, d, now);
}

setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    try { room.tick(now); } catch (e) { console.error('[cc] tick error', code, e); }
    if (room.expired(now)) { for (const s of room.sockets()) { try { s.close(4002, 'room closed'); } catch (e) { /* ignore */ } } rooms.delete(code); }
  }
}, 50);
setInterval(() => {
  const now = Date.now();
  for (const ws of wss.clients) {
    if (!ws.isAlive && now - (ws.lastPingAt || 0) > 20000) { ws.terminate(); continue; }
    if (ws.isAlive) { ws.isAlive = false; ws.lastPingAt = now; try { ws.ping(); } catch (e) { /* ignore */ } }
  }
}, 15000);

server.listen(PORT, () => console.log(`Cyber Cypher is running on http://localhost:${PORT}  (TV: /  Phones: /play)${process.env.BOTS && process.env.BOTS !== '0' ? '  [BOTS on]' : ''}`));
