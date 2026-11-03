"""Original fully additive 112 BPM A-minor cyberpunk music layers, no model/audio external content.
Creates auditable, sample-locked procedural companion stems for Cyber Cypher.
"""
from pathlib import Path
import numpy as np, math, soundfile as sf, subprocess, json
SR=44100; BPM=112; N=6048000; BEAT=60.0/BPM
DST=Path('/mnt/data/cyber_audio_work/cyber-cypher/public/audio'); DST.mkdir(exist_ok=True,parents=True)
rng=np.random.default_rng(2035)
layer2=np.zeros((N,2),dtype=np.float32);layer3=np.zeros((N,2),dtype=np.float32)

# Original A minor progression with deliberately constrained harmonic movement
chords=[(45,48,52,57,59),(41,45,48,52,55),(38,41,45,52,57),(40,44,47,50,52)] # A2/F2/D2/E2

def hz(n):return 440.0*2.0**((n-69)/12)
def put(arr,start,data,amp=.5,pan=0):
    st=int(round(start*SR));
    if st>=N: return
    end=min(st+len(data),N)
    if end<=st: return
    p=max(-.99,min(.99,pan));l=math.sqrt((1-p)/2);r=math.sqrt((1+p)/2)
    seg=amp*data[:end-st]
    arr[st:end,0]+=seg*l;arr[st:end,1]+=seg*r

def env(n,attack,decay):
    t=np.arange(n,dtype=np.float64)/SR
    return (1-np.exp(-t/max(attack,1e-4)))*np.exp(-t/max(decay,1e-4))

def kick():
    dur=.45;n=int(SR*dur);t=np.arange(n)/SR
    freq=48+115*np.exp(-t/.022)
    phase=2*np.pi*np.cumsum(freq)/SR
    v=np.sin(phase)*np.exp(-t/.155) + .10*rng.normal(size=n)*np.exp(-t/.009)
    return np.tanh(1.35*v).astype(np.float32)

def snare():
    n=int(SR*.32);t=np.arange(n)/SR
    noise=rng.normal(size=n)
    hp=noise-np.convolve(noise,np.ones(41)/41,mode='same')
    v=0.56*hp*np.exp(-t/.092)+0.37*np.sin(2*np.pi*185*t)*np.exp(-t/.064)
    return np.tanh(v).astype(np.float32)

def hat(openhat=False):
    n=int(SR*(.22 if openhat else .1));t=np.arange(n)/SR
    noi=rng.normal(size=n)
    hp=noi-np.convolve(noi,np.ones(13)/13,mode='same')
    v=hp*np.exp(-t/(.076 if openhat else .026))
    return (v*.21).astype(np.float32)

def arp(note,secs=.34):
    n=int(SR*secs); t=np.arange(n)/SR;f=hz(note)
    # Analog synth pluck: detuned triangle/saw partials, soft bite, digital shimmer
    x=np.sin(2*np.pi*f*t)+.33*np.sin(2*np.pi*f*2*t+.15)+.15*np.sin(2*np.pi*f*3.004*t)
    x+=.12*np.sin(2*np.pi*f*.502*t)
    return (np.tanh(x*1.2)*env(n,.003,.15)*.56).astype(np.float32)

def lead(note,secs=.7):
    n=int(SR*secs);t=np.arange(n)/SR;f=hz(note)
    vib=np.sin(2*np.pi*5.3*t)*.004
    p=2*np.pi*f*(t+np.cumsum(vib)/SR)
    carrier=(.7*np.sin(p)+.22*np.sin(2*p+.5)+.14*np.sin(3*p+.17))
    sust=(1-np.exp(-t/.017))*np.minimum(1,np.maximum(0,(secs-t)/.12))
    return (np.tanh(carrier*1.45)*sust*.34).astype(np.float32)

K=kick(); S=snare(); H=hat(); OH=hat(True)
# Layer 2: precisely timed drum arrangement and repeating filtered arpeggio
for bar in range(64):
    cs=chords[(bar//4)%4]; root=cs[0]
    bar0=bar*4*BEAT
    # Deep kick on 1 and 3, ghost on 4-and in later sections
    for b in [0,2]+([3.5] if bar%8>=4 else []): put(layer2,bar0+b*BEAT,K,amp=.23,pan=0)
    for b in [1,3]:put(layer2,bar0+b*BEAT,S,amp=.17,pan=.05)
    for h in range(8):put(layer2,bar0+h*BEAT/2,H if h%4!=3 else OH,amp=.24 if h%2==0 else .17,pan=(-.3 if h%2 else .28))
    # Arp rhythmic eighths, subtly syncopated and sidechain-space before beats
    pattern=[root+24,root+31,root+36,root+28,root+33,root+36,root+31,root+40]
    for i,note in enumerate(pattern):put(layer2,bar0+i*BEAT/2,arp(note,secs=.27),amp=.20 if i in (0,4) else .15,pan=(-.47 if i%2 else .43))
# Layer 3: urgent hook only, avoids doubling drum or pad bed
melody=[(0,81),(0.75,84),(1.5,88),(2.5,83),(3,84),(3.5,81),
        (4.0,79),(4.75,81),(5.5,84),(6.0,88),(7.0,86),
        (8.0,77),(8.75,81),(9.5,84),(10.5,86),(11.25,81),
        (12.0,80),(12.75,83),(13.5,88),(14.25,89),(15,88)]
for block in range(4):
    t0=block*16*4*BEAT
    for b,note in melody:
        # relative offsets are beats across each 16-bar harmony block, repeat motivic hook every 4 bars
        for cyc in range(4):
            st=t0+(cyc*16+b)*BEAT
            put(layer3,st,lead(note,secs=.55 if b%1 else .67),amp=.19,pan=(-.23 if int(b)%2 else .25))
# Additional suspense buildup: filtered accelerating snare pulses in bars 4/8/12/16, always same loopable texture
for bar in range(64):
    t0=bar*4*BEAT
    for b in [0,2]:put(layer3,t0+b*BEAT,K,amp=.13)
    for b in [1,3]:put(layer3,t0+b*BEAT,S,amp=.08,pan=-.25)
    if bar%4==3:
        for i in range(8):put(layer3,t0+(2+i*.25)*BEAT,H,amp=(.09+.006*i),pan=.3 if i%2 else -.3)

# Per-stem static (not dynamic) control; all stems preserve 6,048,000 decoded samples.
def finalise(a,name):
    # Smooth periodic boundary locally, no fades throughout the track
    seam=round(.024*SR)
    blend=np.linspace(0,1,seam,dtype=np.float32)[:,None]
    a[-seam:]=(1-blend)*a[-seam:]+blend*a[:seam]
    peak=float(np.max(np.abs(a)))
    if peak>.7:a*=.7/peak
    # conservative layer gain, to leave headroom for AI foundational bed
    a*=0.84
    wav=DST/f'.{name}_master.wav';mp3=DST/f'{name}.mp3'
    sf.write(wav,a,SR,subtype='PCM_24')
    cmd=['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-af','loudnorm=I=-27:TP=-3:LRA=10:linear=true,aresample=44100','-ar','44100','-ac','2','-b:a','192k',str(mp3)]
    subprocess.run(cmd,check=True)
    wav.unlink()
    print(name,round(peak,4),mp3.stat().st_size,round(N/SR,3))

finalise(layer2,'mus_game_2');finalise(layer3,'mus_game_3')
