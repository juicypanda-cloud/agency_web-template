const GA4_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim();
const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN?.trim();

function loadScript(src: string, attrs: Record<string, string> = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    Object.entries(attrs).forEach(([key, value]) => script.setAttribute(key, value));
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function initGa4(): void {
  if (!GA4_ID) return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA4_ID, { send_page_view: true });

  void loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`);
}

function initPlausible(): void {
  if (!PLAUSIBLE_DOMAIN) return;

  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = PLAUSIBLE_DOMAIN;
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);
}

/** Load analytics when IDs are set in `.env` (see `.env.example`). */
export function initAnalytics(): void {
  initGa4();
  initPlausible();
}

/** Custom events (newsletter signup, CTA clicks, etc.). */
export function trackEvent(name: string, params?: Record<string, string>): void {
  if (GA4_ID && window.gtag) {
    window.gtag('event', name, params ?? {});
  }
  if (PLAUSIBLE_DOMAIN && window.plausible) {
    window.plausible(name, params ? { props: params } : undefined);
  }
}

export function hasAnalytics(): boolean {
  return Boolean(GA4_ID || PLAUSIBLE_DOMAIN);
}
