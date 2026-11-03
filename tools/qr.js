/* Minimal QR Code encoder (byte mode, ECC level M, versions 1–10). Plain JavaScript, no library.
   Based on the ISO/IEC 18004 algorithm. qrMatrix(text) returns a square array of booleans (true = dark). */
var QR = (function () {
  var ECC_PER_BLOCK = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
  var NUM_BLOCKS = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
  function rawModules(v) {
    var r = (16 * v + 128) * v + 64;
    if (v >= 2) { var n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
    return r;
  }
  function dataCodewords(v) { return Math.floor(rawModules(v) / 8) - ECC_PER_BLOCK[v] * NUM_BLOCKS[v]; }
  function gfMul(x, y) { var z = 0; for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 0xFF; }
  function rsDivisor(deg) {
    var res = []; for (var i = 0; i < deg - 1; i++) res.push(0); res.push(1);
    var root = 1;
    for (var k = 0; k < deg; k++) {
      for (var j = 0; j < res.length; j++) { res[j] = gfMul(res[j], root); if (j + 1 < res.length) res[j] ^= res[j + 1]; }
      root = gfMul(root, 0x02);
    }
    return res;
  }
  function rsRemainder(data, div) {
    var res = div.map(function () { return 0; });
    data.forEach(function (b) {
      var f = b ^ res.shift(); res.push(0);
      div.forEach(function (c, i) { res[i] ^= gfMul(c, f); });
    });
    return res;
  }
  function utf8(s) { var out = []; var e = unescape(encodeURIComponent(s)); for (var i = 0; i < e.length; i++) out.push(e.charCodeAt(i)); return out; }

  function encode(text) {
    var bytes = utf8(text), v, cap;
    for (v = 1; v <= 10; v++) { cap = dataCodewords(v) * 8; var need = 4 + (v < 10 ? 8 : 16) + bytes.length * 8; if (need <= cap) break; }
    if (v > 10) throw new Error('QR: text too long');
    var bits = [];
    function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(function (b) { put(b, 8); });
    put(0, Math.min(4, cap - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var data = []; for (var i = 0; i < bits.length; i += 8) { var b = 0; for (var j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; data.push(b); }
    // split into blocks and add ECC
    var nb = NUM_BLOCKS[v], ecl = ECC_PER_BLOCK[v], raw = Math.floor(rawModules(v) / 8);
    var shortCount = nb - raw % nb, shortLen = Math.floor(raw / nb);
    var div = rsDivisor(ecl), blocks = [], k = 0;
    for (i = 0; i < nb; i++) {
      var dat = data.slice(k, k + shortLen - ecl + (i < shortCount ? 0 : 1)); k += dat.length;
      var ecc = rsRemainder(dat, div);
      if (i < shortCount) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var all = [];
    for (i = 0; i < blocks[0].length; i++) blocks.forEach(function (blk, bi) { if (i !== shortLen - ecl || bi >= shortCount) all.push(blk[i]); });
    return draw(v, all);
  }

  function draw(v, codewords) {
    var size = v * 4 + 17, m = [], fn = [];
    for (var y = 0; y < size; y++) { m.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function set(x, y, d) { m[y][x] = d; fn[y][x] = true; }
    for (var i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, yy = cy + dy;
        if (x >= 0 && x < size && yy >= 0 && yy < size) set(x, yy, d !== 2 && d !== 4);
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var pos = [];
    if (v > 1) { var n = Math.floor(v / 7) + 2, step = Math.floor((v * 8 + n * 3 + 5) / (n * 4 - 4)) * 2; for (i = n - 1, p = size - 7; i >= 1; i--, p -= step) pos.unshift(p); pos.unshift(6); }
    var p;
    for (i = 0; i < pos.length; i++) for (var j = 0; j < pos.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === pos.length - 1) || (i === pos.length - 1 && j === 0)) continue;
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) set(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    formatBits(0); // reserve
    if (v >= 7) {
      var rem = v; for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      var vb = (v << 12) | rem;
      for (i = 0; i < 18; i++) { var bit = ((vb >>> i) & 1) === 1, a = size - 11 + i % 3, b2 = Math.floor(i / 3); set(a, b2, bit); set(b2, a, bit); }
    }
    function formatBits(mask) {
      var data = (0 << 3) | mask; // ECC level M = 0b00
      var rem = data; for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var bits = ((data << 10) | rem) ^ 0x5412;
      for (i = 0; i <= 5; i++) set(8, i, ((bits >>> i) & 1) === 1);
      set(8, 7, ((bits >>> 6) & 1) === 1); set(8, 8, ((bits >>> 7) & 1) === 1); set(7, 8, ((bits >>> 8) & 1) === 1);
      for (i = 9; i < 15; i++) set(14 - i, 8, ((bits >>> i) & 1) === 1);
      for (i = 0; i < 8; i++) set(size - 1 - i, 8, ((bits >>> i) & 1) === 1);
      for (i = 8; i < 15; i++) set(8, size - 15 + i, ((bits >>> i) & 1) === 1);
      set(8, size - 8, true);
    }
    // place data
    var bitIdx = 0, total = codewords.length * 8;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (var jj = 0; jj < 2; jj++) {
        var x = right - jj, upward = ((right + 1) & 2) === 0, yy = upward ? size - 1 - vert : vert;
        if (!fn[yy][x] && bitIdx < total) { m[yy][x] = ((codewords[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1) === 1; bitIdx++; }
      }
    }
    function applyMask(k) {
      for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
        if (fn[y][x]) continue;
        var inv;
        switch (k) {
          case 0: inv = (x + y) % 2 === 0; break; case 1: inv = y % 2 === 0; break; case 2: inv = x % 3 === 0; break;
          case 3: inv = (x + y) % 3 === 0; break; case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: inv = x * y % 2 + x * y % 3 === 0; break; case 6: inv = (x * y % 2 + x * y % 3) % 2 === 0; break;
          default: inv = ((x + y) % 2 + x * y % 3) % 2 === 0;
        }
        if (inv) m[y][x] = !m[y][x];
      }
    }
    function penalty() {
      var score = 0, x, y, run, dark = 0;
      for (y = 0; y < size; y++) { run = 1; for (x = 1; x < size; x++) { if (m[y][x] === m[y][x - 1]) { run++; if (run === 5) score += 3; else if (run > 5) score++; } else run = 1; } }
      for (x = 0; x < size; x++) { run = 1; for (y = 1; y < size; y++) { if (m[y][x] === m[y - 1][x]) { run++; if (run === 5) score += 3; else if (run > 5) score++; } else run = 1; } }
      for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) { var c = m[y][x]; if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) score += 3; }
      var pat = [true, false, true, true, true, false, true];
      function finderLike(get) {
        var s = 0;
        for (var i = 0; i + 7 <= size; i++) {
          var ok = true; for (var k = 0; k < 7; k++) if (get(i + k) !== pat[k]) { ok = false; break; }
          if (!ok) continue;
          var before = true, after = true;
          for (k = 1; k <= 4; k++) { if (i - k >= 0 && get(i - k)) before = false; if (i + 6 + k < size && get(i + 6 + k)) after = false; }
          if (before || after) s += 40;
        }
        return s;
      }
      for (y = 0; y < size; y++) score += finderLike(function (i) { return m[y][i]; });
      for (x = 0; x < size; x++) score += finderLike(function (i) { return m[i][x]; });
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (m[y][x]) dark++;
      var tot = size * size; score += (Math.ceil(Math.abs(dark * 20 - tot * 10) / tot) - 1) * 10;
      return score;
    }
    var best = -1, bestScore = Infinity;
    for (var mk = 0; mk < 8; mk++) { applyMask(mk); formatBits(mk); var sc = penalty(); if (sc < bestScore) { bestScore = sc; best = mk; } applyMask(mk); }
    applyMask(best); formatBits(best);
    return m;
  }
  return { matrix: encode };
})();
if (typeof module !== 'undefined') module.exports = QR;
