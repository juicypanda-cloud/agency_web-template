/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
  Fragment,
  type ReactNode,
  type RefObject,
} from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'motion/react';
import {
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { Link, Outlet, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { reelItemsSource, REEL_CLIP_FILES } from './reelVideos';
import { ReelStripVideo } from './ReelStripVideo';
import { ReelMobileCarousel } from './ReelMobileCarousel';
import { useMobileViewport } from './useMobileViewport';
import { useReelSectionInView } from './useReelSectionInView';
import { useReelBuffer } from './useReelBuffer';
import { attachAndPrimeReel, pauseReel, playReel } from './reelVideoEngine';
import { trackEvent } from './analytics';
import { NewsletterForm } from './NewsletterForm';
import {
  heroCarouselPoster,
  HERO_INITIAL_CAROUSEL_INDEX,
  MARKETING_POSTER_CYCLE,
  MARKETING_WORK_IMG,
  ZURAG_AVALT_HERO_POSTER,
} from './siteImages';
import { HeroCarouselBackground } from './HeroCarouselBackground';
import { preloadHeroCarouselImages, preloadHeroNeighbors } from './heroPreload';
import { ScrollToTop } from './ScrollToTop';
import { ContactPage } from './pages/ContactPage';
import { NAV_LINKS, SERVICE_CARDS, SITE_COPYRIGHT, SITE_EMAIL, SITE_NAME } from './brand';

type CarouselReelItem = {
  id: string;
  title: string;
  subtitle: string;
  video: string;
  poster: string;
};

const serviceCards = SERVICE_CARDS.map(({ title, imageKey }) => ({
  title,
  image: MARKETING_WORK_IMG[imageKey],
}));

const reelItems = reelItemsSource.map((item, i) => ({
  ...item,
  poster: MARKETING_POSTER_CYCLE[i % MARKETING_POSTER_CYCLE.length],
}));

/** Few wide strips for the cinematic reel gallery (not a dense film barcode). */
const reelCinematicItems = reelItems.slice(0, REEL_CLIP_FILES.length);

const carouselReels = reelItems.slice(0, 7).map((r, i) => ({
  id: r.id,
  title: r.label,
  subtitle: r.title,
  video: r.video,
  poster: i === 6 ? ZURAG_AVALT_HERO_POSTER : heroCarouselPoster(i),
})) satisfies CarouselReelItem[];

const storyImage = MARKETING_WORK_IMG.collaborationRoom;

const initialCarouselIndex = HERO_INITIAL_CAROUSEL_INDEX;
const carouselLoopOffset = carouselReels.length;
const initialCarouselTrackIndex = carouselLoopOffset + initialCarouselIndex;
const carouselTrackItems = [0, 1, 2].flatMap((setIndex) =>
  carouselReels.map((item, originalIndex) => ({
    item,
    originalIndex,
    key: `${setIndex}-${item.title}`,
  })),
);

/** Hero carousel motion — aligned with cinematic ease, GPU-friendly. */
const CAROUSEL_EASE = [0.16, 1, 0.2, 1] as const;
const CAROUSEL_DURATION_MS = 950;
const CAROUSEL_AUTOPLAY_MS = 5000;
const CAROUSEL_TEXT_DURATION_S = 0.58;
const carouselTransitionCss = `transform ${CAROUSEL_DURATION_MS}ms cubic-bezier(${CAROUSEL_EASE.join(',')})`;
const carouselSlideTransitionCss = `opacity,transform ${CAROUSEL_DURATION_MS}ms cubic-bezier(${CAROUSEL_EASE.join(',')})`;

/** Fixed stage — titles crossfade in place without resizing the hero (stops page bounce). */
const HERO_TEXT_STAGE_CLASS =
  'relative mx-auto h-[11.5rem] w-full max-w-5xl overflow-hidden [contain:layout] [overflow-anchor:none] md:h-[13rem] lg:h-[14rem]';

const carouselTextFade = {
  duration: CAROUSEL_TEXT_DURATION_S,
  ease: CAROUSEL_EASE,
} as const;

function CarouselHeroText({
  title,
  subtitle,
  slideKey,
  instant,
}: {
  title: string;
  subtitle: string;
  slideKey: number;
  instant: boolean;
}) {
  const copy = (
    <>
      <h2 className="hero-headline mb-3 line-clamp-3 text-5xl font-light uppercase leading-[1.05] tracking-[0.1em] text-white md:text-6xl lg:text-7xl xl:text-8xl">
        {title}
      </h2>
      <p className="hero-subline line-clamp-2 text-xs font-medium uppercase leading-relaxed tracking-[0.26em] text-white/80 md:text-sm">
        {subtitle}
      </p>
    </>
  );

  if (instant) {
    return <div className={HERO_TEXT_STAGE_CLASS}>{copy}</div>;
  }

  return (
    <div className={HERO_TEXT_STAGE_CLASS} aria-live="polite">
      <AnimatePresence initial={false}>
        <motion.div
          key={slideKey}
          className="absolute inset-0 flex flex-col items-center justify-start px-2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={carouselTextFade}
        >
          {copy}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}



// --- Components ---

/** Full-bleed blurred photo + dark scrim (matches intro under-hero treatment). */
const SectionBlurredDarkBg = ({ imageUrl }: { imageUrl: string }) => (
  <>
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <img
        src={imageUrl}
        alt=""
        className="h-full w-full min-h-full min-w-full object-cover"
        style={{ transform: 'scale(1.12)', filter: 'blur(36px)' }}
      />
    </div>
    <div className="pointer-events-none absolute inset-0 z-[1] bg-black/55" aria-hidden />
  </>
);

/** Apple-style ease — strong deceleration, no bounce. */
const CINEMATIC_EASE = [0.16, 1, 0.2, 1] as const;
const CINEMATIC_DURATION = 1.05;
const CINEMATIC_STAGGER = 0.1;
const CINEMATIC_DELAY_CHILD = 0.06;

/** Hysteresis avoids rapid in/out toggling at the viewport edge while still allowing exit motion. */
const SCROLL_HYST_PRESET = {
  /** Tall intro / service cards */
  panel: { enter: 0.28, exit: 0.07, rootMargin: '0px 0px -5% 0px' },
  /** Text blocks, footers, bridges */
  block: { enter: 0.22, exit: 0.065, rootMargin: '0px 0px -10% 0px' },
} as const;

function useHysteresisInView<T extends Element>(
  ref: RefObject<T | null>,
  opts: { enter: number; exit: number; rootMargin: string },
  disabled: boolean
): boolean {
  const [inView, setInView] = useState(disabled);

  useLayoutEffect(() => {
    if (disabled) {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const thresholds: number[] = [];
    for (let i = 0; i <= 50; i++) thresholds.push(i / 50);

    const { enter, exit, rootMargin } = opts;

    const obs = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry.intersectionRatio;
        setInView((prev) => {
          if (!prev) return ratio >= enter;
          return ratio > exit;
        });
      },
      { threshold: thresholds, rootMargin }
    );

    obs.observe(el);
    const records = typeof obs.takeRecords === 'function' ? obs.takeRecords() : [];
    const last = records.filter((e) => e.target === el).pop();
    if (last) {
      const ratio = last.intersectionRatio;
      setInView(ratio >= enter);
    }

    return () => obs.disconnect();
  }, [disabled, opts.enter, opts.exit, opts.rootMargin]);

  return inView;
}

type ScrollRevealTag = 'div' | 'article' | 'span' | 'h2' | 'p';

function ScrollReveal({
  tag = 'div',
  preset,
  variants,
  className,
  children,
  staticOnMobile = false,
}: {
  tag?: ScrollRevealTag;
  preset: keyof typeof SCROLL_HYST_PRESET;
  variants: Variants;
  className?: string;
  children: ReactNode;
  staticOnMobile?: boolean;
}) {
  const ref = useRef<Element | null>(null);
  const reduceMotion = useReducedMotion();
  const isMobile = useMobileViewport();
  const instant = reduceMotion === true || (staticOnMobile && isMobile);
  const cfg = SCROLL_HYST_PRESET[preset];
  const inView = useHysteresisInView(ref, cfg, instant);
  const animate = instant ? 'visible' : inView ? 'visible' : 'hidden';

  const common = {
    ref,
    initial: 'hidden' as const,
    animate,
    variants,
    className,
    children,
  };

  switch (tag) {
    case 'article':
      return <motion.article {...common} />;
    case 'span':
      return <motion.span {...common} />;
    case 'h2':
      return <motion.h2 {...common} />;
    case 'p':
      return <motion.p {...common} />;
    default:
      return <motion.div {...common} />;
  }
}

function buildCinematicVariants(instant: boolean) {
  const tween = instant
    ? { duration: 0 }
    : {
        type: 'tween' as const,
        duration: CINEMATIC_DURATION,
        ease: CINEMATIC_EASE,
      };

  const container = (stagger = CINEMATIC_STAGGER, delayChildren = CINEMATIC_DELAY_CHILD): Variants => ({
    hidden: instant
      ? {}
      : {
          transition: {
            staggerChildren: stagger * 0.88,
            staggerDirection: -1,
          },
        },
    visible: {
      transition: instant
        ? { staggerChildren: 0, delayChildren: 0 }
        : { staggerChildren: stagger, delayChildren },
    },
  });

  const fadeUp = (y = 40): Variants => ({
    hidden: instant ? { opacity: 1, y: 0 } : { opacity: 0, y, transition: tween },
    visible: {
      opacity: 1,
      y: 0,
      transition: tween,
    },
  });

  const fadeFrom = (x: number, y = 20): Variants => ({
    hidden: instant ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x, y, transition: tween },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: tween,
    },
  });

  return { container, fadeUp, fadeFrom };
}

function useCinematic() {
  const reduceMotion = useReducedMotion();
  const instant = reduceMotion === true;
  const v = buildCinematicVariants(instant);
  return { instant, v };
}

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const isContact = pathname === '/contact';
  const solidHeader = isScrolled || (!isHome && !isContact);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 z-50 w-full py-5 transition-all duration-500 ${
          solidHeader ? 'bg-white shadow-sm' : 'on-dark bg-gradient-to-b from-black/40 to-transparent'
        }`}
      >
        <div className="container relative mx-auto px-6 lg:px-12">
          <div className="relative flex min-h-[44px] items-center justify-center md:min-h-[52px]">
            <div className="absolute left-0 top-1/2 z-10 flex -translate-y-1/2 items-center gap-4 lg:left-0">
              <button
                onClick={() => setIsMenuOpen(true)}
                className={`p-1 transition-all duration-500 hover:opacity-50 lg:hidden ${solidHeader ? 'text-black' : 'text-white'}`}
                aria-label="Menu"
              >
                <Menu size={20} />
              </button>
            </div>

            <Link
              to="/"
              aria-label={SITE_NAME}
              className={`mx-auto max-w-[min(100%,20rem)] whitespace-nowrap px-12 text-center text-[clamp(0.65rem,2.6vw,1.35rem)] font-semibold tracking-[0.2em] transition-colors duration-500 sm:px-14 sm:tracking-[0.26em] md:max-w-none md:px-16 md:text-2xl md:tracking-[0.34em] ${solidHeader ? 'text-black' : 'text-white'}`}
            >
              {SITE_NAME}
            </Link>

            <div className="absolute right-0 top-1/2 z-10 flex -translate-y-1/2 items-center gap-6 lg:right-0">
              <Link
                to="/contact"
                className={`p-1 text-[10px] font-medium uppercase tracking-[0.2em] transition-all duration-500 hover:opacity-50 ${solidHeader ? 'text-black' : 'text-white'}`}
              >
                Get in touch
              </Link>
            </div>
          </div>
        </div>

        {/* Categories Bar - Always visible on desktop */}
        <div className="mt-4 hidden justify-center pb-2 transition-all duration-500 lg:flex">
          <nav className="flex gap-8">
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={to + label}
                to={to}
                className={`nav-link !transition-colors !duration-500 ${solidHeader ? 'text-black' : 'text-white'}`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Full-screen Navigation Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[60] overflow-y-auto"
          >
            <div className="container mx-auto px-6 py-8">
              <div className="flex justify-between items-center mb-16">
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
                <h2 className="text-xl tracking-[0.2em]">Menu</h2>
                <div className="w-10"></div>
              </div>

              <nav className="flex flex-col gap-2">
                {NAV_LINKS.map(({ label, to }, idx) => (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    key={to + label}
                  >
                    <Link
                      to={to}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between border-b border-gray-100 py-6 text-xl tracking-[0.15em] transition-all duration-300 hover:pl-2"
                    >
                      <span>{label}</span>
                      <ChevronRight size={18} className="text-stone-400" aria-hidden />
                    </Link>
                  </motion.div>
                ))}
                <Link
                  to="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className="mt-6 rounded-full bg-stone-900 px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-white"
                >
                  Get in touch
                </Link>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const CarouselSection = () => {
  const [searchParams] = useSearchParams();
  const [activeIndex, setActiveIndex] = useState(initialCarouselIndex);
  const [trackIndex, setTrackIndex] = useState(initialCarouselTrackIndex);
  const [isTrackResetting, setIsTrackResetting] = useState(false);
  const activeItem = carouselReels[activeIndex] ?? carouselReels[0];
  if (!activeItem) {
    return (
      <section id="hero" className="flex min-h-[100dvh] items-center justify-center bg-neutral-900 text-white">
        <p className="text-sm text-white/70">Loading carousel…</p>
      </section>
    );
  }
  const reduceMotion = useReducedMotion();
  const instantCarousel = reduceMotion === true;

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % carouselReels.length);
    setTrackIndex((prev) => prev + 1);
  };

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : carouselReels.length - 1));
    setTrackIndex((prev) => prev - 1);
  };

  const selectCarouselItem = (originalIndex: number, itemTrackIndex: number) => {
    if (itemTrackIndex === trackIndex) return;
    if (itemTrackIndex === trackIndex - 1) {
      goToPrevious();
      return;
    }
    if (itemTrackIndex === trackIndex + 1) {
      goToNext();
      return;
    }

    setActiveIndex(originalIndex);
    setTrackIndex(itemTrackIndex);
  };

  const getNearestTrackIndex = (originalIndex: number) => {
    return [originalIndex, originalIndex + carouselLoopOffset, originalIndex + carouselLoopOffset * 2].reduce(
      (nearest, candidate) => (Math.abs(candidate - trackIndex) < Math.abs(nearest - trackIndex) ? candidate : nearest),
    );
  };

  const resetTrackPositionIfNeeded = () => {
    if (trackIndex < carouselLoopOffset) {
      setIsTrackResetting(true);
      setTrackIndex(trackIndex + carouselLoopOffset);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setIsTrackResetting(false));
      });
    }
    if (trackIndex >= carouselLoopOffset * 2) {
      setIsTrackResetting(true);
      setTrackIndex(trackIndex - carouselLoopOffset);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setIsTrackResetting(false));
      });
    }
  };

  useEffect(() => {
    const raw = searchParams.get('hero') ?? searchParams.get('slide');
    if (!raw) return;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > carouselReels.length) return;
    const i = parsed - 1;
    setActiveIndex(i);
    setTrackIndex(carouselLoopOffset + i);
  }, [searchParams]);

  useEffect(() => {
    const timer = setInterval(goToNext, CAROUSEL_AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    preloadHeroCarouselImages();
  }, []);

  useEffect(() => {
    preloadHeroNeighbors(activeIndex);
  }, [activeIndex]);

  return (
    <section
      id="hero"
      aria-label="Hero carousel"
      className="relative isolate flex min-h-[100dvh] w-full flex-col overflow-hidden bg-neutral-900 pb-12 pt-32 text-white [overflow-anchor:none] md:pb-16 md:pt-40"
    >
      <HeroCarouselBackground activeIndex={activeIndex} />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/68 via-black/48 to-black/72" aria-hidden />

      <div className="relative z-10 mx-auto w-full max-w-6xl shrink-0 px-6 pt-2 text-center [overflow-anchor:none] md:pt-4">
        <CarouselHeroText
          slideKey={activeIndex}
          title={activeItem.title}
          subtitle={activeItem.subtitle}
          instant={instantCarousel}
        />
      </div>

      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-center px-0 py-8 md:py-10">
        <div className="relative flex w-full min-h-[400px] items-center justify-center md:min-h-[550px]">
          <div className="relative h-[400px] w-full overflow-hidden md:h-[550px] [--slide-gap:0.25rem] [--slide-width:min(720px,86vw)]">
            <div
              onTransitionEnd={(event) => {
                if (event.target === event.currentTarget) {
                  resetTrackPositionIfNeeded();
                }
              }}
              className="absolute left-0 top-1/2 flex items-center gap-[var(--slide-gap)] will-change-transform"
              style={{
                transform: `translate3d(calc(50vw - (var(--slide-width) / 2) - ${trackIndex} * (var(--slide-width) + var(--slide-gap))), -50%, 0)`,
                transition: isTrackResetting ? 'none' : carouselTransitionCss,
              }}
            >
              {carouselTrackItems.map(({ item, originalIndex, key }, itemTrackIndex) => {
                const isCenter = itemTrackIndex === trackIndex;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectCarouselItem(originalIndex, itemTrackIndex)}
                    aria-label={`${item.title} — ${item.subtitle}`}
                    aria-current={isCenter ? 'true' : undefined}
                    className={`relative w-[var(--slide-width)] aspect-[16/10] flex-shrink-0 origin-center overflow-hidden rounded-[8px] md:rounded-[12px] bg-neutral-900 shadow-md will-change-transform ${
                      isCenter
                        ? 'scale-100 cursor-default opacity-100 shadow-[0_24px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/10'
                        : 'scale-[0.8] cursor-pointer opacity-[0.72]'
                    }`}
                    style={{
                      transition: isTrackResetting ? 'none' : carouselSlideTransitionCss,
                    }}
                  >
                    <img
                      src={item.poster}
                      alt={`${item.title} — ${item.subtitle}`}
                      loading="eager"
                      decoding="async"
                      fetchPriority={isCenter ? 'high' : 'auto'}
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pointer-events-none absolute left-0 right-0 top-1/2 flex -translate-y-1/2 justify-between px-8 md:px-16">
            <button
              type="button"
              onClick={goToPrevious}
              aria-label="Previous slide"
              className="pointer-events-auto p-3 text-white/90 transition-opacity hover:opacity-50"
            >
              <ChevronRight className="rotate-180" size={24} strokeWidth={1} aria-hidden />
            </button>
            <button
              type="button"
              onClick={goToNext}
              aria-label="Next slide"
              className="pointer-events-auto p-3 text-white/90 transition-opacity hover:opacity-50"
            >
              <ChevronRight size={24} strokeWidth={1} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex shrink-0 justify-center gap-2.5 pb-4 md:pb-6">
        {carouselReels.map((_, idx) => (
          <motion.button
            key={idx}
            type="button"
            aria-label={`Slide ${idx + 1}`}
            onClick={() => selectCarouselItem(idx, getNearestTrackIndex(idx))}
            animate={{
              width: activeIndex === idx ? 40 : 16,
              opacity: activeIndex === idx ? 1 : 0.35,
            }}
            transition={{
              duration: instantCarousel ? 0 : 0.45,
              ease: CAROUSEL_EASE,
            }}
            className="h-[2px] rounded-full bg-white"
          />
        ))}
      </div>
    </section>
  );
};

const IntroSection = () => {
  const { v } = useCinematic();

  return (
    <section className="relative isolate overflow-visible bg-zinc-900 px-4 py-16 text-white md:py-24">
      <SectionBlurredDarkBg imageUrl={MARKETING_WORK_IMG.campaignDesk} />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="space-y-8 [transform:translateZ(0)]">
          <ScrollReveal tag="article" preset="panel" variants={v.fadeUp(52)} className="relative min-h-[540px] overflow-hidden border border-white/10 bg-[#15120f] md:min-h-[620px]">
            <img src={MARKETING_WORK_IMG.teamHuddle} alt="" role="presentation" className="absolute inset-0 h-full w-full object-cover opacity-85" />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 via-black/10 to-red-600/45" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10 flex min-h-[540px] flex-col justify-between p-6 md:min-h-[620px] md:p-10">
              <div className="grid grid-cols-2 gap-8 text-[10px] leading-4 text-white/80 md:text-xs">
                <p>We position brands where press, culture, and public attention meet.</p>
                <p className="justify-self-end text-right">Strategy, design, and storytelling working together in one clear direction.</p>
              </div>
              <h2 className="text-center text-[clamp(4.6rem,15vw,11rem)] font-semibold leading-[0.78] tracking-[-0.08em] text-white/80">
                Impact
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ['40%', 'Press'],
                  ['30%', 'Social'],
                  ['20%', 'Events'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
                    <div className="text-3xl font-semibold">{value}</div>
                    <div className="text-sm text-white/75">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal tag="article" preset="panel" variants={v.fadeFrom(36, 32)} className="relative min-h-[460px] overflow-hidden border-4 border-[#f3ebdd] bg-[#15120f] md:min-h-[540px]">
            <img src={MARKETING_WORK_IMG.liveEvent} alt="" role="presentation" className="absolute inset-0 h-full w-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-700/45 via-black/10 to-orange-600/35" />
            <div className="relative z-10 flex min-h-[460px] flex-col justify-between p-6 md:min-h-[540px] md:p-8">
              <h2 className="text-[clamp(3.6rem,10vw,8.5rem)] font-semibold leading-[0.78] tracking-[-0.08em] text-white/85">
                Space to stand out
              </h2>
              <div className="grid items-end gap-6 md:grid-cols-[1fr_0.8fr_1fr]">
                <div className="space-y-4 rounded-2xl border border-white/20 bg-black/15 p-5 text-xs leading-5 text-white/80 backdrop-blur">
                  <p>Campaign work should create a clear, memorable distinction.</p>
                  <p>Press, visual identity, and social activation unified around one message.</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-semibold md:text-5xl">80.000</div>
                  <p className="text-xs text-white/70">potential organic reach</p>
                </div>
                <div className="space-y-4 rounded-2xl border border-white/20 bg-black/15 p-5 text-xs leading-5 text-white/80 backdrop-blur">
                  <p>We place brand image inside the conversations people already have.</p>
                  <p>Sentiment, feedback, and perception become the next move.</p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal tag="article" preset="panel" variants={v.fadeFrom(-40, 36)} className="relative min-h-[540px] overflow-hidden bg-[#15120f] md:min-h-[620px]">
            <img src={MARKETING_WORK_IMG.officeSync} alt="" role="presentation" className="absolute inset-0 h-full w-full object-cover opacity-85" />
            <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-cyan-500/25 to-red-600/40" />
            <div className="relative z-10 grid min-h-[540px] gap-8 p-6 md:min-h-[620px] md:grid-cols-[1.15fr_0.85fr] md:p-10">
              <div className="flex flex-col justify-end">
                <div className="mb-auto grid max-w-xl gap-3 text-xs leading-5 text-white/78 md:grid-cols-2">
                  <p>Start with a clear point of view and a useful story.</p>
                  <p>Build a recognizable presence across every touchpoint.</p>
                  <p>Turn ideas into content people want to share.</p>
                  <p>Create work that earns attention and trust.</p>
                </div>
                <h2 className="text-[clamp(4.1rem,12vw,9rem)] font-semibold leading-[0.78] tracking-[-0.08em] text-white/88">
                  Advantage
                </h2>
              </div>
              <div className="self-end rounded-[2rem] border border-white/25 bg-white/10 p-4 backdrop-blur-md">
                <div className="mb-4 overflow-hidden rounded-[1.5rem]">
                  <img src={MARKETING_WORK_IMG.laptopFocus} alt="Creative workspace" className="h-64 w-full object-cover" />
                </div>
                <h3 className="mb-2 text-2xl font-semibold">Creative presence</h3>
                <p className="text-sm leading-6 text-white/75">
                  Visual identity, voice, and experience working as one system.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

const ServicesSection = () => {
  const [mediaPress, brandImage, socialPresence, events, personalPr] = serviceCards;
  const { v } = useCinematic();

  return (
    <section id="services" className="relative isolate w-full overflow-visible bg-zinc-900 px-3 py-10 text-white md:px-5 md:py-16">
      <SectionBlurredDarkBg imageUrl={MARKETING_WORK_IMG.workshopPlan} />
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 [transform:translateZ(0)]">
          <ScrollReveal preset="panel" variants={v.fadeUp(28)} className="mb-1 flex items-end justify-between gap-6 md:col-span-2 md:mb-0">
            <div className="font-sans text-6xl font-black uppercase leading-[0.78] tracking-[-0.08em] text-white md:text-8xl">
              Services
            </div>
            <p className="hidden max-w-xs text-right text-xs font-semibold uppercase tracking-[0.25em] text-stone-300 md:block">
              A flexible canvas for your capabilities
            </p>
          </ScrollReveal>

          <ScrollReveal tag="article" preset="panel" variants={v.fadeFrom(-32, 26)} className="group relative min-h-[260px] overflow-hidden bg-[#11110f] md:min-h-[330px]">
            <img
              src={mediaPress.image}
              alt={mediaPress.title}
              className="absolute inset-0 h-full w-full object-cover opacity-75 transition-opacity duration-700 ease-out group-hover:opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />
            <div className="relative z-10 flex min-h-[260px] flex-col justify-between p-6 md:min-h-[330px] md:p-8">
              <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70">
                <span>Core idea</span>
                <span>01</span>
              </div>
              <div>
                <div className="mb-3 h-1 w-16 bg-white" />
                <div className="font-sans text-4xl font-black uppercase leading-[0.82] tracking-[-0.08em] md:text-6xl">
                  {mediaPress.title}
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal tag="article" preset="panel" variants={v.fadeFrom(32, 26)} className="group relative min-h-[260px] overflow-hidden bg-[#11110f] md:min-h-[330px]">
            <img
              src={brandImage.image}
              alt={brandImage.title}
              className="absolute inset-0 h-full w-full object-cover opacity-75 transition-opacity duration-700 ease-out group-hover:opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />
            <div className="relative z-10 flex min-h-[260px] flex-col justify-between p-6 md:min-h-[330px] md:p-8">
              <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70">
                <span>Core idea</span>
                <span>02</span>
              </div>
              <div>
                <div className="mb-3 h-1 w-16 bg-white" />
                <div className="font-sans text-4xl font-black uppercase leading-[0.82] tracking-[-0.08em] md:text-6xl">
                  {brandImage.title}
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal tag="article" preset="panel" variants={v.fadeUp(44)} className="group relative min-h-[520px] overflow-hidden bg-[#11110f] md:col-span-2 md:min-h-[650px]">
            <img
              src={socialPresence.image}
              alt={socialPresence.title}
              className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity duration-700 ease-out group-hover:opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/15 to-[#6e1f1a]/55" />
            <div className="relative z-10 flex min-h-[520px] flex-col justify-between p-6 md:min-h-[650px] md:p-10">
              <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70">
                <span>{SITE_NAME}</span>
                <span>Services · 02</span>
              </div>
              <div className="max-w-2xl text-sm leading-6 text-white/85">
                Build a recognizable experience across every audience touchpoint.
              </div>
              <div className="grid items-end gap-8 md:grid-cols-[1fr_0.8fr]">
                <div className="font-sans text-[clamp(3.8rem,11vw,9rem)] font-black uppercase leading-[0.8] tracking-[-0.08em]">
                  {socialPresence.title}
                </div>
                <div className="justify-self-end rounded-3xl border border-white/25 bg-white/10 p-5 text-sm leading-6 text-white/80 backdrop-blur-md">
                  <span className="mb-3 block font-sans text-4xl font-black">#sentiment</span>
                  Ideas, outcomes, and moments brought together in one clear flow.
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal tag="article" preset="panel" variants={v.fadeFrom(-28, 22)} className="relative min-h-[310px] overflow-hidden bg-[#11110f] md:min-h-[390px]">
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1 opacity-80">
              {MARKETING_POSTER_CYCLE.slice(0, 6).map((src, collageIndex) => (
                <img
                  key={src}
                  src={src}
                  alt={`${events.title} — image ${collageIndex + 1}`}
                  className="h-full w-full object-cover"
                />
              ))}
            </div>
            <div className="absolute inset-0 bg-black/35" />
            <div className="relative z-10 flex min-h-[310px] flex-col justify-end p-6 md:min-h-[390px] md:p-8">
              <div className="mb-3 h-1 w-16 bg-white" />
              <div className="font-sans text-5xl font-black uppercase leading-[0.82] tracking-[-0.08em] md:text-7xl">
                {events.title}
              </div>
              <p className="mt-4 max-w-sm text-xs leading-5 text-white/75">
                Use this card to describe launches, collaborations, experiences, or any work you want to highlight.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal tag="article" preset="panel" variants={v.fadeFrom(28, 22)} className="group relative min-h-[310px] overflow-hidden bg-[#11110f] md:min-h-[390px]">
            <img
              src={personalPr.image}
              alt={personalPr.title}
              className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity duration-700 ease-out group-hover:opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-transparent" />
            <div className="relative z-10 flex min-h-[310px] flex-col justify-between p-6 md:min-h-[390px] md:p-8">
              <div className="text-right text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70">
                Mood & tone
              </div>
              <div className="font-sans text-5xl font-black uppercase leading-[0.82] tracking-[-0.08em] md:text-7xl">
                {personalPr.title}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

const REEL_LAYOUT_EASE = [0.16, 1, 0.2, 1] as const;
const REEL_HOVER_GROW = 3.5;
const REEL_STRIP_MIN_WIDTH = '7.5rem';
const REEL_PEER_SHRINK = 0.78;

const ReelSection = () => {
  const [hovered, setHovered] = useState<number | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const isMobile = useMobileViewport();
  const { v: cv } = useCinematic();

  const reelSectionActive = useReelSectionInView(sectionRef);
  const reelVideoSources = useMemo(() => reelCinematicItems.map((r) => r.video), []);
  const bufferReels = !isMobile || reelSectionActive;

  const registerReelVideo = useCallback(
    (index: number, el: HTMLVideoElement | null) => {
      videoRefs.current[index] = el;
      const src = reelVideoSources[index];
      if (el && bufferReels && src && el.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
        void attachAndPrimeReel(el, src);
      }
    },
    [bufferReels, reelVideoSources]
  );

  useReelBuffer(bufferReels, reelVideoSources, videoRefs);

  const enterStrip = (index: number) => {
    setHovered(index);
    const v = videoRefs.current[index];
    const src = reelVideoSources[index];
    if (!v || !src) return;
    playReel(v);
    if (v.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
      void attachAndPrimeReel(v, src).then(() => {
        if (videoRefs.current[index] === v) playReel(v);
      });
    }
  };

  /** Row-level leave avoids spurious mouseleave while flex widths animate between strips. */
  const leaveReelRow = () => {
    setHovered(null);
    videoRefs.current.forEach((v) => {
      if (v) pauseReel(v);
    });
  };

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-[#050505] text-white [overflow-anchor:none] md:min-h-[min(102vh,1180px)]"
    >
      <div className="relative z-50 px-6 pb-8 pt-28 text-center md:pointer-events-none md:absolute md:inset-0 md:flex md:flex-col md:items-center md:justify-center md:px-10 md:pb-48 md:pt-28 [&_*]:md:pointer-events-none">
        <ScrollReveal
          preset="block"
          staticOnMobile
          className="pointer-events-none mx-auto max-w-3xl"
          variants={cv.container(0.14, 0.07)}
        >
          <motion.span variants={cv.fadeUp(20)} className="mb-4 block font-sans text-[10px] font-semibold uppercase tracking-[0.55em] text-stone-400 md:mb-6">
            Reel
          </motion.span>
          <motion.h2
            variants={cv.fadeUp(32)}
            className="mb-5 max-w-[22rem] font-serif text-[clamp(2rem,7vw,3.75rem)] italic leading-[0.98] tracking-[-0.03em] text-white drop-shadow-lg md:mx-auto md:mb-8 md:max-w-xl"
          >
            Short video — stories in motion
          </motion.h2>
          <motion.p
            variants={cv.fadeUp(28)}
            className="mx-auto max-w-lg text-sm leading-7 text-stone-200 drop-shadow md:text-[15px] md:leading-8"
          >
            Use this section for your showreel, campaign moments, product films, or any work that benefits from motion.
          </motion.p>
          <motion.p
            variants={cv.fadeUp(24)}
            className="mx-auto mt-4 hidden max-w-lg text-xs leading-6 text-stone-400 drop-shadow md:block md:text-sm md:leading-7"
          >
            Replace the included clips with your own files to make this section entirely yours.
          </motion.p>
        </ScrollReveal>
      </div>

      {isMobile ? (
        <ReelMobileCarousel items={reelCinematicItems} register={registerReelVideo} />
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/50 via-transparent to-black/80" />
          <div className="pointer-events-auto relative z-10 flex flex-col justify-center px-8 pb-48 pt-28">
            <div
              ref={rowRef}
              className="mx-auto flex h-[min(78vh,900px)] w-full max-w-[1580px] min-h-[620px] flex-row items-stretch gap-5"
              onMouseLeave={leaveReelRow}
            >
              {reelCinematicItems.map((r, i) => {
                const active = hovered === i;
                const peerDim = hovered !== null && !active;
                const softPause = hovered !== null && !active;
                const flexGrow = hovered === null ? 1 : active ? REEL_HOVER_GROW : REEL_PEER_SHRINK;
                return (
                  <div
                    key={r.id}
                    role="presentation"
                    className={`relative flex h-full min-h-[320px] cursor-pointer flex-col self-stretch overflow-hidden rounded-2xl border border-white/[0.14] bg-zinc-950 ring-1 ring-white/[0.04] transition-[flex-grow,box-shadow] duration-500 md:min-h-0 md:rounded-3xl ${
                      active
                        ? 'shadow-[0_28px_90px_rgba(0,0,0,0.68)] ring-white/15'
                        : 'shadow-[0_16px_56px_rgba(0,0,0,0.45)]'
                    }`}
                    style={{
                      flex: `${flexGrow} 1 ${REEL_STRIP_MIN_WIDTH}`,
                      minWidth: REEL_STRIP_MIN_WIDTH,
                      zIndex: active ? 25 : 10,
                      transitionTimingFunction: `cubic-bezier(${REEL_LAYOUT_EASE.join(',')})`,
                    }}
                    onMouseEnter={() => enterStrip(i)}
                  >
                    <div className="relative flex h-full min-h-0 w-full min-w-0 flex-1">
                      <div
                        className={
                          active
                            ? 'pointer-events-none absolute inset-x-0 top-0 z-20 h-[32%] bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-transparent'
                            : 'pointer-events-none absolute inset-x-0 top-0 z-20 h-[38%] bg-gradient-to-b from-white/[0.12] via-white/[0.03] to-transparent'
                        }
                      />
                      <div
                        className={`pointer-events-none absolute inset-0 z-10 bg-gradient-to-t ${
                          active
                            ? 'from-black/32 via-black/5 to-black/22'
                            : hovered === null
                              ? 'from-black/30 via-transparent to-black/15'
                              : 'from-black/50 via-black/5 to-black/25'
                        }`}
                      />
                      <div className="absolute inset-0 overflow-hidden [transform:translateZ(0)]">
                        <ReelStripVideo
                          src={r.video}
                          stripIndex={i}
                          active={active}
                          register={registerReelVideo}
                          softPause={softPause}
                          eagerLoad
                        />
                      </div>
                      {peerDim ? (
                        <div className="pointer-events-none absolute inset-0 z-[15] bg-black/20" aria-hidden />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

const ContactCTASection = () => {
  const { v } = useCinematic();

  return (
    <section
      id="contact"
      className="on-dark relative isolate overflow-visible bg-zinc-900 px-6 py-24 text-white md:py-32"
    >
      <SectionBlurredDarkBg imageUrl={MARKETING_WORK_IMG.remoteCall} />
      <ScrollReveal
        preset="block"
        className="relative z-10 mx-auto max-w-5xl text-center [transform:translateZ(0)]"
        variants={v.container(0.11, 0.05)}
      >
        <motion.span variants={v.fadeUp(24)} className="mb-5 block text-xs font-semibold uppercase tracking-[0.45em] text-[#c9a875]">
          Get in touch
        </motion.span>
        <motion.h2 variants={v.fadeUp(36)} className="mx-auto mb-8 max-w-4xl text-5xl font-semibold leading-none md:text-8xl">
          Let&apos;s make something memorable
        </motion.h2>
        <motion.p variants={v.fadeUp(32)} className="mx-auto mb-10 max-w-2xl text-base leading-8 text-white/75">
          Tell us what you&apos;re building and where you want to take it.
        </motion.p>
        <motion.div variants={v.fadeUp(28)} className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/contact"
            onClick={() => trackEvent('contact_page_click')}
            className="rounded-full bg-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-stone-900 transition-opacity hover:opacity-90"
          >
            Fill out the form
          </Link>
          <a
            href={`mailto:${SITE_EMAIL}`}
            onClick={() => trackEvent('contact_email_click')}
            className="rounded-full border border-white/40 px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-stone-900"
          >
            Send email
          </a>
          <Link
            to="/#newsletter"
            onClick={() => trackEvent('contact_newsletter_click')}
            className="rounded-full border border-white/40 px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-stone-900"
          >
            Newsletter
          </Link>
        </motion.div>
      </ScrollReveal>
    </section>
  );
};

const StorySection = () => {
  return (
    <section className="py-32 bg-white flex items-center justify-center text-center px-6">
      <div className="max-w-3xl mx-auto">
        <div>
          <h2 className="text-3xl md:text-5xl font-light tracking-[0.2em] mb-12">Our point of view</h2>
          <p className="text-lg md:text-xl font-serif text-[#444] leading-relaxed mb-12 italic">
            “Make the useful unmistakable.” We bring strategy, story, and design into one memorable experience.
          </p>
          <div className="relative w-full aspect-video overflow-hidden border border-gray-100 mb-12 group">
             <img 
              src={storyImage} 
              alt="Creative workspace" 
              className="w-full h-full object-cover grayscale brightness-75 transition-opacity duration-700 ease-out group-hover:opacity-95"
             />
          </div>
          <a href="#" className="btn-luxury">Our philosophy</a>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  const links = [
    {
      title: 'Agency',
      items: ['About', 'Team', 'Manifesto', 'Careers', 'Contact']
    },
    {
      title: 'Services',
      items: ['Media relations', 'Brand strategy', 'Events', 'Impact', 'Crisis comms']
    },
    {
      title: 'Insights',
      items: ['Case studies', 'Newsroom', 'Newsletter', 'Research', 'Trends']
    }
  ];

  const { v } = useCinematic();

  return (
    <footer className="bg-white px-6 lg:px-12 pt-20 pb-12 border-t border-gray-50">
      <div className="container mx-auto">
        <ScrollReveal
          preset="block"
          className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-x-12 md:gap-y-14 lg:grid-cols-4"
          variants={v.container(0.1, 0.04)}
        >
          <motion.div variants={v.fadeFrom(-20, 18)} className="flex flex-col gap-8">
            <h1 className="text-xl tracking-[0.28em] font-bold">{SITE_NAME}</h1>
            <div className="flex gap-4">
              {['LN', 'IG', 'FB'].map(social => (
                <a key={social} href="#" className="text-[10px] tracking-widest hover:underline">{social}</a>
              ))}
            </div>
          </motion.div>

          {links.map((group) => (
            <Fragment key={group.title}>
              <motion.div variants={v.fadeUp(26)}>
                <h4 className="text-[10px] tracking-[0.3em] font-bold mb-6">{group.title}</h4>
                <ul className="flex flex-col gap-3">
                  {group.items.map(item => (
                    <li key={item}>
                      {item === 'Contact' ? (
                        <Link
                          to="/contact"
                          className="text-[11px] tracking-widest text-[#555] transition-colors hover:text-black"
                        >
                          {item}
                        </Link>
                      ) : (
                        <a href="#" className="text-[11px] tracking-widest text-[#555] transition-colors hover:text-black">
                          {item}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </Fragment>
          ))}

          <motion.div
            variants={v.fadeUp(20)}
            className="col-span-full flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 md:flex-row"
          >
            <p className="text-[9px] tracking-widest text-[#888] uppercase">{SITE_COPYRIGHT}</p>
            <div className="flex gap-6 uppercase">
              <a href="#" className="text-[9px] tracking-widest text-[#888] hover:text-black">Privacy</a>
              <a href="#" className="text-[9px] tracking-widest text-[#888] hover:text-black">Legal</a>
              <a href="#" className="text-[9px] tracking-widest text-[#888] hover:text-black">Cookies</a>
            </div>
          </motion.div>
        </ScrollReveal>
      </div>
    </footer>
  );
};

function SectionBridge({
  id,
  kicker,
  title,
  body,
}: {
  id: string;
  kicker: string;
  title: string;
  body: string;
}) {
  const { v } = useCinematic();

  return (
    <section className="w-full border-y border-stone-100 bg-white px-6 py-14 md:px-10 md:py-20" aria-labelledby={id}>
      <ScrollReveal
        preset="block"
        className="mx-auto max-w-2xl text-center md:max-w-3xl [transform:translateZ(0)]"
        variants={v.container(0.12, 0.06)}
      >
        <motion.p variants={v.fadeUp(22)} className="mb-3 text-[10px] font-semibold uppercase tracking-[0.38em] text-stone-400 md:text-[11px]">
          {kicker}
        </motion.p>
        <motion.h2
          variants={v.fadeUp(30)}
          id={id}
          className="mb-5 text-xl font-semibold leading-snug tracking-tight text-stone-900 md:text-2xl md:leading-snug"
        >
          {title}
        </motion.h2>
        <motion.p variants={v.fadeUp(26)} className="text-sm leading-relaxed text-stone-600 md:text-[15px] md:leading-8">
          {body}
        </motion.p>
      </ScrollReveal>
    </section>
  );
}

function HomePage() {
  return (
    <>
      <main id="main-content">
        <CarouselSection />
        <SectionBridge
          id="bridge-hero-intro"
          kicker="Introduction"
          title="A flexible foundation for your next digital story"
          body="Use this section to introduce your point of view, your audience, and the work that makes your studio distinctive."
        />
        <IntroSection />
        <SectionBridge
          id="bridge-intro-services"
          kicker="Services"
          title="Services shaped around your clients"
          body="Replace these demo service cards with the offers, capabilities, and outcomes that make sense for your business."
        />
        <ServicesSection />
        <SectionBridge
          id="bridge-services-reel"
          kicker="Content"
          title="Motion that gives your work a pulse"
          body="Replace the demo clips with your own showreel, case-study moments, product films, or editorial content."
        />
        <ReelSection />
        <SectionBridge
          id="bridge-reel-contact"
          kicker="Get in touch"
          title="Start a conversation"
          body="Use this call to action to invite prospective clients to share their goals, timeline, and project context."
        />
        <ContactCTASection />
      </main>
      <SectionBridge
        id="bridge-contact-footer"
        kicker={SITE_NAME}
        title="More information and terms"
        body="Add the resources, legal links, and ways to connect that are useful for your visitors."
      />
    </>
  );
}

/** Site chrome + routed page (`Outlet`). Navbar renders here so router hooks always work. */
function SiteShell() {
  const { pathname } = useLocation();
  const isContact = pathname === '/contact';
  const showNewsletter = !isContact;

  return (
    <div className="min-h-screen bg-white">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <Outlet />
      {showNewsletter ? <NewsletterForm /> : null}
      {isContact ? null : <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<SiteShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>
      </Routes>
    </>
  );
}
