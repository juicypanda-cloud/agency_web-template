import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ContactForm } from '../ContactForm';
import { MARKETING_WORK_IMG } from '../siteImages';
import { trackEvent } from '../analytics';
import {
  NAV_LINKS,
  SITE_ADDRESSES,
  SITE_COPYRIGHT,
  SITE_EMAIL,
  SITE_LOGO_MARK,
  SITE_NAME,
  SITE_PHONE,
  SITE_PHONE_HREF,
  SITE_SOCIAL_LINKS,
  SITE_TAGLINE,
} from '../brand';

const LEGAL_LINKS = [
  { label: 'Terms', href: '#' },
  { label: 'Privacy', href: '#' },
  { label: 'Cookies', href: '#' },
] as const;

const FOOTER_NAV = [...NAV_LINKS, { label: 'Newsletter', to: '/#newsletter' }];

const KICKER_CLASS =
  'text-[10px] font-semibold uppercase tracking-[0.34em] text-black/40 [font-family:var(--font-sans)]';

const SLASH_CLASS = 'mr-2 inline-block shrink-0 text-black/30 select-none';

const VALUE_CLASS =
  'text-lg font-semibold leading-snug tracking-tight text-black md:text-xl md:leading-snug';

const VALUE_LINK_CLASS = `${VALUE_CLASS} underline decoration-1 underline-offset-[0.2em] transition-opacity hover:opacity-55`;

function ContactKicker({ children }: { children: string }) {
  return <p className={KICKER_CLASS}>{children}</p>;
}

function ContactColumn({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <ContactKicker>{label}</ContactKicker>
      <div className="mt-5 min-w-0 space-y-3">{children}</div>
    </div>
  );
}

function ContactLine({ children }: { children: ReactNode }) {
  return (
    <p className={VALUE_CLASS}>
      <span className={SLASH_CLASS} aria-hidden>
        /
      </span>
      {children}
    </p>
  );
}

function ContactTextLink({ href, children, onClick }: { href: string; children: string; onClick?: () => void }) {
  return (
    <a href={href} onClick={onClick} className={`block max-w-full break-words ${VALUE_LINK_CLASS}`}>
      {children}
    </a>
  );
}

function ContactSlashLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} className={`inline-flex max-w-full break-words ${VALUE_LINK_CLASS}`}>
      <span className={SLASH_CLASS} aria-hidden>
        /
      </span>
      {children}
    </a>
  );
}

export function ContactPage() {
  return (
    <main id="main-content" className="bg-white text-black">
      <section className="relative isolate flex min-h-[min(62vh,780px)] flex-col items-center justify-center overflow-hidden px-6 pt-24 text-center text-white md:min-h-[min(68vh,860px)] md:pt-28">
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <img
            src={MARKETING_WORK_IMG.liveEvent}
            alt=""
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/35" />
        </div>

        <p
          className="pointer-events-none absolute inset-x-0 bottom-[12%] z-[1] select-none text-center font-serif text-[clamp(2.5rem,12vw,8rem)] font-light italic leading-none tracking-tight text-white/[0.12] md:bottom-[14%] md:text-[clamp(3rem,14vw,10rem)]"
          aria-hidden
        >
          {SITE_NAME}
        </p>

        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-2">
          <h1 className="hero-headline text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl lg:text-7xl">
            Your brand&apos;s next chapter
          </h1>
          <p className="hero-subline mt-3 text-lg font-medium tracking-wide text-white/90 md:text-xl">
            — we&apos;ll write it together
          </p>
          <a
            href="#contact-form"
            className="mt-8 inline-flex rounded-full bg-[#dfff00] px-8 py-3.5 text-[11px] font-bold uppercase tracking-[0.22em] text-black transition-opacity hover:opacity-90"
          >
            Fill out the form
          </a>
        </div>
      </section>

      <section className="relative isolate px-6 pb-10 pt-14 md:px-10 md:pt-20 lg:px-14 lg:pb-14">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-col gap-14 md:gap-16">
            <h2 className="max-w-[14ch] text-[clamp(2.75rem,9vw,6.5rem)] !leading-[0.95] font-bold tracking-[-0.04em] text-black">
              Let&apos;s talk
            </h2>

            <div className="grid w-full grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-10 lg:gap-y-14 xl:gap-x-14">
              <ContactColumn label="Telegram · Phone">
                <ContactTextLink href={SITE_PHONE_HREF} onClick={() => trackEvent('contact_phone_click')}>
                  {SITE_PHONE}
                </ContactTextLink>
              </ContactColumn>

              <ContactColumn label="Email">
                <ContactTextLink
                  href={`mailto:${SITE_EMAIL}`}
                  onClick={() => trackEvent('contact_email_click')}
                >
                  {SITE_EMAIL}
                </ContactTextLink>
              </ContactColumn>

              <ContactColumn label="Address">
                <ul className="space-y-3">
                  {SITE_ADDRESSES.map((line) => (
                    <li key={line}>
                      <ContactLine>{line}</ContactLine>
                    </li>
                  ))}
                </ul>
              </ContactColumn>

              <ContactColumn label="Social">
                <ul className="space-y-3">
                  {SITE_SOCIAL_LINKS.map(({ label, href }) => (
                    <li key={label}>
                      <ContactSlashLink href={href}>{label}</ContactSlashLink>
                    </li>
                  ))}
                </ul>
              </ContactColumn>
            </div>
          </div>

          <div id="contact-form" className="mt-16 bg-white pt-14 md:mt-24 md:pt-16">
            <div className="mx-auto w-full max-w-2xl">
              <ContactForm
                variant="light"
                centered
                sectionIntro={{
                  kicker: 'Send a message',
                  description:
                    'Tell us about your project goals, timeline, and budget. We reply within 1–2 business days.',
                }}
              />
            </div>
          </div>

          <footer className="mt-20 border-t border-black/10 pt-10 md:mt-28 md:pt-12">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-[11px] font-bold tracking-wider text-white"
                  aria-hidden
                >
                  {SITE_LOGO_MARK}
                </div>
                <div>
                  <p className="text-lg font-bold tracking-[0.2em]">{SITE_NAME}</p>
                  <p className="mt-0.5 text-xs text-black/50">{SITE_TAGLINE}</p>
                </div>
              </div>

              <nav
                className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/70"
                aria-label="Footer"
              >
                {FOOTER_NAV.map(({ label, to }) => (
                  <Link key={label} to={to} className="transition-opacity hover:opacity-50">
                    {label}
                  </Link>
                ))}
              </nav>

              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-black/40 lg:text-right">
                {SITE_COPYRIGHT}
              </p>
            </div>

            <nav
              className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-black/10 pt-8"
              aria-label="Legal"
            >
              {LEGAL_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/40 transition-colors hover:text-black"
                >
                  {label}
                </a>
              ))}
            </nav>
          </footer>
        </div>
      </section>
    </main>
  );
}
