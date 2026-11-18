'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { spawn } = require('node:child_process');
const path = require('node:path');
const WebSocket = require('ws');
const { isAllowedOrigin } = require('../src/ws-origin');

const LIVE = 'https://cyber-cypher-j2ry.onrender.com';
const ROOT = path.join(__dirname, '..');

test('Origin policy: hosted origin, loopback ports and configured custom domain are allowed', () => {
  const env = { NODE_ENV: 'production', ALLOWED_ORIGINS: ' https://games.example.com , https://second.example ' };
  for (const origin of [LIVE, 'http://localhost:3000', 'http://127.0.0.1:8123',
    'https://games.example.com', 'https://second.example']) {
    assert.equal(isAllowedOrigin(origin, env), true, origin);
  }
});

test('Origin policy: arbitrary, spoofed and malformed origins are denied', () => {
  const env = { NODE_ENV: 'production', ALLOWED_ORIGINS: 'https://games.example.com' };
  for (const origin of ['https://attacker.example', 'https://cyber-cypher-j2ry.onrender.com.evil.example',
    'http://localhost.evil.example:3000', 'https://localhost:3000', 'http://127.0.0.2:3000',
    'http://localhost', 'null', '', 'https://games.example.com/other',
    'https://games.example.com?query=1']) {
    assert.equal(isAllowedOrigin(origin, env), false, origin);
  }
});

test('Origin policy: absent Origin is permitted only outside production', () => {
  assert.equal(isAllowedOrigin(undefined, { NODE_ENV: 'test' }), true);
  assert.equal(isAllowedOrigin(undefined, { NODE_ENV: 'development' }), true);
  assert.equal(isAllowedOrigin(undefined, { NODE_ENV: 'production' }), false);
  assert.equal(isAllowedOrigin('', { NODE_ENV: 'development' }), false);
});

async function getFreePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => {
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', resolve);
  });
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  return port;
}

async function startServer(environment) {
  const port = await getFreePort();
  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, ...environment, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';
  const ready = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server startup timed out: ' + output)), 8000);
    const success = () => { clearTimeout(timeout); resolve(); };
    const failure = err => { clearTimeout(timeout); reject(err); };
    child.stdout.on('data', chunk => {
      output += chunk.toString();
      if (output.includes('Cyber Cypher is running on ')) success();
    });
    child.stderr.on('data', chunk => { output += chunk.toString(); });
    child.once('error', failure);
    child.once('exit', code => failure(new Error('Server exited (' + code + '): ' + output)));
  });
  try { await ready; } catch (err) { child.kill(); throw err; }
  return {
    port,
    logs: () => output,
    async stop() {
      if (child.exitCode !== null || child.signalCode !== null) return;
      await new Promise(resolve => {
        child.once('exit', resolve);
        child.kill('SIGTERM');
        setTimeout(() => { child.kill('SIGKILL'); resolve(); }, 2000).unref();
      });
    }
  };
}

function upgrade(port, origin) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://127.0.0.1:' + port,
      origin === undefined ? {} : { origin });
    let settled = false;
    const timeout = setTimeout(() => {
      ws.terminate();
      finish(reject, new Error('WebSocket upgrade timed out'));
    }, 5000);
    function finish(callback, result) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback(result);
    }
    ws.once('open', () => finish(resolve, { status: 101, ws }));
    ws.once('unexpected-response', (_request, response) => {
      response.resume();
      finish(resolve, { status: response.statusCode });
    });
    ws.once('error', err => finish(reject, err));
  });
}

function nextMessage(ws, expected) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.off('message', onMessage);
      reject(new Error('Timed out waiting for ' + expected));
    }, 5000);
    function onMessage(raw) {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }
      if (msg.t !== expected) return;
      clearTimeout(timeout);
      ws.off('message', onMessage);
      resolve(msg.d);
    }
    ws.on('message', onMessage);
  });
}

test('production HTTP upgrades enforce 101/403 and QR-linked phones can join', async t => {
  const server = await startServer({
    NODE_ENV: 'production',
    ALLOWED_ORIGINS: ' https://games.example.com , https://another.example '
  });
  t.after(() => server.stop());
  const opened = [];
  t.after(() => { for (const ws of opened) ws.terminate(); });

  async function accepted(origin) {
    const result = await upgrade(server.port, origin);
    assert.equal(result.status, 101, 'Expected accepted Origin: ' + origin);
    opened.push(result.ws);
    return result.ws;
  }
  async function rejected(origin) {
    const result = await upgrade(server.port, origin);
    assert.equal(result.status, 403, 'Expected HTTP 403 for Origin: ' + origin);
  }

  const tv = await accepted(LIVE);
  await accepted('http://localhost:' + server.port);
  await accepted('http://127.0.0.1:' + server.port);
  await accepted('https://games.example.com');
  await rejected('https://attacker.example');
  await rejected('https://cyber-cypher-j2ry.onrender.com.evil.example');
  await rejected(undefined);
  await rejected('null');

  // Simulate the exact TV/QR/phone network flow without touching a live room.
  const tvCreated = nextMessage(tv, 'tvCreated');
  tv.send(JSON.stringify({ t: 'tvCreate', d: {} }));
  const { room } = await tvCreated;
  assert.match(room, /^[A-Z]{4}$/);
  const qrDestination = await fetch('http://127.0.0.1:' + server.port + '/' + room,
    { redirect: 'manual' });
  assert.equal(qrDestination.status, 302);
  assert.equal(qrDestination.headers.get('location'), '/play.html?room=' + room);
  const phone = await accepted(LIVE);
  const joined = nextMessage(phone, 'joined');
  phone.send(JSON.stringify({ t: 'join', d: { room, name: 'OriginTest', avatar: 0 } }));
  const details = await joined;
  assert.equal(details.room, room);
  assert.equal(details.spectator, false);
  assert.ok(details.playerId);

  // Rejections must be visible in the server log, not silently dropped.
  await new Promise(resolve => setTimeout(resolve, 50));
  assert.match(server.logs(), /rejected WebSocket upgrade \(403\), origin="https:\/\/attacker\.example"/);
  assert.match(server.logs(), /rejected WebSocket upgrade \(403\), origin="\(missing\)"/);
});

test('development WebSocket upgrades allow clients with no Origin', async t => {
  const server = await startServer({ NODE_ENV: 'development', ALLOWED_ORIGINS: '' });
  t.after(() => server.stop());
  const result = await upgrade(server.port, undefined);
  assert.equal(result.status, 101);
  t.after(() => result.ws.terminate());
});
