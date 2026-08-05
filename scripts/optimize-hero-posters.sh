#!/usr/bin/env bash
# Smaller hero carousel JPEGs → public/images/posters/hero/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export ROOT
python3 << 'PY'
from PIL import Image
import os
ROOT = os.environ['ROOT']
SRC = os.path.join(ROOT, 'public/images/posters')
DST = os.path.join(ROOT, 'public/images/posters/hero')
NAMES = [
  '01-tv-wall.jpg', '02-film-spiral.jpg', '03-maven-scholarship.jpg',
  '04-film-set.jpg', '05-brand-intelligence.jpg', '06-idea-overload.jpg',
  '07-zurag-avalt-bts.jpg',
]
os.makedirs(DST, exist_ok=True)
for name in NAMES:
    src_path = os.path.join(SRC, name)
    if name == '07-zurag-avalt-bts.jpg':
        png_src = os.path.join(SRC, '07-zurag-avalt-bts.source.png')
        if not os.path.isfile(png_src):
            png_src = os.path.join(SRC, '07-zurag-avalt.source.png')
        if os.path.isfile(png_src):
            src_path = png_src
    im = Image.open(src_path)
    if im.mode == 'P':
        im = im.convert('RGBA')
    if im.mode == 'RGBA':
        bg = Image.new('RGB', im.size, (0, 0, 0))
        bg.paste(im, mask=im.split()[3])
        im = bg
    else:
        im = im.convert('RGB')
    w, h = im.size
    if w > 1600:
        im = im.resize((1600, int(h * 1600 / w)), Image.Resampling.LANCZOS)
    out = os.path.join(DST, name)
    im.save(out, 'JPEG', quality=82, optimize=True, progressive=True)
    print(f"  {name}: {os.path.getsize(out) // 1024}KB")
print(f"Done → {DST}")
PY
