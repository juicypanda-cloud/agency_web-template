#!/usr/bin/env bash
# Compress MP4s for web (reels + optional hero clips).
# Requires: ffmpeg
# Usage: ./scripts/compress-videos.sh [directory]
# Default directory: public/videos/reels

set -euo pipefail

DIR="${1:-public/videos/reels}"
mkdir -p "$DIR"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required. Install it, then re-run this script."
  exit 1
fi

shopt -s nullglob
files=("$DIR"/*.mp4)

if [ ${#files[@]} -eq 0 ]; then
  echo "No .mp4 files in $DIR"
  exit 0
fi

for src in "${files[@]}"; do
  base="$(basename "$src" .mp4)"
  tmp="$DIR/${base}.compressed.mp4"
  echo "Compressing $src …"
  ffmpeg -y -i "$src" \
    -vf "scale='min(540,iw)':-2" \
    -c:v libx264 -preset medium -crf 28 \
    -movflags +faststart \
    -an \
    "$tmp"
  mv "$tmp" "$src"
  echo "  → $(du -h "$src" | cut -f1)"
done

echo "Done. Hero carousel currently uses still images; add clips to public/videos/hero/ and run this script there if needed."
