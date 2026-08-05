import { useLayoutEffect, useRef, useEffect, useCallback } from 'react';
import { pauseReel, playReel, seekReelPosterFrame } from './reelVideoEngine';

type ReelStripVideoProps = {
  src: string;
  stripIndex: number;
  active: boolean;
  register: (index: number, el: HTMLVideoElement | null) => void;
  softPause?: boolean;
  /** Keep full buffer on desktop so hover play is instant. */
  eagerLoad?: boolean;
};

/** Video-only strip; buffering is coordinated by ReelSection. */
export function ReelStripVideo({
  src,
  stripIndex,
  active,
  register,
  softPause = false,
  eagerLoad = false,
}: ReelStripVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    register(stripIndex, v);
    return () => register(stripIndex, null);
  }, [stripIndex, register]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.loop = true;
    v.preload = eagerLoad || active ? 'auto' : 'metadata';
  }, [active, eagerLoad]);

  const onLoadedData = useCallback(() => {
    const v = videoRef.current;
    if (!v || active) return;
    seekReelPosterFrame(v);
  }, [active]);

  useLayoutEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) playReel(v);
    else pauseReel(v, softPause);
  }, [active, softPause]);

  return (
    <video
      ref={videoRef}
      src={src}
      className="absolute inset-0 h-full w-full min-h-full min-w-full object-cover bg-zinc-950 [object-position:center]"
      muted
      loop
      playsInline
      preload={eagerLoad || active ? 'auto' : 'metadata'}
      disablePictureInPicture
      disableRemotePlayback
      onLoadedData={onLoadedData}
    />
  );
}
