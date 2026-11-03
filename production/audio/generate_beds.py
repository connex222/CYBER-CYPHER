from pathlib import Path
import numpy as np, math, subprocess,soundfile as sf
SR=44100
out=Path('/mnt/data/cyber_audio_work/cyber-cypher/public/audio');out.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(35)
def freq(m):return 440*2**((m-69)/12)
def add(a,sec,v,amp=.2,pan=0):
 k=int(round(sec*SR));q=min(len(a),k+len(v));
 if q<=k:return
 l=np.sqrt((1-pan)/2);r=np.sqrt((1+pan)/2)
 a[k:q,0]+=v[:q-k]*amp*l;a[k:q,1]+=v[:q-k]*amp*r
def tone(m,d=.45,decay=.4,attack=.008):
 n=int(d*SR);t=np.arange(n)/SR;hz=freq(m)
 vibr=.0004*np.sin(2*np.pi*4*t)
 p=2*np.pi*hz*(t+vibr)
 v=np.sin(p)+.23*np.sin(2*p+.25)+.06*np.sin(3*p+.7)
 env=(1-np.exp(-t/attack))*np.exp(-t/decay)
 return np.tanh(v*1.15).astype('float32')*env.astype('float32')
def pad(m,d=4.0):
 n=int(d*SR);t=np.arange(n)/SR;f=freq(m)
 v=np.sin(2*np.pi*f*t)+.27*np.sin(2*np.pi*f*1.004*t)+.17*np.sin(2*np.pi*2*f*t)
 e=(1-np.exp(-t/.35))*(1-np.exp(-(d-t)/.5))
 return (np.tanh(v)*e*.45).astype('float32')
def tick():
 n=int(SR*.055);t=np.arange(n)/SR;noise=rng.normal(size=n)
 v=(noise-.5*np.roll(noise,1))*np.exp(-t/.012)
 return (v*.2).astype('float32')

def make(name,bpm,bars,main):
 N=int(round(SR*bars*4*60/bpm));a=np.zeros((N,2),dtype=np.float32);beat=60/bpm;T=tick()
 chords=[[45,48,52,55],[41,45,48,52],[38,41,45,48],[40,44,47,50]]
 for bar in range(bars):
  b0=bar*beat*4; chord=chords[(bar//4)%4]
  # pad chord changes every four bars: stable harmonic foundation
  if bar%4==0:
   for j,n in enumerate(chord):add(a,b0,pad(n+12,d=min(4*4*beat+1.2,(N/SR-b0))),amp=.10,pan=(-.5+.33*j))
  bassnote=chord[0]
  for b in range(4):
   add(a,b0+b*beat,tone(bassnote,.38,.20),amp=.21 if main else .16,pan=0)
   if b%2==0:add(a,b0+b*beat,T,amp=.26 if main else .13,pan=.35)
  if main:
   for b in range(8):
    if b%2==1:add(a,b0+b*beat/2,T,amp=.14,pan=(-.48 if b%3 else .35))
  # Lobby: clearer repeating motif, game bed: quiet note fragments only
  if not main:
   melody=[69,72,76,71,72,76,79,76] if (bar//4)%2==0 else [69,71,72,76,79,76,72,71]
   for i,n in enumerate(melody):add(a,b0+i*beat/2,tone(n,0.41,.24),amp=.19,pan=(-.35 if i%2 else .37))
  elif bar%2==0:
   for i,n in enumerate([chord[1]+24,chord[2]+24,chord[1]+24,chord[3]+24]):
    add(a,b0+(i+.25)*beat,tone(n,.38,.25),amp=.047,pan=(-.35 if i%2 else .35))
  if main and bar%8==7:
   # subtle clock rising before change, without cinematic build
   for i in range(8):add(a,b0+(2+i*.25)*beat,T,amp=.045+i*.006,pan=(-.1 if i%2 else .3))
 # seam blend last 20ms to exactly first waveform to avoid click
 seam=int(.02*SR);p=np.linspace(0,1,seam)[:,None];a[-seam:]=(1-p)*a[-seam:]+p*a[:seam]
 peak=np.max(np.abs(a));a*=.72/max(peak,.72)
 wav=out/f'.{name}.wav';dest=out/f'{name}.mp3';sf.write(wav,a,SR,subtype='PCM_24')
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-af','loudnorm=I=-20:TP=-1.5:LRA=10:linear=true,aresample=44100','-ar','44100','-ac','2','-b:a','192k',str(dest)],check=True)
 wav.unlink();print(name,dest.stat().st_size,'bytes',f'{N/SR:.3f}','s')
make('mus_lobby',100,32,False)
make('mus_game_1',112,64,True)
