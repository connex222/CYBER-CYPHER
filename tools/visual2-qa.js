'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const file=p=>fs.readFileSync(path.join(root,p));
const paths=['lobby','board','results','zero-day'];
let fails=0;
function check(name,fn){try{fn();console.log('PASS',name)}catch(e){fails++;console.log('FAIL',name,'-',e.message)}}
check('approved art files present',()=>paths.forEach(p=>assert.ok(file('public/assets/visual2/'+p+'.webp').length>1000)));
check('TV and phone opt-in linker',()=>['public/tv.html','public/play.html'].forEach(p=>{const h=file(p).toString();assert.ok(h.includes('/visual2.css?v=2')&&h.includes('/visual2-loader.js?v=2'))}));
check('pre-existing 5x5 grid untouched',()=>{const h=file('public/tv.html').toString(),phone=file('public/play.html').toString();assert.ok(h.includes('grid-template-columns:repeat(5,1fr)'));assert.ok(phone.includes('grid-template-columns:repeat(5,1fr)'));});
check('safe loader requires all four assets',()=>{const js=file('public/visual2-loader.js').toString();for(const p of paths)assert.ok(js.includes('/assets/visual2/'+p+'.webp'));assert.ok(js.includes('Promise.all'));});
check('live card, score, QR and tutorial remain in source',()=>{const h=file('public/tv.html').toString();for(const s of ['function cardHtml','function gameHtml','class="qr"','function tutorialHtml'])assert.ok(h.includes(s),s)});
check('existing agent slots retained',()=>{for(let n=0;n<24;n++)assert.ok(file('public/assets/avatars/agent-'+String(n).padStart(2,'0')+'.webp').length>1000)});
console.log(fails?'VISUAL2 QA: FAILED ('+fails+')':'VISUAL2 QA: PASS');if(fails)process.exitCode=1;
