'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const s=fs.readFileSync('server.js','utf8');
new vm.Script(s,{filename:'server.js'});
assert.match(s,/send\(ws,'serverRestarting'/);
assert.match(s,/ws\.close\(1012,'Server restarting'\)/);
assert.match(s,/process\.once\('SIGTERM'/);
assert.match(s,/clearInterval\(gameTimer\)/);
assert.match(s,/clearInterval\(heartbeatTimer\)/);
assert.match(s,/if \(shuttingDown\) return/);
assert.match(s,/shutdown exceeded 9\.5 seconds/);
for(const file of ['public/tv.html','public/play.html']){
 const h=fs.readFileSync(file,'utf8');
 assert.match(h,/m\.t === 'serverRestarting'/);
 assert.match(h,/self\.onStatus\('restarting'\)/);
 for(const match of h.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi))
  if(match[1].trim())new vm.Script(match[1],{filename:file});
}
console.log('PASS CYBER CYPHER restart 1012, origin guard preservation and TV/phone script syntax');
