from pathlib import Path
import subprocess,re,json,numpy as np,hashlib
p=Path('/mnt/data/cyber_audio_work/cyber-cypher/public/audio')
out=[]
for f in sorted(p.glob('*.mp3')):
 b=subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(f),'-f','f32le','-acodec','pcm_f32le','-ac','2','-ar','44100','pipe:1'],capture_output=True,check=True).stdout
 a=np.frombuffer(b,dtype='<f4').reshape(-1,2)
 n=int(.5*44100)
 first=float(np.sqrt(np.mean(a[:n].astype('float64')**2)));last=float(np.sqrt(np.mean(a[-n:].astype('float64')**2)))
 delta=20*np.log10(max(first,1e-10)/max(last,1e-10))
 r=subprocess.run(['ffmpeg','-hide_banner','-i',str(f),'-filter_complex','ebur128=peak=true','-f','null','-'],capture_output=True,text=True)
 tail=r.stderr[r.stderr.rfind('Summary:'):]
 vals=re.findall(r'I:\s*(-?[\d.]+)\s*LUFS',tail)
 mp=re.findall(r'Peak:\s*[\s\S]*?(-?[\d.]+)\s*dBFS',tail)
 peak=float(np.max(np.abs(a)))
 out.append({'filename':f.name,'bytes':f.stat().st_size,'decoded_samples':len(a),'decoded_seconds':round(len(a)/44100,3),'rms_start_0_5s':round(first,6),'rms_end_0_5s':round(last,6),'rms_delta_db':round(abs(delta),3),'integrated_lufs':float(vals[-1]) if vals else None,'decoded_peak_dbfs':round(20*np.log10(peak),2),'md5':hashlib.md5(f.read_bytes()).hexdigest()})
print(json.dumps(out,indent=2))
Path('/mnt/data/cyber_audio_work/cyber-cypher/AUDIO-LOCAL-QA.json').write_text(json.dumps(out,indent=2)+'\n')
