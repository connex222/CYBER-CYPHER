'use strict';
/** CYBER CYPHER: user-run audio fetch/master/QA. Existing game source is untouched. */
const fs=require('node:fs'); const path=require('node:path'); const https=require('node:https');
const crypto=require('node:crypto'); const os=require('node:os'); const cp=require('node:child_process');
const root=path.resolve(__dirname,'..'); const target=path.join(root,'public','audio');
const sources=require(path.join(root,'AUDIO-SOURCES.json'));
const temp=path.join(os.tmpdir(),'CYBER-CYPHER-AUDIO-'+process.pid);
const args=new Set(process.argv.slice(2));
const verifyOnly=args.has('--verify-only'); const remaster=args.has('--remaster');
const compactNames=['mus_lobby.mp3','mus_game_1.mp3','mus_game_2.mp3','mus_game_3.mp3'];
const fxTime={ui_tap:.12,ui_join:.4,ui_back:.15,clue_arrive:.8,ping:.12,ping_remove:.12,breach_start:1.6,breach_cancel:.3,reveal_volt:.6,reveal_flare:.6,reveal_noise:.5,reveal_ice:.7,reveal_zero:1.2,turn_change:.8,timer_warn:.06,timer_end:.8,ice_claim:.6,pass:.4,mole_reveal:1.2,glitch:.25,react:.15};
const musTime={mus_title:153.6,mus_lobby:76.8,mus_game_1:6048000/44100,mus_game_2:6048000/44100,mus_game_3:6048000/44100,mus_win:6,mus_lose:5};
function proc(cmd,a){let r=cp.spawnSync(cmd,a,{encoding:'utf8',maxBuffer:32*1024*1024});return r;}
function has(cmd){let r=proc(cmd,['-version']);return !r.error&&r.status===0;}
function download(url,dest,redirs=0){return new Promise((resolve,reject)=>{
 if(redirs>5)return reject(new Error('Too many redirects'));
 if(!/^https:\/\/cdn\.creativeclaw\.co\//.test(url))return reject(new Error('Unexpected host: '+url));
 https.get(url,{headers:{'User-Agent':'Cyber-Cypher-Asset-Installer/1.0'},timeout:45000},res=>{
  if([301,302,303,307,308].includes(res.statusCode)){let redirect=res.headers.location;res.resume();return download(redirect,dest,redirs+1).then(resolve,reject);}
  if(res.statusCode!==200){res.resume();return reject(new Error('HTTP '+res.statusCode));}
  let f=fs.createWriteStream(dest);res.pipe(f);f.on('finish',()=>f.close(()=>resolve()));f.on('error',reject);
 }).on('timeout',function(){this.destroy(new Error('Timeout'))}).on('error',reject);
 });}
function runFfmpeg(inp,dst,filter,codecBitRate,channels){
 const command=['-hide_banner','-nostdin','-loglevel','error','-y','-i',inp,'-vn','-af',filter,'-ar','44100','-ac',String(channels),'-codec:a','libmp3lame','-b:a',codecBitRate,dst];
 let r=proc('ffmpeg',command);if(r.status!==0)throw new Error(r.stderr||'FFmpeg failure');
}
function makeVoiceFilter(input){
 const prep='aformat=channel_layouts=mono,aresample=44100,silenceremove=start_periods=1:start_silence=0:start_threshold=-50dB:stop_periods=1:stop_silence=0:stop_threshold=-50dB,adelay=50,apad=pad_dur=0.05';
 return prep;
}
function masterTwoPass(inp,dst,kind){
 const loud=kind==='voice'?-16:-20;const rate=kind==='voice'?'160k':'192k';
 const prep=kind==='voice'?makeVoiceFilter(inp):'aformat=channel_layouts=stereo,aresample=44100';
 const base=`loudnorm=I=${loud}:TP=-1.5:LRA=10`;
 const first=proc('ffmpeg',['-hide_banner','-nostdin','-y','-i',inp,'-vn','-af',prep+','+base+':print_format=json','-f','null',os.devNull]);
 const text=(first.stderr||''); const parts=[...text.matchAll(/\{\s*"input_i"[\s\S]*?\}/g)];
 let filter=prep+','+base;
 if(parts.length){
  try{const o=JSON.parse(parts.at(-1)[0]);const fields=[['measured_I','input_i'],['measured_TP','input_tp'],['measured_LRA','input_lra'],['measured_thresh','input_thresh'],['offset','target_offset']];
   if(fields.every(([a,b])=>Number.isFinite(Number(o[b]))))filter+=fields.map(([a,b])=>`:${a}=${o[b]}`).join('')+':linear=true';
  }catch(e){}
 }
 filter+=',aresample=44100';
 runFfmpeg(inp,dst,filter,rate,kind==='voice'?1:2);
}
function masterEffect(inp,dst,name){
 const length=fxTime[name];if(!length)throw Error('Unknown SFX '+name);
 const t=Math.max(0,length-.022);
 const f=`aformat=channel_layouts=mono,aresample=44100,silenceremove=start_periods=1:start_silence=0:start_threshold=-50dB,atrim=start=0:duration=${length},asetpts=PTS-STARTPTS,afade=t=out:st=${t}:d=0.022,volume=-3.2dB,alimiter=limit=0.70:level=false`;
 runFfmpeg(inp,dst,f,'128k',1);
}
function parseProbe(filepath){const p=proc('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_name,sample_rate,channels,bit_rate','-of','json',filepath]);if(p.status!==0)return null;let x=JSON.parse(p.stdout||'{}');return {duration:Number(x.format?.duration||0),bytes:Number(x.format?.size||0),codec:x.streams?.[0]?.codec_name,sample_rate:Number(x.streams?.[0]?.sample_rate),channels:Number(x.streams?.[0]?.channels),bit_rate:Number(x.streams?.[0]?.bit_rate)};}
function measure(filepath){
 // Independent post-master inspection: R128 integrated LUFS and sample peak
 const r=proc('ffmpeg',['-hide_banner','-nostdin','-i',filepath,'-filter_complex','ebur128=peak=true','-f','null',os.devNull]);
 const x=r.stderr||'';const idx=x.lastIndexOf('Summary:');const tail=idx>=0?x.slice(idx):x.slice(-1500);
 const I=tail.match(/I:\s*(-?[\d.]+)\s*LUFS/);
 const pk=tail.match(/Peak:\s*([\s\S]*?)dBFS/);
 let val=null;if(pk){const m=pk[1].match(/(-?[\d.]+)\s*$/);if(m)val=Number(m[1]);}
 return {integrated_lufs:I?Number(I[1]):null,true_peak_dbfs:val};
}
function rmsHalf(filepath){
 const data=proc('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-i',filepath,'-f','f32le','-acodec','pcm_f32le','-ac','1','-ar','44100','-']);
 if(data.error||data.status!==0)return null;
 // Binary is incompatible with encoding utf8 from proc. Report left unknown; use the dedicated Python QA if needed.
 return null;
}
async function main(){
 console.log('CYBER CYPHER — INSTALL AND VERIFY AUDIO');
 console.log('All game code, rules, secret messages and existing files stay unchanged.');
 fs.mkdirSync(target,{recursive:true});fs.mkdirSync(temp,{recursive:true});
 const ffmpeg=has('ffmpeg'),ffprobe=has('ffprobe');
 console.log('FFmpeg detected:',ffmpeg?'YES — full mastering enabled':'NO — source recordings will be installed without mastering');
 if(!ffmpeg)console.log('To install FFmpeg: open CMD and run: winget install --id Gyan.FFmpeg --exact');
 const job=Object.entries(sources).filter(([name])=>!compactNames.includes(name));
 let failures=[],processed=0;
 for(const [name,record] of job){
  const out=path.join(target,name);
  if(verifyOnly||(fs.existsSync(out)&&!remaster)){if(!verifyOnly)console.log('EXISTS',name);continue;}
  const incoming=path.join(temp,name);
  try{
   await download(record.url,incoming);
   if(fs.statSync(incoming).size<300)throw new Error('Downloaded file unexpectedly small');
   if(ffmpeg){
    if(record.kind==='voice')masterTwoPass(incoming,out,'voice');
    else if(record.kind==='sfx')masterEffect(incoming,out,name.replace(/\.mp3$/,''));
    else masterTwoPass(incoming,out,'music');
   }else fs.copyFileSync(incoming,out);
   processed++;console.log('OK',name,'('+Math.round(fs.statSync(out).size/1024)+' KB)');
  }catch(e){failures.push({name,error:String(e)});console.error('FAILED',name,String(e));}
  finally{try{fs.unlinkSync(incoming)}catch{}}
 }
 const rows=[];for(const name of [...Object.keys(sources),'mus_lobby.mp3','mus_game_2.mp3','mus_game_3.mp3']){
  if(rows.some(x=>x.name===name))continue;
  const f=path.join(target,name);if(!fs.existsSync(f)){rows.push({name,present:false});continue;}
  let p=ffprobe?parseProbe(f):null;
  let item={name,present:true,...p,md5:crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex')};
  // Signal compliance depends on having ffmpeg; only report measured results.
  if(ffmpeg){const m=measure(f);item={...item,...m};}
  rows.push(item);
 }
 const bytes=fs.readdirSync(target).filter(f=>f.endsWith('.mp3')).reduce((n,f)=>n+fs.statSync(path.join(target,f)).size,0);
 const result={generatedAt:new Date().toISOString(),ffmpeg,complete:rows.every(x=>x.present),totalBytes:bytes,under20MiB:bytes<=20*1024*1024,files:rows,failures};
 fs.writeFileSync(path.join(root,'AUDIO-QA.json'),JSON.stringify(result,null,2)+'\n');
 console.log('\nFiles:',rows.filter(x=>x.present).length,'/',rows.length,'— audio MiB:',(bytes/1024/1024).toFixed(2));
 console.log('Report: AUDIO-QA.json');
 if(!ffmpeg||!result.complete||!result.under20MiB||failures.length)console.log('WARNING: QA not complete. Review missing files, limits and/or FFmpeg installation.');
 try{fs.rmSync(temp,{recursive:true,force:true})}catch{}
}
main().catch(e=>{console.error(e.stack||String(e));process.exitCode=1;});
