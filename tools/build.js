'use strict';
// Injects shared client code, the QR encoder and base64 fonts into public/tv.html and public/play.html.
// Run after editing tools/shared.js or tools/qr.js:  npm run build
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const shared = read('tools/shared.js');
const qr = read('tools/qr.js').replace(/\nif \(typeof module[^\n]*\n?/, '\n');
const font = (file, family, weight) => `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${fs.readFileSync(path.join(root, 'fonts', file)).toString('base64')}) format('woff2');font-weight:${weight};font-style:normal;font-display:swap}`;
const fonts = [font('AtkinsonHyperlegible-Regular.woff2', 'Atkinson', 400), font('AtkinsonHyperlegible-Bold.woff2', 'Atkinson', 700), font('Orbitron.woff2', 'Orbitron', '400 900')].join('\n');
function inject(html, name, content) {
  const re = new RegExp('(/\\*@@' + name + '_START@@\\*/)[\\s\\S]*?(/\\*@@' + name + '_END@@\\*/)');
  if (!re.test(html)) throw new Error('marker ' + name + ' missing');
  return html.replace(re, (m, a, b) => a + '\n' + content + '\n' + b);
}
for (const f of ['public/tv.html', 'public/play.html']) {
  let html = read(f);
  html = inject(html, 'SHARED', shared + (f.includes('tv') ? '\n' + qr : ''));
  html = inject(html, 'FONTS', fonts);
  fs.writeFileSync(path.join(root, f), html);
  console.log('built', f, Math.round(html.length / 1024) + ' KB');
}
