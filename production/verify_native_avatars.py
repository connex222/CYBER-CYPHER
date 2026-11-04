#!/usr/bin/env python3
"""Read-only production QA for one complete set of 24 native CYBER CYPHER avatars."""
from pathlib import Path
import argparse
import hashlib
import json
import re
from PIL import Image, ImageStat

NAMES=[
 "Static","Cipher","Neon","Glitch","Vector","Pixel","Nova","Rook",
 "Echo","Flux","Kestrel","Onyx","Juno","Halcyon","Quark","Raven",
 "Siren","Tango","Umbra","Volta","Wraith","Xeno","Yara","Zephyr",
]

def dhash(im):
 im=im.convert("L").resize((9,8),Image.Resampling.LANCZOS)
 pixels=list(im.getdata())
 bits=0
 for y in range(8):
  for x in range(8):
   bits=(bits<<1)|int(pixels[y*9+x]>pixels[y*9+x+1])
 return bits

def check(root):
 folder=root/"public/assets/avatars"
 expected=[folder/f"agent-{i:02d}.webp" for i in range(24)]
 actual=sorted(folder.glob("agent-*.webp"))
 assert actual==expected, f"Need exactly 24 contiguous avatar files. Missing: {[p.name for p in expected if p not in actual]}; extras: {[p.name for p in actual if p not in expected]}"
 shared=(root/"tools/shared.js").read_text(encoding="utf8")
 m=re.search(r"var AVATAR_NAMES\s*=\s*\[([^]]+)\];",shared,re.S)
 assert m, "Shared game avatar-name mapping is absent"
 names=re.findall(r"'([^']+)'",m.group(1))
 assert names==NAMES, f"Avatar identity / ID order changed: {names!r}"
 data=[];hashes=set();perceptual=[]
 for i,file in enumerate(expected):
  raw=file.read_bytes()
  assert raw[:4]==b"RIFF" and raw[8:12]==b"WEBP",f"Invalid WebP: {file}"
  assert 2000<=len(raw)<60000,f"Avatar must be 2–60 kB: {file}"
  sha=hashlib.sha256(raw).hexdigest()
  assert sha not in hashes,f"Exact duplicate portrait: {file}"
  hashes.add(sha)
  with Image.open(file) as img:
   img.load()
   assert img.format=="WEBP" and img.size==(256,256),(file,img.size,img.format)
   assert img.mode in ("RGB","RGBA"),(file,img.mode)
   gray=img.convert("L").resize((48,48),Image.Resampling.LANCZOS)
   assert ImageStat.Stat(gray).stddev[0]>8,f"Indistinct avatar at phone scale: {file}"
   perceptual.append(dhash(img))
  data.append({"id":i,"name":NAMES[i],"path":file.relative_to(root).as_posix(),
               "bytes":len(raw),"sha256":sha})
 near=[{"a":i,"b":j,"distance":(perceptual[i]^perceptual[j]).bit_count()}
       for i in range(24) for j in range(i+1,24)
       if (perceptual[i]^perceptual[j]).bit_count()<=4]
 assert not near,f"Near-duplicate avatar portraits: {near}"
 total=sum(x["bytes"] for x in data)
 assert total<=1500000,f"Total native avatar budget exceeded: {total}"
 return {"status":"PASS","images":24,"totalBytes":total,"uniqueSHA256":24,
         "nearDuplicatePairs":near,"idsPreserved":True,
         "humanVisualReviewStillRequired":True,"files":data}

if __name__=="__main__":
 p=argparse.ArgumentParser()
 p.add_argument("root",nargs="?",default=".")
 p.add_argument("--report")
 a=p.parse_args()
 result=check(Path(a.root).resolve())
 if a.report:Path(a.report).write_text(json.dumps(result,indent=2)+"\n",encoding="utf8")
 print(f"PASS: 24 separately named, unique 256x256 WebP images; {result['totalBytes']} bytes.")
