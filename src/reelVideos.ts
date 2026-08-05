/**
 * Reel + hero carousel videos
 *
 * How to use your own clips:
 * 1. Put MP4 (or WebM) files in `public/videos/reels/` at the project root.
 * 2. Either replace `reel-01.mp4` … `reel-07.mp4` in that folder, or change
 *    `REEL_CLIP_FILES` below to match your filenames (keep paths as `/videos/reels/<name>`).
 */

export const REEL_CLIP_FILES = [
  'reel-01.mp4',
  'reel-02.mp4',
  'reel-03.mp4',
  'reel-04.mp4',
  'reel-05.mp4',
  'reel-06.mp4',
  'reel-07.mp4',
] as const;

const REEL_ROWS = [
  { id: 'r1', title: 'A clear point of view', label: 'Studio introduction' },
  { id: 'r2', title: 'Work with intention', label: 'Creative direction' },
  { id: 'r3', title: 'Stories in motion', label: 'Digital experience' },
  { id: 'r4', title: 'Moments that connect', label: 'Campaign launch' },
  { id: 'r5', title: 'Built for your audience', label: 'Brand system' },
  { id: 'r6', title: 'Made to be remembered', label: 'Editorial moment' },
  { id: 'r7', title: 'The work behind the work', label: 'Behind the scenes' },
] as const;

export const reelItemsSource = REEL_ROWS.map((row, i) => ({
  id: row.id,
  title: row.title,
  label: row.label,
  video: `/videos/reels/${REEL_CLIP_FILES[i % REEL_CLIP_FILES.length]}`,
}));
