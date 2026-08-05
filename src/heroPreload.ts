import { HERO_CAROUSEL_IMAGES, HERO_INITIAL_CAROUSEL_INDEX } from './siteImages';
import { REEL_CLIP_FILES } from './reelVideos';

export const HERO_INITIAL_INDEX = HERO_INITIAL_CAROUSEL_INDEX;

const prefetched = new Set<string>();
const decoded = new Map<string, Promise<void>>();

function decodeImage(url: string, priority: 'high' | 'low' | 'auto' = 'auto'): Promise<void> {
  const existing = decoded.get(url);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.fetchPriority = priority;
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });

  decoded.set(url, promise);
  return promise;
}

/** Eagerly decode every hero carousel frame (no idle delay). */
export function preloadHeroCarouselImages(priorityIndices?: readonly number[]): void {
  const prioritySet = new Set(priorityIndices ?? [HERO_INITIAL_INDEX]);
  const indices = [
    ...HERO_CAROUSEL_IMAGES.map((_, i) => i).filter((i) => prioritySet.has(i)),
    ...HERO_CAROUSEL_IMAGES.map((_, i) => i).filter((i) => !prioritySet.has(i)),
  ];

  for (const i of indices) {
    const url = HERO_CAROUSEL_IMAGES[i]!;
    if (prefetched.has(url)) continue;
    prefetched.add(url);
    const priority = prioritySet.has(i) ? 'high' : 'low';
    void decodeImage(url, priority).catch(() => {});
  }
}

export function preloadHeroNeighbors(activeIndex: number): void {
  const len = HERO_CAROUSEL_IMAGES.length;
  const neighbors = [
    (activeIndex - 1 + len) % len,
    activeIndex,
    (activeIndex + 1) % len,
  ];
  preloadHeroCarouselImages(neighbors);
}

/** Hint the browser to fetch reel MP4s after hero stills. */
export function prefetchReelVideos(): void {
  const add = (href: string) => {
    if (prefetched.has(href)) return;
    prefetched.add(href);
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'video';
    link.href = href;
    document.head.appendChild(link);
  };

  REEL_CLIP_FILES.forEach((file) => add(`/videos/reels/${file}`));
}

export function warmHeroAndReels(): void {
  preloadHeroCarouselImages([HERO_INITIAL_INDEX, HERO_INITIAL_INDEX - 1, HERO_INITIAL_INDEX + 1]);
  preloadHeroCarouselImages();

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => prefetchReelVideos());
  } else {
    window.setTimeout(prefetchReelVideos, 2000);
  }
}
