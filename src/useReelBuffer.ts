import { useEffect, useRef, type RefObject } from 'react';
import { attachAndPrimeReel } from './reelVideoEngine';

const REF_POLL_MS = 40;
const REF_POLL_MAX = 60;
const PARALLEL_PRIMES = 4;

function countReadyRefs(refs: (HTMLVideoElement | null)[]): number {
  return refs.reduce((n, v) => n + (v ? 1 : 0), 0);
}

async function waitForVideoRefs(
  videoRefs: RefObject<(HTMLVideoElement | null)[]>,
  needed: number,
  cancelled: () => boolean
): Promise<void> {
  for (let i = 0; i < REF_POLL_MAX; i++) {
    if (cancelled()) return;
    if (countReadyRefs(videoRefs.current) >= needed) return;
    await new Promise((r) => window.setTimeout(r, REF_POLL_MS));
  }
}

async function primeBatch(
  videoRefs: RefObject<(HTMLVideoElement | null)[]>,
  sources: readonly string[],
  indices: number[]
): Promise<void> {
  await Promise.all(
    indices.map(async (i) => {
      const video = videoRefs.current[i];
      const src = sources[i];
      if (video && src) await attachAndPrimeReel(video, src);
    })
  );
}

/** Primes reel videos in parallel batches (desktop warm-up). */
export function useReelBuffer(
  active: boolean,
  sources: readonly string[],
  videoRefs: RefObject<(HTMLVideoElement | null)[]>
): void {
  const runId = useRef(0);

  useEffect(() => {
    if (!active || sources.length === 0) return;

    const id = ++runId.current;
    let cancelled = false;
    const isCancelled = () => cancelled || runId.current !== id;

    const run = async () => {
      await waitForVideoRefs(videoRefs, sources.length, isCancelled);
      if (isCancelled()) return;

      for (let start = 0; start < sources.length; start += PARALLEL_PRIMES) {
        if (isCancelled()) return;
        const indices = Array.from(
          { length: Math.min(PARALLEL_PRIMES, sources.length - start) },
          (_, j) => start + j
        );
        await primeBatch(videoRefs, sources, indices);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [active, sources, videoRefs]);
}

/** Prime a single strip immediately (e.g. on hover before play). */
export function primeReelStrip(
  video: HTMLVideoElement,
  src: string
): Promise<boolean> {
  return attachAndPrimeReel(video, src);
}
