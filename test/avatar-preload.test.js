'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'..','tools','shared.js'),'utf8');
function makeBrowser(){
 const images=[];
 function FakeImage(){this.naturalWidth=256;images.push(this);}
 Object.defineProperty(FakeImage.prototype,'src',{get(){return this._src},set(u){this._src=u}});
 FakeImage.prototype.decode=function(){return Promise.resolve()};
 const context={Image:FakeImage,Promise,setTimeout:()=>1,clearTimeout:()=>{},console};
 vm.runInNewContext(source,context);
 return {images,CC:context.CC};
}
async function flush(){await new Promise(resolve=>setImmediate(resolve));}

test('all 24 premium portraits are preloaded before they are enabled together',async()=>{
 const b=makeBrowser(),completed=[];
 b.CC.detectArt(()=>completed.push('ready'));
 assert.equal(b.images.length,24);
 assert.equal(new Set(b.images.map(i=>i.src)).size,24);
 assert.deepEqual(b.images.map(i=>i.src),Array.from({length:24},(_,i)=>'/assets/avatars/agent-'+String(i).padStart(2,'0')+'.webp'));
 assert.doesNotMatch(b.CC.avatar(0),/<image /,'Initial screen must not show half-loaded art');
 for(let i=0;i<23;i++)b.images[i].onload();
 await flush();
 assert.equal(completed.length,0,'One outstanding portrait must block entire set');
 assert.doesNotMatch(b.CC.avatar(0),/<image /,'SVG fallback must remain during loading');
 b.images[23].onload();await flush();
 assert.equal(completed.length,1);
 assert.match(b.CC.avatar(0),/<image /);
 assert.match(b.CC.avatar(23),/agent-23\.webp/);
});

test('failed avatar request safely preserves every SVG placeholder',async()=>{
 const b=makeBrowser();
 let renders=0;
 b.CC.detectArt(()=>renders++);
 b.images[17].onerror();
 for(let i=0;i<24;i++)if(i!==17)b.images[i].onload();
 await flush();
 assert.equal(renders,0);
 assert.doesNotMatch(b.CC.avatar(0),/<image /);
 assert.doesNotMatch(b.CC.avatar(17),/<image /);
 assert.doesNotMatch(b.CC.avatar(23),/<image /);
});

test('two waiting screens share one preload and each redraw exactly once',async()=>{
 const b=makeBrowser();
 let first=0,second=0;
 b.CC.detectArt(()=>first++);
 b.CC.detectArt(()=>second++);
 assert.equal(b.images.length,24,'Must never repeat 24 parallel requests for second observer');
 for(const im of b.images)im.onload();
 await flush();
 assert.equal(first,1);assert.equal(second,1);
 b.CC.detectArt(()=>first++);
 assert.equal(first,2,'Already-cached art callback is immediate');
 assert.equal(b.images.length,24);
});
