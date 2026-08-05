#!/usr/bin/env bash
# Download poster assets into public/images/posters/
# Usage: put one image URL per line in scripts/site-image-urls.txt (10 lines), then:
#   bash scripts/fetch-site-images.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
URL_FILE="$ROOT/scripts/site-image-urls.txt"
OUT_DIR="$ROOT/public/images/posters"
NAMES=(
  01-tv-wall.jpg
  02-film-spiral.jpg
  03-maven-scholarship.jpg
  04-film-set.jpg
  05-brand-intelligence.jpg
  06-idea-overload.jpg
  07-zurag-avalt-bts.jpg
  08-be-different.jpg
  09-procrastination.jpg
  10-dialogue-silhouettes.jpg
)

mkdir -p "$OUT_DIR"

if [[ ! -f "$URL_FILE" ]]; then
  echo "Missing $URL_FILE — add 10 image URLs (one per line)." >&2
  exit 1
fi

mapfile -t URLS < <(grep -v '^\s*#' "$URL_FILE" | grep -v '^\s*$' || true)
if [[ ${#URLS[@]} -lt 10 ]]; then
  echo "Need 10 URLs in $URL_FILE (found ${#URLS[@]})." >&2
  exit 1
fi

for i in "${!NAMES[@]}"; do
  url="${URLS[$i]}"
  out="$OUT_DIR/${NAMES[$i]}"
  # Keep hand-picked Зураг авалт still (07) when source PNG is present
  if [[ "${NAMES[$i]}" == "07-zurag-avalt-bts.jpg" && -f "$OUT_DIR/07-zurag-avalt-bts.source.png" ]]; then
    echo "→ ${NAMES[$i]} (skipped — using 07-zurag-avalt-bts.source.png)"
    continue
  fi
  tmp="$(mktemp)"
  echo "→ ${NAMES[$i]}"
  curl -fsSL "$url" -o "$tmp"
  python3 - "$tmp" "$out" <<'PY'
import sys
from PIL import Image

src, dest = sys.argv[1], sys.argv[2]
img = Image.open(src)
if img.mode in ("RGBA", "P", "LA"):
    bg = Image.new("RGB", img.size, (255, 255, 255))
    if img.mode == "P":
        img = img.convert("RGBA")
    bg.paste(img, mask=img.split()[-1] if "A" in img.mode else None)
    img = bg
else:
    img = img.convert("RGB")
img.save(dest, "JPEG", quality=88, optimize=True)
PY
  rm -f "$tmp"
done

echo "Done. ${#NAMES[@]} posters in $OUT_DIR"
