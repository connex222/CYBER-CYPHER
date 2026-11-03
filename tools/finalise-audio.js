#!/usr/bin/env node
'use strict';
/*
 * Finalise five previously flagged audio assets without creating new media.
 * All processing is offline, reversible on failure and keeps HALO Voice 1 untouched.
 */
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const cp=require('node:child_process');
const assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const AUDIO=path.join(ROOT,'public','audio');
const REPORT=path.join(ROOT,'AUDIO-QA.json');
const VOICE_REPORT=path.join(ROOT,'production','HALO-VOICE-QA.json');
const SOURCES=require(path.join(ROOT,'AUDIO-SOURCES.json'));
const VOICE_LIMIT=20*1024*1024;
const FIXES=[
  {name:'clue_arrive.mp3',kind:'effect',peakMax:-3},
  {name:'reveal_ice.mp3',kind:'effect',peakMax:-3},
  {name:'turn_change.mp3',kind:'effect',peakMax:-3},
  {name:'mus_win.mp3',kind:'sting',minDuration:5,maxDuration:7,cutAt:6.75,fadeStart:6.30,fadeDuration:.45},
  {name:'mus_lose.mp3',kind:'sting',minDuration:4,maxDuration:6,cutAt:5.75,fadeStart:5.30,fadeDuration:.45},
];
const opts=new Set(process.argv.slice(2));
function run(program,args){
  const p=cp.spawnSync(program,args,{encoding:'utf8',maxBuffer:32*1024*1024});
  if(p.error||p.status!==0)throw Error(program+' failed: '+(p.error||p.stderr||p.stdout||p.status));
  return p.stdout;
}
function hash(file){return crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');}
function probe(file){
 const x=JSON.parse(run('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_name,channels,sample_rate,bit_rate','-of','json',file]));
 const st=x.streams&&x.streams[0]||{};
 return {duration:Number(x.format.duration),bytes:Number(x.format.size),codec:st.codec_name,channels:Number(st.channels),sample_rate:Number(st.sample_rate),bit_rate:Number(st.bit_rate)};
}
function measure(file){
 const p=cp.spawnSync('ffmpeg',['-hide_banner','-nostdin','-i',file,'-filter_complex','ebur128=peak=true','-f','null',os.devNull],{encoding:'utf8',maxBuffer:32*1024*1024});
 if(p.error||p.status!==0)throw Error('FFmpeg loudness analysis failed: '+file+' '+(p.stderr||p.error));
 const out=p.stderr||'';
 const n=out.lastIndexOf('Summary:');
 const tail=n<0?out.slice(-2200):out.slice(n);
 const v=tail.match(/I:\s*(-?[\d.]+)\s*LUFS/);
 const peak=tail.match(/Peak:\s*([\s\S]*?)dBFS/);
 const t=peak&&peak[1].match(/(-?[\d.]+)\s*$/);
 return {integrated_lufs:v?Number(v[1]):null,true_peak_dbfs:t?Number(t[1]):null};
}
function describe(file){
 const x=probe(file);return {...x,...measure(file),md5:hash(file),present:true};
}
const scriptLines=Object.create(null);
for(const ln of fs.readFileSync(path.join(ROOT,'ASSET-MANIFEST.md'),'utf8').split(/\r?\n/)){
 const m=ln.match(/^\|\s*public\/audio\/(vo_[\w]+\.mp3)\s*\|\s*(.*?)\s*\|/);
 if(m)scriptLines[m[1]]=m[2];
}
function minVoiceDuration(name){
 const words=(scriptLines[name]||'').match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)||[];
 return Math.max(.5,.19*words.length);
}
function fullAudit(original){
 const names=Object.keys(SOURCES);
 for(const n of ['mus_lobby.mp3','mus_game_2.mp3','mus_game_3.mp3'])if(!names.includes(n))names.push(n);
 assert.equal(names.length,73,'Expected 73 original audio names');
 const rows=[],failures=[];
 for(const name of names){
   const full=path.join(AUDIO,name);
   if(!fs.existsSync(full)){rows.push({name,present:false});failures.push({name,error:'Missing file'});continue;}
   const x={name,...describe(full)};
   rows.push(x);
   if(x.codec!=='mp3'||x.sample_rate!==44100)failures.push({name,error:'Wrong codec / sample rate'});
   if(name.startsWith('vo_')){
     if(x.channels!==1||x.duration<minVoiceDuration(name)||!Number.isFinite(x.integrated_lufs)||x.integrated_lufs < -21||x.integrated_lufs > -12||!Number.isFinite(x.true_peak_dbfs)||x.true_peak_dbfs > -1.35)
       failures.push({name,error:'Narration fails voice spec: length, channels, loudness or peak'});
   }else if(name.startsWith('mus_')){
     if(x.channels!==2)failures.push({name,error:'Music is not stereo'});
   }else if(x.channels!==1)failures.push({name,error:'SFX is not mono'});
 }
 const targetNames=new Set(FIXES.map(x=>x.name));
 // Protected narration and all unaffected music / SFX must stay byte-for-byte identical.
 for(const row of rows){
   const prev=original.files.find(f=>f.name===row.name);
   if(!targetNames.has(row.name)&&prev&&prev.md5!==row.md5)failures.push({name:row.name,error:'Non-target audio changed; abort'});
 }
 const defectiveVoices=failures.filter(f=>f.name.startsWith('vo_'));
 const peakEffectIssues=rows.filter(x=>x.present&&!x.name.startsWith('vo_')&&!x.name.startsWith('mus_')&&(!Number.isFinite(x.true_peak_dbfs)||x.true_peak_dbfs>-3)).map(x=>({name:x.name,true_peak_dbfs:x.true_peak_dbfs}));
 const musicDurationIssues=rows.filter(x=>x.present&&((x.name==='mus_win.mp3'&&!(x.duration>=5&&x.duration<=7))||(x.name==='mus_lose.mp3'&&!(x.duration>=4&&x.duration<=6)))).map(x=>({name:x.name,duration:x.duration}));
 const bytes=rows.reduce((sum,x)=>sum+(x.bytes||0),0);
 const voices=rows.filter(x=>x.name.startsWith('vo_'));
 const voiceQAComplete=voices.length===45&&voices.every(x=>x.present)&&defectiveVoices.length===0;
 const success=failures.length===0&&peakEffectIssues.length===0&&musicDurationIssues.length===0&&voiceQAComplete&&bytes<=VOICE_LIMIT;
 return {
  generatedAt:new Date().toISOString(),ffmpeg:true,complete:success,productionReady:success,
  voiceQAComplete,voiceCount:voices.length,voiceVersion:original.voiceVersion||'2026-11-03-HALO-FULL',
  totalBytes:bytes,under20MiB:bytes<=VOICE_LIMIT,defectiveVoices,peakEffectIssues,musicDurationIssues,
  files:rows,failures,
  auditMethod:'Independent local FFprobe/FFmpeg ebur128 analysis of all 73 existing MP3s; MD5 preservation check for the other 68 files',
  correctedFiles:FIXES.map(x=>x.name)
 };
}
function convert(spec,dst){
 const input=path.join(AUDIO,spec.name);
 const isSfx=spec.kind==='effect';
 const filter=isSfx?'volume=-3.0dB':
   'atrim=start=0:duration='+spec.cutAt+',asetpts=PTS-STARTPTS,afade=t=out:st='+spec.fadeStart+':d='+spec.fadeDuration;
 run('ffmpeg',['-hide_banner','-nostdin','-loglevel','error','-y','-i',input,'-vn','-af',filter,'-ar','44100','-ac',isSfx?'1':'2','-c:a','libmp3lame','-b:a',isSfx?'128k':'192k',dst]);
 const p=describe(dst);
 if(p.codec!=='mp3'||p.sample_rate!==44100||p.channels!==(isSfx?1:2))throw Error('Encoding invalid: '+spec.name);
 if(isSfx && (!Number.isFinite(p.true_peak_dbfs)||p.true_peak_dbfs > -3))throw Error('Sound effect still too loud: '+spec.name+' '+p.true_peak_dbfs+' dBFS');
 if(!isSfx && (p.duration<spec.minDuration||p.duration>spec.maxDuration))throw Error('Sting duration outside range: '+spec.name+' '+p.duration);
 if(!Number.isFinite(p.integrated_lufs)||p.integrated_lufs< -27||p.integrated_lufs > -12)throw Error('Invalid audible loudness: '+spec.name);
 console.log('PREPARED',spec.name,'duration='+p.duration.toFixed(3)+'s','LUFS='+p.integrated_lufs,'peak='+p.true_peak_dbfs);
}
function main(){
 run('ffmpeg',['-version']);run('ffprobe',['-version']);
 const original=JSON.parse(fs.readFileSync(REPORT,'utf8'));
 if(original.files.length!==73)throw Error('Unexpected original audio manifest');
 const voice=JSON.parse(fs.readFileSync(VOICE_REPORT,'utf8'));
 assert.equal(voice.complete,true,'HALO voice QA must be healthy before finalising the rest');
 assert.equal(voice.voiceCount,45,'HALO voice count changed');
 if(opts.has('--verify-only')){
   const report=fullAudit(original);
   if(!report.productionReady)throw Error('Final audio verification incomplete: '+JSON.stringify({failures:report.failures,peak:report.peakEffectIssues,music:report.musicDurationIssues}));
   console.log('PASS all 73 MP3 files; protected 45 HALO recordings unchanged, no failed peaks or stings');
   return;
 }
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'cyber-cypher-audio-final-'));
 const before=Object.fromEntries(FIXES.map(x=>[x.name,fs.readFileSync(path.join(AUDIO,x.name))]));
 let written=false;
 try{
   for(const spec of FIXES)convert(spec,path.join(temp,spec.name));
   // Replace only once every candidate has passed independent checks.
   written=true; // Roll back even if only the first of five renames succeeded.
   for(const spec of FIXES)fs.renameSync(path.join(temp,spec.name),path.join(AUDIO,spec.name));
   const report=fullAudit(original);
   if(!report.productionReady)throw Error('Full 73-file QA failed: '+JSON.stringify({failures:report.failures,peaks:report.peakEffectIssues,durations:report.musicDurationIssues,bytes:report.totalBytes}));
   // Publishing this updated report is the last step; the workflow commits it with the 5 MP3s.
   fs.writeFileSync(REPORT,JSON.stringify(report,null,2)+'\n','utf8');
   console.log('PASS productionReady=true; 73/73 audio files; 45/45 preserved HALO files; total bytes',report.totalBytes);
 }catch(err){
   if(written)for(const [name,blob] of Object.entries(before))fs.writeFileSync(path.join(AUDIO,name),blob);
   throw err;
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
main();
