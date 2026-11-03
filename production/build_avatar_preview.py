#!/usr/bin/env python3
"""Fetch a pre-existing 3x2 premium avatar atlas and produce six proof-only WebPs.

Important: Never writes public/assets/avatars; the game detects agent-00 globally.
"""
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
import io
import json
import hashlib
from PIL import Image, ImageOps, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "production" / "avatar-atlas-preview.json"
OUT = ROOT / "production" / "avatar-preview"
CAP = 64_000

def main():
    data = json.loads(SOURCE.read_text("utf-8"))
    assert data["layout"] == {"columns": 3, "rows": 2}
    assert data["ids"] == list(range(6))
    assert len(data["names"]) == 6
    url = data["source"]
    u = urlsplit(url)
    if u.scheme != "https" or u.hostname != "cdn.creativeclaw.co" or not u.path.endswith(".png"):
        raise ValueError("Untrusted avatar image source")
    req = Request(url, headers={"User-Agent": "Cyber-Cypher-avatar-proof/1.0"})
    with urlopen(req, timeout=80) as r:
        png = r.read(20*1024*1024+1)
    if not png.startswith(b"\x89PNG\r\n\x1a\n") or len(png) > 20*1024*1024:
        raise ValueError("Source is not a valid PNG under 20 MiB")
    with Image.open(io.BytesIO(png)) as image:
        image.load()
        image = image.convert("RGB")
    w,h = image.size
    if w < 1200 or h < 780 or not (1.30 <= w/h <= 1.80):
        raise ValueError("Avatar atlas resolution or aspect is inconsistent with 3x2 portraits")
    OUT.mkdir(parents=True,exist_ok=True)
    records = []
    for row in range(2):
        for col in range(3):
            i = row*3 + col
            # Boundaries directly reflect the generated 3x2 grid.
            x0 = round(w*col/3)
            x1 = round(w*(col+1)/3)
            y0 = round(h*row/2)
            y1 = round(h*(row+1)/2)
            frame = image.crop((x0,y0,x1,y1))
            frame = ImageOps.fit(frame, (256,256), method=Image.Resampling.LANCZOS, centering=(.5,.5))
            blob = None
            for quality in (88,84,80,76,72,68,64,60,56):
                mem=io.BytesIO()
                frame.save(mem,"WEBP",quality=quality,method=6)
                if len(mem.getvalue()) < CAP:
                    blob=mem.getvalue()
                    break
            if blob is None: raise RuntimeError("Avatar preview exceeds 64KB")
            file=OUT / f"agent-{i:02d}.webp"
            file.write_bytes(blob)
            records.append({"id":i,"name":data["names"][i],"path":file.relative_to(ROOT).as_posix(),
                            "dimensions":[256,256],"bytes":len(blob),"sha256":hashlib.sha256(blob).hexdigest()})
    # Provide full identity overview without changing game files.
    sheet = Image.new("RGB", (768,512), "#05070D")
    for i in range(6):
        with Image.open(OUT/f"agent-{i:02d}.webp") as av:
            sheet.paste(av.convert("RGB"),((i%3)*256,(i//3)*256))
    sheet.save(OUT/"preview-sheet.webp",format="WEBP",quality=88,method=6)
    report={"source":url,"sourcePixels":[w,h],"generated":len(records),
            "totalBytes":sum(p["bytes"] for p in records),"gameAvatarFilesChanged":0,
            "approvalStatus":"awaiting visual inspection: faces, crops, identities, consistency",
            "files":records}
    (OUT/"QA.json").write_text(json.dumps(report,indent=2)+"\n",encoding="utf-8")
    print("PASS: 6 premium avatar previews extracted, all 256x256 WebP, no game avatar changes")

if __name__=="__main__":
    main()
