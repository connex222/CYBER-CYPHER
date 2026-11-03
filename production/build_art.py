#!/usr/bin/env python3
"""Offline-safe production builder for CYBER CYPHER's approved original WebP artwork.

Only the source acquisition step uses network access. The shipped game never does.
Requires: python -m pip install Pillow numpy fonttools brotli
"""
import argparse
import hashlib
import io
import json
import math
import os
import tempfile
import time
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "production/art-sources.json"
QA = ROOT / "production/ART-QA.json"
BG_COLOR = (5, 7, 13)
ASSETS_MAX = 3 * 1024 * 1024
LOGO_PATH = ROOT / "public/assets/ui/logo.webp"

def source_bytes(url):
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or parsed.hostname != "cdn.creativeclaw.co" or not parsed.path.endswith(".png"):
        raise RuntimeError("Untrusted asset source: " + url)
    last = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "CYBER-CYPHER-Asset-Builder/1.0"})
            with urllib.request.urlopen(req, timeout=65) as resp:
                blob = resp.read(25 * 1024 * 1024 + 1)
            if not blob.startswith(b"\x89PNG\r\n\x1a\n") or len(blob) > 25 * 1024 * 1024:
                raise ValueError("Expected a PNG no larger than 25 MiB")
            return blob
        except Exception as exc:
            last = exc
            if attempt < 2:
                time.sleep(2 ** attempt)
    raise RuntimeError("Unable to retrieve authorised artwork: " + url) from last

def alpha_cutout(src):
    """Conservatively isolate a dark-background icon, including holes open to the outside."""
    im = src.convert("RGB")
    sentinel = (1, 2, 3)
    original = np.asarray(im)
    bg = np.median(
        np.array([original[0, 0], original[0, -1], original[-1, 0], original[-1, -1]]),
        axis=0,
    ).astype(np.uint8)
    # Only connected background is removed; dark titanium inside the emblem is retained.
    allowed = (np.max(np.abs(original.astype(np.int16) - bg.astype(np.int16)), axis=2) < 31)
    from collections import deque
    h, w = allowed.shape
    visited = np.zeros((h, w), dtype=np.uint8)
    q = deque()
    for x in range(w):
        if allowed[0, x]:
            visited[0, x] = 1
            q.append((0, x))
        if allowed[h - 1, x]:
            visited[h - 1, x] = 1
            q.append((h - 1, x))
    for y in range(h):
        if allowed[y, 0]:
            visited[y, 0] = 1
            q.append((y, 0))
        if allowed[y, w - 1]:
            visited[y, w - 1] = 1
            q.append((y, w - 1))
    while q:
        y, x = q.popleft()
        if y > 0 and allowed[y - 1, x] and not visited[y - 1, x]:
            visited[y - 1, x] = 1
            q.append((y - 1, x))
        if y + 1 < h and allowed[y + 1, x] and not visited[y + 1, x]:
            visited[y + 1, x] = 1
            q.append((y + 1, x))
        if x > 0 and allowed[y, x - 1] and not visited[y, x - 1]:
            visited[y, x - 1] = 1
            q.append((y, x - 1))
        if x + 1 < w and allowed[y, x + 1] and not visited[y, x + 1]:
            visited[y, x + 1] = 1
            q.append((y, x + 1))
    alpha = Image.fromarray(np.where(visited == 1, 0, 255).astype("uint8"), "L")
    alpha = alpha.filter(ImageFilter.GaussianBlur(radius=0.65))
    im = src.convert("RGBA")
    im.putalpha(alpha)
    return im

def prepare_card(im):
    """Darken the word-bearing central 60% to meet WCAG 7:1 for white HTML labels."""
    arr = np.asarray(im.convert("RGB")).astype(np.float32)
    h, w, _ = arr.shape
    xx = np.arange(w, dtype=np.float32)[None, :]
    yy = np.arange(h, dtype=np.float32)[:, None]
    # A softly feathered overlay reaches 100% within the central text-safe zone.
    dx = np.minimum(np.clip((xx - w * .10) / (w * .10), 0, 1),
                    np.clip((w * .90 - xx) / (w * .10), 0, 1))
    dy = np.minimum(np.clip((yy - h * .10) / (h * .15), 0, 1),
                    np.clip((h * .90 - yy) / (h * .15), 0, 1))
    weight = np.minimum(dx, dy)[..., None]
    dark = np.minimum(arr, 84)
    arr = arr * (1 - weight) + dark * weight
    return Image.fromarray(np.uint8(np.clip(arr, 0, 255)), "RGB")

def worst_card_contrast(im):
    a = np.asarray(im.convert("RGB"), dtype=np.float32) / 255
    h, w, _ = a.shape
    # Match the central 60% used by the HTML word text.
    a = a[int(h * .25):int(h * .75), int(w * .20):int(w * .80), :]
    a = np.where(a <= .04045, a / 12.92, ((a + .055) / 1.055) ** 2.4)
    luminance = a[:, :, 0] * .2126 + a[:, :, 1] * .7152 + a[:, :, 2] * .0722
    return float(1.05 / (np.max(luminance) + .05))

def webp_bytes(image, max_bytes):
    for quality in (88, 84, 80, 76, 72, 68, 64, 60, 56, 52, 48, 44, 40):
        output = io.BytesIO()
        image.save(output, format="WEBP", quality=quality, method=6, exact=True)
        if len(output.getvalue()) <= max_bytes:
            return output.getvalue(), quality
    raise RuntimeError("Artwork exceeds file-size ceiling even at quality=40; avoid committing a degraded asset")

def make_logo():
    """Build the exact text logo from the project's bundled OFL Orbitron font at zero AI credits."""
    font_src = ROOT / "fonts/Orbitron.woff2"
    with tempfile.TemporaryDirectory() as temp:
        font_obj = TTFont(str(font_src))
        font_obj.flavor = None
        if "fvar" in font_obj:
            font_obj = instantiateVariableFont(font_obj, {"wght": 850}, inplace=False)
        font_path = Path(temp) / "orbitron-extracted.ttf"
        font_obj.save(str(font_path))
        font = ImageFont.truetype(str(font_path), 206)
        w, h = 1600, 520
        mask = Image.new("L", (w, h))
        painter = ImageDraw.Draw(mask)
        for label, baseline in (("CYBER", 238), ("CYPHER", 425)):
            x = (w - painter.textlength(label, font=font)) / 2
            painter.text((x, baseline), label, font=font, anchor="ls", fill=255)
        canvas = Image.new("RGBA", (w, h))
        for radius, opacity in ((16, 18), (7, 32), (2, 55)):
            glow = mask.filter(ImageFilter.GaussianBlur(radius))
            glow = glow.point(lambda x, opacity=opacity: x * opacity // 255)
            layer = Image.new("RGBA", (w, h), (34, 228, 255, 0))
            layer.putalpha(glow)
            canvas = Image.alpha_composite(canvas, layer)
        outline = Image.new("RGBA", (w, h))
        brush = ImageDraw.Draw(outline)
        for label, baseline in (("CYBER", 238), ("CYPHER", 425)):
            x = (w - brush.textlength(label, font=font)) / 2
            brush.text((x, baseline), label, font=font, anchor="ls",
                       fill=(6, 32, 46, 255), stroke_width=8,
                       stroke_fill=(19, 136, 169, 240))
        canvas = Image.alpha_composite(canvas, outline)
        tint = Image.new("RGBA", (w, h), (227, 250, 255, 0))
        tint.putalpha(mask)
        canvas = Image.alpha_composite(canvas, tint)
        return canvas

def produce(manifest, local_sources=None):
    assets = []
    for item in manifest["assets"]:
        rel = item["path"]
        if not rel.startswith("public/assets/") or "/avatars/" in rel or not rel.endswith(".webp"):
            raise RuntimeError("Refusing to alter avatars or unexpected path: " + rel)
        if local_sources:
            src = Path(local_sources) / (Path(rel).stem + ".png")
            raw = src.read_bytes()
        else:
            raw = source_bytes(item["url"])
        with Image.open(io.BytesIO(raw)) as image:
            image.load()
            if image.width < 256 or image.height < 256:
                raise RuntimeError("Input is too small: " + rel)
            frame = ImageOps.fit(image.convert("RGBA"), (item["width"], item["height"]), method=Image.Resampling.LANCZOS)
        if item["kind"] == "alpha":
            frame = alpha_cutout(frame)
        elif item["kind"] == "card":
            frame = prepare_card(frame)
        else:
            frame = frame.convert("RGB")
        contrast = round(worst_card_contrast(frame), 2) if item["kind"] == "card" else None
        if contrast is not None and contrast < 7:
            raise RuntimeError("Card fails 7:1 centre contrast: " + rel)
        blob, quality = webp_bytes(frame, int(item["maxBytes"]))
        assets.append((rel, blob, {
            "path": rel, "bytes": len(blob), "width": frame.width, "height": frame.height,
            "webpQuality": quality, "sha256": hashlib.sha256(blob).hexdigest(),
            "whiteWordContrast": contrast, "source": item["url"],
            "transparent": item["kind"] == "alpha",
        }))
        print("PASS", rel, len(blob), "bytes", "WebP quality", quality, flush=True)
    logo, logo_quality = webp_bytes(make_logo(), 120000)
    assets.append(("public/assets/ui/logo.webp", logo, {
        "path": "public/assets/ui/logo.webp", "bytes": len(logo),
        "width": 1600, "height": 520, "webpQuality": logo_quality,
        "sha256": hashlib.sha256(logo).hexdigest(), "source": "deterministic bundled Orbitron",
        "transparent": True,
    }))
    return assets

def verify(assets, budget):
    total = 0
    report = []
    for rel, raw, meta in assets:
        with Image.open(io.BytesIO(raw)) as im:
            im.load()
            if im.format != "WEBP" or im.size != (meta["width"], meta["height"]):
                raise RuntimeError("Bad output image: " + rel)
            if meta["transparent"] and im.mode != "RGBA":
                raise RuntimeError("Expected transparent WebP: " + rel)
            if meta["transparent"] and im.getchannel("A").getextrema()[0] == 255:
                raise RuntimeError("Alpha isolation failed; icon has no transparent pixels: " + rel)
            if rel.startswith("public/assets/cards/") and worst_card_contrast(im) < 7:
                raise RuntimeError("Shipped WebP fails 7:1 card-label contrast: " + rel)
        total += len(raw)
        report.append(meta)
    if total > budget:
        raise RuntimeError("Art exceeds 3 MiB total; refusing installation")
    return {"schema": 1, "status": "PASS", "assetCount": len(report),
            "totalBytes": total, "under3MiB": True, "avatarFilesTouched": 0, "files": report}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--verify-only", action="store_true")
    parser.add_argument("--local-sources", type=Path)
    args = parser.parse_args()
    data = json.loads(MANIFEST.read_text(encoding="utf8"))
    if len(data["assets"]) != 15:
        raise RuntimeError("Expected exactly 15 non-avatar input images")
    if args.dry_run:
        print("15 original source PNGs + one deterministic logo, 0 new generation credits")
        return
    if args.verify_only:
        assets = []
        for item in data["assets"] + [{"path":"public/assets/ui/logo.webp",
                                      "width":1600,"height":520, "kind":"alpha"}]:
            path = ROOT / item["path"]
            raw = path.read_bytes()
            if len(raw) > item.get("maxBytes", 120000):
                raise RuntimeError("Existing file exceeds per-file image budget: " + item["path"])
            assets.append((item["path"], raw, {
                "path": item["path"], "width": item["width"], "height": item["height"],
                "transparent": item["kind"] == "alpha", "bytes": len(raw),
                "sha256": hashlib.sha256(raw).hexdigest(),
            }))
        report = verify(assets, data["assetBudgetBytes"])
        print("PASS existing files", report["assetCount"], "bytes", report["totalBytes"])
        return
    assets = produce(data, args.local_sources)
    report = verify(assets, data["assetBudgetBytes"])
    # Write only after the entire set passes validation; no partial art installs.
    for rel, blob, _ in assets:
        path = ROOT / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(".webp.new")
        tmp.write_bytes(blob)
        os.replace(tmp, path)
    QA.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    print("ART QA PASS", len(assets), "assets", report["totalBytes"], "bytes; no avatars modified")

if __name__ == "__main__":
    main()
