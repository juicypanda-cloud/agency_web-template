import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { ReelStripVideo } from './ReelStripVideo';

export type ReelCarouselItem = {
  id: string;
  title: string;
  label: string;
  video: string;
};

const REEL_SLIDE_WIDTH = 'min(78vw, 320px)';

type ReelMobileCarouselProps = {
  items: readonly ReelCarouselItem[];
  register: (index: number, el: HTMLVideoElement | null) => void;
};

function indexNearestCenter(
  root: HTMLDivElement,
  slides: readonly (HTMLDivElement | null)[]
): number {
  const rootRect = root.getBoundingClientRect();
  const centerX = rootRect.left + rootRect.width / 2;

  let bestIndex = 0;
  let bestDist = Number.POSITIVE_INFINITY;

  slides.forEach((el, i) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dist = Math.abs(rect.left + rect.width / 2 - centerX);
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
    }
  });

  return bestIndex;
}

export function ReelMobileCarousel({ items, register }: ReelMobileCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeIndexRef = useRef(0);
  const scrollRafRef = useRef<number | null>(null);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setActiveIndexStable = useCallback((index: number) => {
    if (activeIndexRef.current === index) return;
    activeIndexRef.current = index;
    setActiveIndex(index);
  }, []);

  const syncActiveFromScroll = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return;
    setActiveIndexStable(indexNearestCenter(root, slideRefs.current));
  }, [setActiveIndexStable]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = slideRefs.current[index];
      if (!el) return;
      setActiveIndexStable(index);
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    },
    [setActiveIndexStable]
  );

  const goNext = () => scrollToIndex((activeIndexRef.current + 1) % items.length);
  const goPrev = () => scrollToIndex((activeIndexRef.current - 1 + items.length) % items.length);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const onScroll = () => {
      if (scrollRafRef.current !== null) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = null;
        syncActiveFromScroll();
      });
    };

    const onScrollEnd = () => {
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
      syncActiveFromScroll();
    };

    const scheduleSync = () => {
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = setTimeout(syncActiveFromScroll, 150);
    };

    root.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('scroll', scheduleSync, { passive: true });
    root.addEventListener('scrollend', onScrollEnd);
    syncActiveFromScroll();

    return () => {
      root.removeEventListener('scroll', onScroll);
      root.removeEventListener('scroll', scheduleSync);
      root.removeEventListener('scrollend', onScrollEnd);
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
      if (scrollRafRef.current !== null) cancelAnimationFrame(scrollRafRef.current);
    };
  }, [items.length, syncActiveFromScroll]);

  return (
    <div className="relative z-20 w-full md:hidden">
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [contain:layout_paint] [&::-webkit-scrollbar]:hidden"
        style={{
          paddingLeft: `max(1rem, calc((100% - ${REEL_SLIDE_WIDTH}) / 2))`,
          paddingRight: `max(1rem, calc((100% - ${REEL_SLIDE_WIDTH}) / 2))`,
        }}
      >
        {items.map((item, i) => {
          const isActive = activeIndex === i;
          return (
            <div
              key={item.id}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              className={`relative aspect-[9/16] w-[min(78vw,320px)] shrink-0 snap-center overflow-hidden rounded-2xl border bg-zinc-950 transition-[opacity,box-shadow,border-color] duration-300 ease-out ${
                isActive
                  ? 'border-white/20 opacity-100 shadow-[0_24px_64px_rgba(0,0,0,0.55)]'
                  : 'border-white/10 opacity-80'
              }`}
            >
              <ReelStripVideo
                src={item.video}
                stripIndex={i}
                active={isActive}
                register={register}
                softPause
              />
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-center gap-4 px-4 pb-10">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous reel"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-sm"
        >
          <ChevronRight className="rotate-180" size={20} strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Reel ${i + 1}`}
              aria-current={activeIndex === i}
              onClick={() => scrollToIndex(i)}
              className="p-1"
            >
              <span
                className={`block h-[2px] rounded-full bg-white transition-[width,opacity] duration-300 ${
                  activeIndex === i ? 'w-8 opacity-100' : 'w-3 opacity-35'
                }`}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={goNext}
          aria-label="Next reel"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-sm"
        >
          <ChevronRight size={20} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
