/* ===== CYBER CYPHER — shared client code (injected into tv.html and play.html by tools/build.js) ===== */
var CC = (function () {
  'use strict';
  var TEAM = {
    volt:  { name: 'VOLT',  colour: '#22E4FF', day: '#00728A', shape: 'hex' },
    flare: { name: 'FLARE', colour: '#FFB020', day: '#9A5A00', shape: 'tri' },
    noise: { name: 'NOISE', colour: '#8C93A8', day: '#4E5466', shape: 'bar' },
    zero:  { name: 'ZERO DAY', colour: '#FF2E5B', day: '#B0002A', shape: 'x' },
    ice:   { name: 'ICE',   colour: '#B48CFF', day: '#5B33B0', shape: 'diamond' }
  };
  var AVATAR_NAMES = ['Static', 'Cipher', 'Neon', 'Glitch', 'Vector', 'Pixel', 'Nova', 'Rook', 'Echo', 'Flux', 'Kestrel', 'Onyx',
    'Juno', 'Halcyon', 'Quark', 'Raven', 'Siren', 'Tango', 'Umbra', 'Volta', 'Wraith', 'Xeno', 'Yara', 'Zephyr'];
  var REACTS = { wow: '\uD83D\uDE2E', laugh: '\uD83D\uDE02', fire: '\uD83D\uDD25', facepalm: '\uD83E\uDD26', clap: '\uD83D\uDC4F', shock: '\u26A1' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function secs(ms) { return Math.max(0, Math.ceil(ms / 1000)); }
  function clock(ms) { var s = secs(ms); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function num(n) { return n === -1 ? '\u221E' : String(n); }

  // ---------- network with clock sync and auto-reconnect ----------
  function Net(onMessage, onStatus) {
    this.onMessage = onMessage; this.onStatus = onStatus || function () {};
    this.ws = null; this.queue = []; this.offsets = []; this.offset = 0; this.retry = 0;
    this.connect();
    var self = this;
    setInterval(function () { self.sync(); }, 10000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && (!self.ws || self.ws.readyState > 1)) self.connect(); });
  }
  Net.prototype.connect = function () {
    var self = this;
    if (this.ws && this.ws.readyState <= 1) return;
    var ws; try { ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host); } catch (e) { return this.later(); }
    this.ws = ws; this.onStatus('connecting');
    ws.onopen = function () { self.retry = 0; self.onStatus('open'); self.sync(); self.sync(); var q = self.queue; self.queue = []; q.forEach(function (m) { ws.send(m); }); };
    ws.onmessage = function (ev) {
      var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.t === 'pong') {
        var now = Date.now(), off = m.d.s + (now - m.d.c) / 2 - now;
        self.offsets.push(off); if (self.offsets.length > 5) self.offsets.shift();
        var s = self.offsets.slice().sort(function (a, b) { return a - b; }); self.offset = s[Math.floor(s.length / 2)];
        return;
      }
      self.onMessage(m.t, m.d);
    };
    ws.onclose = function (ev) { self.onStatus('closed', ev.code); if (ev.code === 4001 || ev.code === 4002) return; self.later(); };
    ws.onerror = function () {};
  };
  Net.prototype.later = function () { var self = this; setTimeout(function () { self.connect(); }, Math.min(8000, 500 * Math.pow(1.6, this.retry++))); };
  Net.prototype.send = function (t, d) {
    var msg = JSON.stringify({ t: t, d: d || {} });
    if (this.ws && this.ws.readyState === 1) this.ws.send(msg); else { this.queue.push(msg); if (this.queue.length > 20) this.queue.shift(); }
  };
  Net.prototype.sync = function () { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify({ t: 'clock', d: { c: Date.now() } })); };
  Net.prototype.serverNow = function () { return Date.now() + this.offset; };
  function gtNow(net, meters) { if (!meters) return 0; if (meters.paused) return meters.gt; return meters.gt + Math.max(0, net.serverNow() - meters.serverTime); }

  // ---------- icons ----------
  function svg(inner, cls, extra) { return '<svg class="' + (cls || 'ico') + '" viewBox="0 0 48 48" aria-hidden="true" ' + (extra || 'fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"') + '>' + inner + '</svg>'; }
  var SHAPES = {
    hex: '<path d="M24 4l17 10v20L24 44 7 34V14z"/>',
    tri: '<path d="M24 5l20 36H4z"/>',
    bar: '<path d="M8 24h32"/>',
    x: '<path d="M10 10l28 28M38 10L10 38"/><circle cx="24" cy="24" r="20"/>',
    diamond: '<path d="M24 4l20 20-20 20L4 24z"/>'
  };
  function shape(owner, cls) { var t = TEAM[owner]; return svg(SHAPES[t ? t.shape : 'bar'], cls || 'ico'); }
  var ICONS = {
    operator: '<circle cx="24" cy="18" r="8"/><path d="M8 42c2-9 8-13 16-13s14 4 16 13"/><path d="M34 10l6-4M14 10L8 6"/>',
    runner: '<circle cx="28" cy="9" r="4"/><path d="M20 44l6-14-6-6 4-10 8 6 6 2M14 24l6-6"/>',
    mole: '<ellipse cx="24" cy="28" rx="14" ry="12"/><circle cx="19" cy="25" r="2" fill="currentColor"/><circle cx="29" cy="25" r="2" fill="currentColor"/><path d="M20 33h8M12 18l-4-6M36 18l4-6"/>',
    clue: '<path d="M6 12h36v22H22l-10 8v-8H6z"/>',
    pass: '<path d="M10 24h28M28 14l10 10-10 10"/>',
    gear: '<circle cx="24" cy="24" r="6"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M10 38l4-4M34 14l4-4"/>',
    info: '<circle cx="24" cy="24" r="19"/><path d="M24 22v12M24 14v1"/>',
    lock: '<rect x="10" y="22" width="28" height="20" rx="3"/><path d="M16 22v-6a8 8 0 0 1 16 0v6"/>',
    wifi: '<path d="M6 18c10-9 26-9 36 0M12 25c7-6 17-6 24 0M18 32c4-3 8-3 12 0"/><circle cx="24" cy="38" r="2" fill="currentColor"/>'
  };
  function icon(n, cls) { return svg(ICONS[n] || '', cls); }

  // ---------- avatars: drawn placeholder, real art layered on top when the file exists ----------
  var AV_HUES = [190, 30, 280, 140, 340, 210, 50, 0, 170, 260, 100, 320, 200, 15, 290, 150, 350, 230, 60, 120, 300, 180, 40, 250];
  // Avatar art is used only once agent-00.webp is confirmed to exist (otherwise browsers draw a broken-image icon).
  var art = { avatars: false };
  function avatar(i, cls) {
    i = ((i | 0) % 24 + 24) % 24;
    var h = AV_HUES[i], src = '/assets/avatars/agent-' + String(i).padStart(2, '0') + '.webp';
    var visor = i % 3 === 0 ? '<rect x="14" y="19" width="20" height="6" rx="3" fill="hsl(' + h + ',100%,60%)"/>'
      : i % 3 === 1 ? '<circle cx="19" cy="22" r="2.6" fill="hsl(' + h + ',100%,65%)"/><circle cx="29" cy="22" r="2.6" fill="hsl(' + h + ',100%,65%)"/>'
      : '<path d="M14 22h20" stroke="hsl(' + h + ',100%,62%)" stroke-width="3" stroke-linecap="round"/>';
    return '<svg class="' + (cls || 'av') + '" viewBox="0 0 48 48" role="img" aria-label="' + AVATAR_NAMES[i] + '">' +
      '<defs><linearGradient id="avg' + i + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(' + h + ',60%,22%)"/><stop offset="1" stop-color="hsl(' + ((h + 40) % 360) + ',70%,10%)"/></linearGradient></defs>' +
      '<rect width="48" height="48" rx="10" fill="url(#avg' + i + ')"/>' +
      '<path d="M8 48c1-9 7-14 16-14s15 5 16 14z" fill="#05070D" opacity=".9"/><circle cx="24" cy="22" r="11" fill="#05070D" opacity=".9"/>' + visor +
      '<rect x=".5" y=".5" width="47" height="47" rx="9.5" fill="none" stroke="hsl(' + h + ',100%,60%)" stroke-opacity=".55"/>' +
      (art.avatars ? '<image href="' + src + '" x="0" y="0" width="48" height="48" preserveAspectRatio="xMidYMid slice"/>' : '') + '</svg>';
  }

  /** Calls back once if an image file exists (used to swap placeholders for real art). */
  function artReady(url, cb) { var im = new Image(); im.onload = function () { cb(true); }; im.onerror = function () { cb(false); }; im.src = url; }

  /** Checks for avatar art once; calls back so the page can redraw with real portraits. */
  function detectArt(cb) { artReady('/assets/avatars/agent-00.webp', function (ok) { art.avatars = ok; if (ok && cb) cb(); }); }
  /* Splits a long word over two lines at a natural syllable break (e.g. LUNCH-BOX, HAM-MOCK, OMNI-SHAMBLES). */
  var SPLIT = (function () {
    var V = /[AEIOUY]/;
    var DI = /^(CH|SH|TH|PH|CK|WH|QU|GH)$/;
    var ONSET = ['BL', 'BR', 'CL', 'CR', 'DR', 'FL', 'FR', 'GL', 'GR', 'PL', 'PR', 'SC', 'SK', 'SL', 'SM', 'SN', 'SP', 'ST', 'SW', 'TR', 'TW', 'CH', 'SH', 'TH', 'PH', 'WH', 'QU', 'SCR', 'SPR', 'STR', 'SPL', 'SHR', 'THR', 'CHR'];
    var CODA = ['ST', 'ND', 'NT', 'NK', 'MP', 'SK', 'SP', 'LT', 'LD', 'LK', 'LM', 'LP', 'RT', 'RD', 'RN', 'RM', 'RK', 'RC', 'RB', 'RP', 'RS', 'RL', 'CK', 'NG', 'NCH', 'TCH', 'SH', 'CH', 'TH', 'LL', 'SS', 'FF', 'NS', 'CT', 'FT', 'PT', 'XT', 'GHT', 'LCH', 'RCH', 'RTH', 'NTH', 'MB', 'WN', 'WL', 'GN'];
    var PRE = ['ANTI', 'AUTO', 'DIS', 'INTER', 'MICRO', 'MIS', 'MULTI', 'OMNI', 'OVER', 'PRE', 'SUB', 'SUPER', 'TELE', 'TRANS', 'UNDER', 'CYBER', 'HYPER', 'BACK', 'HEAD', 'HAND', 'FIRE', 'SNOW', 'SAND', 'SUN', 'MOON', 'STAR', 'WATER', 'NIGHT', 'FOOT', 'BOOK', 'NOTE', 'HONEY', 'BLUE', 'BLACK', 'GOLD', 'SCARE', 'CROSS', 'DOOR', 'TOOTH', 'HAIR', 'BED', 'TREE', 'WIND', 'SHIP', 'SKY', 'RAIN', 'LIGHT', 'PAPER', 'SEA', 'SPACE', 'TIME', 'HOME', 'GREEN', 'BIRTH', 'CANDY'];
    function onsetOk(r) { var m = r.match(/^[^AEIOUY]*/)[0]; return m.length <= 1 || ONSET.indexOf(m) >= 0; }
    function codaOk(l) { var m = l.match(/[^AEIOUY]*$/)[0]; return m.length <= 1 || CODA.indexOf(m) >= 0; }
    return function (word) {
      var w = String(word).toUpperCase(), n = w.length, best = -1, bs = 1e9;
      for (var i = 2; i <= n - 2; i++) {
        var l = w.slice(0, i), r = w.slice(i), a = w[i - 1], b = w[i], c = w[i + 1] || '';
        if (!V.test(l) || !/[AEIOUY]/.test(r.slice(0, -1) || 'X') && !/[AIOUY]/.test(r)) continue; // each half needs a sounded vowel
        var s = Math.abs(i - n / 2) * 1.1, av = V.test(a), bv = V.test(b);
        if (DI.test(a + b)) s += 4;
        if (av && bv) s += 2.5;
        if (!av && bv) s += 2;
        if (av && !bv && V.test(c)) s -= 1.2;
        if (!av && !bv && !DI.test(a + b)) s -= 1.5;
        if (!onsetOk(r)) s += 4;
      if (ONSET.indexOf(a + b) >= 0 && V.test(c)) s += 1.5; // don't split a cluster that starts the next syllable (CANDY-FLOSS)
        if (!codaOk(l)) s += 2;
        if (PRE.indexOf(l) >= 0 && r.length >= 3) s -= 2.5;
        if (l.length < 3 || r.length < 3) s += 1;
      var widest = Math.max(l.length + 1, r.length); if (widest > 7) s += (widest - 7) * 1.2; // keep each line short enough for phone cells
        if (s < bs) { bs = s; best = i; }
      }
      return best < 0 ? [w] : [w.slice(0, best), w.slice(best)];
    };
  })();
  function wordSize(word, base) {
    var n = String(word).length;
    return n <= 6 ? base : n <= 8 ? base * 0.9 : n <= 10 ? base * 0.78 : base * 0.68;
  }

  return { TEAM: TEAM, AVATAR_NAMES: AVATAR_NAMES, REACTS: REACTS, esc: esc, secs: secs, clock: clock, num: num,
    Net: Net, gtNow: gtNow, svg: svg, shape: shape, icon: icon, avatar: avatar, artReady: artReady, detectArt: detectArt, wordSize: wordSize, splitWord: SPLIT };
})();
