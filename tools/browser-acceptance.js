'use strict';
/* CYBER CYPHER browser acceptance (read-only, local server only).
 * npm install --no-save --package-lock=false playwright
 * npx playwright install chromium
 * PORT=3123 node server.js
 * CC_ACCEPTANCE_HTTP=http://127.0.0.1:3123 node tools/browser-acceptance.js
 */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.CC_ACCEPTANCE_HTTP || 'http://127.0.0.1:3123';
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base)) {
  throw new Error('Browser QA must run against a local isolated server, not an active public room');
}
const failures = [];
async function check(name, task) {
  try { await task(); console.log('PASS ' + name); }
  catch (e) { failures.push(name + ': ' + e.message); console.error('FAIL ' + name + ': ' + e.message); }
}
async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  try {
    const tv = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    const errors = [];
    tv.on('pageerror', e => errors.push(e.message));
    await tv.addInitScript(() => {
      window.__ccAudioQA = { starts: 0, stops: 0, longestBuffer: 0 };
      const proto = AudioContext.prototype;
      const original = proto.createBufferSource;
      proto.createBufferSource = function () {
        const source = original.apply(this, arguments);
        const start = source.start.bind(source);
        const stop = source.stop.bind(source);
        source.start = function () {
          window.__ccAudioQA.starts++;
          window.__ccAudioQA.longestBuffer = Math.max(window.__ccAudioQA.longestBuffer, source.buffer?.duration || 0);
          return start(...arguments);
        };
        source.stop = function () { window.__ccAudioQA.stops++; return stop(...arguments); };
        return source;
      };
    });
    await tv.goto(base + '/', { waitUntil: 'domcontentloaded' });
    await check('TV training entry point', async () => {
      await tv.locator('[data-go="tutorial"]').first().click();
      await assert.equal(await tv.locator('.tut .caption').count(), 1);
      assert.match(await tv.locator('.tut .caption').innerText(), /Welcome, operative/);
    });
    await check('HALO audio begins in real browser after user gesture', async () => {
      await tv.waitForFunction(() => window.__ccAudioQA.starts > 0, null, { timeout: 10000 });
      await tv.waitForTimeout(1200);
      assert.ok(await tv.evaluate(() => window.__ccAudioQA.longestBuffer > 2),
        'No decoded audio buffer over 2 seconds started');
    });
    await check('All 11 tutorial chapters and button navigation', async () => {
      const seen = new Set();
      for (let i = 0; i < 11; i++) {
        const caption = await tv.locator('.tut .caption').innerText();
        assert.ok(caption.length > 20, 'empty tutorial narration text on chapter ' + (i + 1));
        seen.add(caption);
        const back = tv.locator('[data-tut="-1"]'), next = tv.locator('[data-tut="1"]');
        assert.equal(await next.isVisible(), true);
        if (i === 0) assert.equal(await back.isDisabled(), true);
        else assert.equal(await back.isEnabled(), true);
        if (i === 10) assert.match(await next.innerText(), /FINISH/);
        else await next.click();
      }
      assert.equal(seen.size, 11, 'chapter captions are repeated or skipped');
      await tv.locator('[data-tut="-1"]').click();
      assert.match(await tv.locator('[data-tut="1"]').innerText(), /NEXT/);
      await tv.locator('[data-tut="1"]').click();
      await tv.locator('[data-tut="1"]').click();
      await tv.locator('[data-go="tutorial"]').first().waitFor({ state: 'visible' });
    });
    await check('TV stage fits 16:9 viewport', async () => {
      await tv.setViewportSize({ width: 1366, height: 768 });
      const bounds = await tv.locator('#stage').boundingBox();
      assert.ok(bounds && bounds.x >= -2 && bounds.y >= -2 && bounds.x + bounds.width <= 1368 && bounds.y + bounds.height <= 770,
        'TV stage overflows viewport: ' + JSON.stringify(bounds));
    });
    await check('Phone portrait 360px: no horizontal overflow', async () => {
      const phone = await browser.newPage({ viewport: { width: 360, height: 800 }, isMobile: true, deviceScaleFactor: 1 });
      try {
        await phone.goto(base + '/play', { waitUntil: 'domcontentloaded' });
        await phone.waitForTimeout(400);
        const layout = await phone.evaluate(() => ({
          html: document.documentElement.scrollWidth,
          body: document.body.scrollWidth,
          viewport: document.documentElement.clientWidth,
        }));
        assert.ok(layout.html <= layout.viewport + 2 && layout.body <= layout.viewport + 2,
          'Phone scroll width exceeds viewport: ' + JSON.stringify(layout));
      } finally { await phone.close(); }
    });
    await check('Browser JavaScript errors absent', async () => assert.deepEqual(errors, []));
    await tv.close();
  } finally { await browser.close(); }
  if (failures.length) {
    console.error('\nBROWSER ACCEPTANCE FAIL: ' + failures.length + ' checks\n' + failures.join('\n'));
    process.exitCode = 1;
  } else console.log('\nBROWSER ACCEPTANCE PASS: all checks');
}
main().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
