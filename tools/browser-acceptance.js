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
      // HTMLAudioElement used by the tutorial is not attached to the DOM.
      window.__tutorialMedia = [];
      const NativeAudio = window.Audio;
      window.Audio = function (src) {
        const media = new NativeAudio(src);
        window.__tutorialMedia.push(media);
        return media;
      };
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
    // Title intro intercepts initial clicks for 2.5 seconds.
    await tv.waitForTimeout(2700);
    await check('TV training entry point', async () => {
      await tv.locator('[data-go="tutorial"]').first().click();
      await assert.equal(await tv.locator('.tut .caption').count(), 1);
      assert.match(await tv.locator('.tut .caption').innerText(), /Welcome, operative/);
    });
    await check('HALO playback controls and real browser media', async () => {
      const play = tv.locator('[data-tut-play]'), pause = tv.locator('[data-tut-pause]'), replay = tv.locator('[data-tut-replay]');
      assert.equal(await play.isVisible(), true);
      assert.equal(await pause.isVisible(), true);
      assert.equal(await replay.isVisible(), true);
      await tv.waitForFunction(() => {
        const m = window.__tutorialMedia[window.__tutorialMedia.length - 1];
        return m && m.currentTime > 0 && !m.paused;
      }, null, { timeout: 15000 });
      await pause.click();
      await tv.waitForFunction(() => {
        const m = window.__tutorialMedia[window.__tutorialMedia.length - 1];
        return m && m.paused;
      });
      const position = await tv.evaluate(() => window.__tutorialMedia[window.__tutorialMedia.length - 1].currentTime);
      await play.click();
      await tv.waitForFunction(() => {
        const m = window.__tutorialMedia[window.__tutorialMedia.length - 1];
        return m && !m.paused;
      });
      const resumed = await tv.evaluate(() => window.__tutorialMedia[window.__tutorialMedia.length - 1].currentTime);
      assert.ok(resumed >= position - 0.1, 'resume restarted instead of continuing');
      await replay.click();
      await tv.waitForFunction(() => {
        const m = window.__tutorialMedia[window.__tutorialMedia.length - 1];
        return m && !m.paused && m.currentTime < 1;
      });
    });
    await check('Tutorial mute and stop never start competing HALO speech', async () => {
      const mute = tv.locator('[data-tut-mute]'), stop = tv.locator('[data-tut-stop]');
      assert.equal(await mute.isVisible(), true);
      assert.equal(await stop.isVisible(), true);
      await mute.click();
      assert.equal(await mute.getAttribute('aria-pressed'), 'true');
      assert.equal(await tv.evaluate(() => window.__tutorialMedia.at(-1).muted), true);
      const before = await tv.evaluate(() => window.__ccAudioQA.starts);
      await tv.evaluate(() => window.AUDIO.say('vo_join_1', true));
      await tv.waitForTimeout(200);
      assert.equal(await tv.evaluate(() => window.__ccAudioQA.starts), before, 'Live narration played over training');
      await mute.click();
      assert.equal(await mute.getAttribute('aria-pressed'), 'false');
      await stop.click();
      assert.equal(await tv.evaluate(() => window.__tutorialMedia.at(-1).paused), true);
      await tv.locator('[data-tut-play]').click();
      await tv.waitForFunction(() => {
        const m = window.__tutorialMedia.at(-1); return m && !m.paused;
      });
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
      // The TV fit() handler updates --k asynchronously on browser resize.
      await tv.waitForFunction(() => Math.abs(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--k')) - Math.min(innerWidth / 1920, innerHeight / 1080)) < 0.001);
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
    await check('Actual TV and phone screenshots, QR return, roles, 25-cell board', async () => {
      const fs = require('node:fs');
      const path = require('node:path');
      const out = path.join(__dirname, '../qa/screenshots');
      fs.mkdirSync(out,{recursive:true});
      await tv.setViewportSize({width:1920,height:1080});
      await tv.locator('[data-go="start"]').click();
      await tv.locator('.joinp .code').waitFor({timeout:8000});
      const code=(await tv.locator('.joinp .code').innerText()).trim();
      assert.match(code,/^[BCDFGHJKLMNPQRSTVWXZ]{4}$/);
      await tv.screenshot({path:path.join(out,'review-tv-qr.png')});
      await tv.locator('.joinp [data-go="title"]').click();
      await tv.locator('[data-go="start"]').click();
      assert.equal((await tv.locator('.joinp .code').innerText()).trim(),code,
        'Back to Lobby must not destroy the QR room');
      const phones=[];
      try {
        for(const [name,avatar,width] of [['OperatorQA',2,390],['RunnerQA',7,320]]){
          const p=await browser.newPage({viewport:{width,height:844},isMobile:true,deviceScaleFactor:1});
          phones.push(p);
          await p.goto(base+'/play.html?room='+code,{waitUntil:'domcontentloaded'});
          await p.locator('#nameIn').fill(name);
          await p.locator('[data-act="nameNext"]').click();
          await p.locator('[data-av="'+avatar+'"]').click();
          await p.locator('[data-act="join"]').click();
          await p.locator('.hdr .t').filter({hasText:'LOBBY'}).waitFor({timeout:12000});
        }
        await tv.waitForFunction(()=>document.querySelector('.lobbybar [data-host="start"]')?.disabled===false);
        await tv.locator('.lobbybar [data-host="start"]').click();
        await tv.waitForFunction(()=>document.querySelectorAll('#scene .grid .card').length===25);
        for (const p of phones) {
          await p.locator('[data-brief]').waitFor({timeout:12000});
          await p.locator('[data-brief]').click();
          assert.equal(await p.locator('.board .node').count(),25);
        }
        assert.match(await phones[0].locator('.hdr .t').innerText(),/OPERATOR/);
        assert.match(await phones[1].locator('.hdr .t').innerText(),/RUNNER/);
        assert.equal(await phones[0].locator('.board .node.key').count(),25);
        assert.equal(await phones[1].locator('.board .node.key').count(),0,'Runner received secret grid');
        await phones[0].locator('#clueIn').fill('ZZTOP');
        await phones[0].locator('[data-num="2"]').click();
        await phones[0].locator('[data-act="sendClue"]').click();
        await phones[1].locator('.risk-hint').waitFor({timeout:10000});
        assert.match(await phones[1].locator('.risk-hint').innerText(),/Zero Day/);
        assert.match(await tv.locator('#scanInfo').innerText(),/CREW SCAN/);
        for(const p of phones) {
          const overflow=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
          assert.ok(overflow <= 2,'In-game phone board overflows '+overflow+'px');
        }
        await tv.screenshot({path:path.join(out,'review-tv-5x5.png')});
        await phones[0].screenshot({path:path.join(out,'review-phone-operator-390.png')});
        await phones[1].screenshot({path:path.join(out,'review-phone-runner-320.png')});
      } finally { await Promise.all(phones.map(p=>p.close())); }
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
