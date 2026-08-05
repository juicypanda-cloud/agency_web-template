export const REEL_FRAME_TIME = 0.04;

const primed = new WeakSet<HTMLVideoElement>();

export function isReelPrimed(video: HTMLVideoElement): boolean {
  return primed.has(video);
}

function reelSrcMatches(video: HTMLVideoElement, src: string): boolean {
  if (video.getAttribute('src') === src) return true;
  try {
    const expected = new URL(src, window.location.href).href;
    return video.currentSrc === expected || video.currentSrc.endsWith(src);
  } catch {
    return video.currentSrc.endsWith(src);
  }
}

export function seekReelPosterFrame(video: HTMLVideoElement): void {
  if (video.readyState < HTMLMediaElement.HAVE_METADATA) return;
  try {
    if (Math.abs(video.currentTime - REEL_FRAME_TIME) > 0.02) {
      video.currentTime = REEL_FRAME_TIME;
    }
  } catch {
    /* seek */
  }
}

export async function attachAndPrimeReel(video: HTMLVideoElement, src: string): Promise<boolean> {
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.loop = true;
  video.preload = 'auto';

  if (!reelSrcMatches(video, src)) {
    video.src = src;
    primed.delete(video);
  }

  if (isReelPrimed(video) && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    seekReelPosterFrame(video);
    return true;
  }

  if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    seekReelPosterFrame(video);
    primed.add(video);
    return true;
  }

  try {
    if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
      video.load();
      await waitVideoEvent(video, 'loadeddata', 10_000);
    }

    seekReelPosterFrame(video);

    if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
      await waitVideoEvent(video, 'canplay', 8_000);
    }

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      try {
        await video.play();
        video.pause();
        seekReelPosterFrame(video);
      } catch {
        seekReelPosterFrame(video);
      }
    }

    const ok = video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    if (ok) primed.add(video);
    return ok;
  } catch {
    const ok = video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    if (ok) {
      primed.add(video);
      seekReelPosterFrame(video);
    }
    return ok;
  }
}

export function playReel(video: HTMLVideoElement): void {
  video.muted = true;
  video.defaultMuted = true;
  const p = video.play();
  if (p !== undefined) void p.catch(() => {});
}

export function pauseReel(video: HTMLVideoElement, soft = false): void {
  video.pause();
  if (soft) return;
  seekReelPosterFrame(video);
}

function waitVideoEvent(video: HTMLVideoElement, event: string, ms: number): Promise<void> {
  if (event === 'loadedmetadata' && video.readyState >= HTMLMediaElement.HAVE_METADATA) {
    return Promise.resolve();
  }
  if (event === 'loadeddata' && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    return Promise.resolve();
  }
  if (event === 'canplay' && video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('timeout')), ms);
    const onOk = () => {
      window.clearTimeout(timer);
      video.removeEventListener(event, onOk);
      video.removeEventListener('error', onErr);
      resolve();
    };
    const onErr = () => {
      window.clearTimeout(timer);
      video.removeEventListener(event, onOk);
      video.removeEventListener('error', onErr);
      reject(new Error('error'));
    };
    video.addEventListener(event, onOk, { once: true });
    video.addEventListener('error', onErr, { once: true });
  });
}
