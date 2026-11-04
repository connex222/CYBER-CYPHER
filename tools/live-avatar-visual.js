#!/usr/bin/env node
'use strict';
/* CYBER CYPHER Stage 21: actual Chromium UI checks against the deployed game.
   No game is created or joined; phone tests stop at the avatar picker. */
const { chromium }=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const BASE=(process.env.CC_VISUAL_URL||'https://cyber-cypher-j2ry.onrender.com').replace(/\/$/,'');
const ROOT=path.resolve(process.env.CC_SCREENSHOTS||'qa/screenshots');
const widths=[320,375,430,768];
fs.mkdirSync(ROOT,{recursive:true});
let checks=0;
function pass(msg){console.log('PASS '+String(++checks).padStart(2,'0')+' '+msg)}
function issues(page,label){
 const errors=[];
 page.on('pageerror',e=>errors.push('PAGE: '+String(e?.message||e)));
 return ()=>assert.deepEqual(errors,[],'JavaScript errors in '+label);
}
function inside(r,w,label){
 assert.ok(r&&r.width>=43&&r.height>=43,'Control too small: '+label+' '+JSON.stringify(r));
 assert.ok(r.x>=-2&&r.x+r.width<=w+2,'Control horizontally clipped: '+label+' '+JSON.stringify(r));
}
async function phoneCase(browser,width){
 const context=await browser.newContext({
  viewport:{width,height:740},deviceScaleFactor:1,
  isMobile:width<600,hasTouch:width<600,reducedMotion:'reduce'
 });
 const page=await context.newPage(),verify=issues(page,'phone '+width);
 try{
  const response=await page.goto(BASE+'/play?room=BCDF',{waitUntil:'domcontentloaded',timeout:45000});
  assert.equal(response.status(),200);
  await page.locator('#nameIn').waitFor({timeout:12000});
  await page.locator('#nameIn').fill('VISUALQA');
  await page.locator('[data-act="nameNext"]').click();
  await page.locator('[data-av]').first().waitFor({timeout:12000});
  await page.waitForFunction(()=>document.querySelectorAll('[data-av] svg image').length===24,{timeout:14000});
  assert.equal(await page.locator('[data-av]').count(),24,'Missing avatar choices');
  const avs=await page.locator('[data-av]').evaluateAll(elements=>elements.map(b=>({
   index:Number(b.dataset.av),name:b.getAttribute('aria-label'),
   href:b.querySelector('svg image')?.getAttribute('href'),
   r:(()=>{const x=b.getBoundingClientRect();return {x:x.x,y:x.y,width:x.width,height:x.height}})()
  })));
  assert.deepEqual(avs.map(x=>x.index),Array.from({length:24},(_,i)=>i));
  assert.equal(new Set(avs.map(x=>x.name)).size,24);
  for(const [i,av] of avs.entries()){
   assert.equal(av.href,'/assets/avatars/agent-'+String(i).padStart(2,'0')+'.webp');
   inside(av.r,width,'avatar '+i+' @ '+width);
  }
  const dims=await page.evaluate(()=>({
   viewport:window.innerWidth,
   scrollWidth:document.documentElement.scrollWidth,
   scrollHeight:document.documentElement.scrollHeight,
   portraitCount:document.querySelectorAll('[data-av] svg image').length,
  }));
  assert.ok(dims.scrollWidth<=dims.viewport+2,'Horizontal page overflow: '+width+': '+JSON.stringify(dims));
  await page.screenshot({path:path.join(ROOT,'phone-'+width+'-night.webp'),fullPage:true,type:'webp',quality:83});
  // Choosing the final avatar must retain the correct index and visible codename.
  await page.locator('[data-av="23"]').click();
  assert.ok(await page.locator('[data-av="23"]').evaluate(e=>e.classList.contains('on')));
  assert.ok((await page.locator('.body').innerText()).includes('ZEPHYR'));
  await page.locator('[data-act="join"]').scrollIntoViewIfNeeded();
  inside(await page.locator('[data-act="join"]').boundingBox(),width,'Join button @ '+width);
  // Contrast/accessibility theme: portraits stay present without losing IDs.
  await page.evaluate(()=>document.documentElement.setAttribute('data-theme','day'));
  assert.equal(await page.locator('[data-av] svg image').count(),24);
  await page.screenshot({path:path.join(ROOT,'phone-'+width+'-day.webp'),fullPage:true,type:'webp',quality:80});
  // Request the actual images from production, not just DOM placeholders.
  if(width===375){
   for(const av of avs){
    const res=await page.request.get(BASE+av.href,{timeout:12000});
    assert.equal(res.status(),200,'HTTP failure '+av.href);
    assert.match(res.headers()['content-type']||'',/image\/webp/);
    const blob=await res.body();
    assert.equal(blob.toString('ascii',0,4),'RIFF');
    assert.equal(blob.toString('ascii',8,12),'WEBP');
   }
   pass('24/24 live WebPs accessible from Render, correct MIME and RIFF/WEBP bytes');
  }
  verify();pass('phone '+width+'px: 24 uncropped, tap-sized, selectable agent portraits; no horizontal overflow');
 }finally{await context.close()}
}
async function tvCase(browser,width,height){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});
 const page=await context.newPage(),verify=issues(page,'TV '+width);
 try{
  const response=await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:45000});
  assert.equal(response.status(),200);
  await page.locator('[data-go="start"]').waitFor({timeout:12000});
  // Title must use installed local image, and stage must scale inside viewport.
  const info=await page.evaluate(()=>{
   const stage=document.querySelector('#stage');
   const rect=stage.getBoundingClientRect();
   const logo=document.querySelector('.logo');
   return {
    stage:{left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom},
    image:logo?getComputedStyle(logo).backgroundImage:null
   };
  });
  assert.ok(info.image&&info.image.includes('logo.webp'),'TV premium logo image missing');
  assert.ok(info.stage.left>=-3&&info.stage.right<=width+3&&info.stage.top>=-3&&info.stage.bottom<=height+3,
   'Scaled TV stage off-screen: '+JSON.stringify(info));
  await page.screenshot({path:path.join(ROOT,'tv-'+width+'x'+height+'-title.webp'),fullPage:false,type:'webp',quality:83});
  // Test tutorial visual navigation and caption, not audio audibility.
  await page.locator('[data-go="tutorial"]').click();
  await page.locator('[data-tut="1"]').waitFor();
  for(let n=0;n<11;n++){
   assert.ok(await page.locator('.caption').count()>0,'Missing chapter caption '+n);
   assert.ok(await page.locator('[data-tut="-1"]').count()>0,'Missing Previous in chapter '+n);
   assert.ok(await page.locator('[data-tut="1"]').count()>0,'Missing Next in chapter '+n);
   if(n===0||n===10)await page.screenshot({path:path.join(ROOT,'tv-'+width+'x'+height+'-tutorial-'+n+'.webp'),type:'webp',quality:85});
   if(n<10)await page.locator('[data-tut="1"]').click();
  }
  await page.locator('[data-tut="-1"]').click();
  await page.locator('[data-tut="1"]').click();
  verify();
  pass('TV '+width+'x'+height+': title graphic fits, all 11 tutorial steps have captions and navigation');
 }finally{await context.close()}
}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  for(const w of widths)await phoneCase(browser,w);
  for(const [w,h] of [[1920,1080],[1366,768],[1024,768]])await tvCase(browser,w,h);
  console.log('PASS: '+checks+' live Chromium visual checks; screenshots in '+ROOT);
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL LIVE VISUAL QA:',e.stack||String(e));process.exitCode=1});
