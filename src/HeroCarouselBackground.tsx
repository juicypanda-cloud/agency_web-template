import { HERO_CAROUSEL_IMAGES } from './siteImages';

type HeroCarouselBackgroundProps = {
  activeIndex: number;
};

/**
 * All frames stay mounted and crossfade via opacity — instant when images are pre-decoded.
 */
export function HeroCarouselBackground({ activeIndex }: HeroCarouselBackgroundProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {HERO_CAROUSEL_IMAGES.map((src, i) => {
        const isActive = i === activeIndex;
        return (
          <img
            key={src}
            src={src}
            alt=""
            decoding={isActive ? 'sync' : 'async'}
            fetchPriority={isActive ? 'high' : 'low'}
            className={`absolute inset-0 h-full w-full object-cover brightness-[0.72] contrast-[1.02] transition-opacity duration-300 ease-out ${
              isActive ? 'opacity-100' : 'opacity-0'
            }`}
          />
        );
      })}
    </div>
  );
}
