import { useEffect, useState, type RefObject } from 'react';

/** Fires once when the reel block is approaching the viewport (early buffer start). */
export function useReelSectionInView(sectionRef: RefObject<HTMLElement | null>): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || active) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true);
          obs.disconnect();
        }
      },
      { rootMargin: '1000px 0px', threshold: 0 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [sectionRef, active]);

  return active;
}
