import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { trackEvent } from './analytics';
import { SITE_NAME } from './brand';

const CONTACT_FORM_ID =
  import.meta.env.VITE_FORMSPREE_CONTACT_ID?.trim() ||
  import.meta.env.VITE_FORMSPREE_NEWSLETTER_ID?.trim();

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export type ContactFormSectionIntro = {
  kicker: string;
  description: string;
};

type ContactFormProps = {
  variant?: 'dark' | 'light';
  centered?: boolean;
  /** Renders above the fields (light variant only). */
  sectionIntro?: ContactFormSectionIntro;
};

const LIGHT_LABEL_CLASS =
  'mb-2 block text-[10px] font-semibold uppercase tracking-[0.34em] text-black/40 [font-family:var(--font-sans)]';

const LIGHT_FIELD_CLASS =
  'w-full border-0 bg-white px-0 py-3.5 text-lg font-semibold leading-snug tracking-tight text-black shadow-none ring-0 placeholder:text-black/30 outline-none focus:outline-none focus-visible:outline-none md:text-xl md:leading-snug';

function LightFormShell({ children, centered }: { children: ReactNode; centered?: boolean }) {
  return (
    <div className={`bg-white text-left ${centered ? 'mx-auto w-full' : ''}`}>{children}</div>
  );
}

export function ContactForm({ variant = 'dark', centered = false, sectionIntro }: ContactFormProps) {
  const light = variant === 'light';
  const nameId = useId();
  const emailId = useId();
  const companyId = useId();
  const messageId = useId();
  const statusId = useId();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<SubmitState>('idle');
  const [feedback, setFeedback] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback('');

    const payload = {
      name: name.trim(),
      email: email.trim(),
      company: company.trim(),
      message: message.trim(),
      _subject: `${SITE_NAME} — Contact form`,
    };

    if (!payload.name || !payload.email || !payload.message) {
      setState('error');
      setFeedback('Please fill in name, email, and message.');
      return;
    }

    if (!CONTACT_FORM_ID) {
      setState('error');
      setFeedback('Form is not configured yet. (VITE_FORMSPREE_CONTACT_ID)');
      return;
    }

    setState('loading');

    try {
      const response = await fetch(`https://formspree.io/f/${CONTACT_FORM_ID}`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('submit failed');

      setState('success');
      setFeedback('Thank you. We will reply within 1–2 business days.');
      setName('');
      setEmail('');
      setCompany('');
      setMessage('');
      trackEvent('contact_form_submit', { method: 'formspree' });
    } catch {
      setState('error');
      setFeedback('Something went wrong. Please try again or email us directly.');
    }
  };

  const labelClass = light
    ? LIGHT_LABEL_CLASS
    : 'mb-2 block text-[10px] font-semibold uppercase tracking-[0.28em] text-white/70';

  const fieldClass = light
    ? LIGHT_FIELD_CLASS
    : 'w-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 transition-colors focus:border-[#c9a875]/60 focus:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a875]/40';

  const feedbackClass = light
    ? state === 'error'
      ? 'text-red-700'
      : 'text-emerald-700'
    : state === 'error'
      ? 'text-red-300'
      : 'text-emerald-300';

  const submitClass = light
    ? 'w-full rounded-full bg-[#dfff00] px-8 py-4 text-xs font-bold uppercase tracking-[0.22em] text-black transition-opacity hover:opacity-90 disabled:opacity-50 md:w-auto md:min-w-[200px]'
    : 'rounded-full bg-white px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-stone-900 transition-opacity hover:opacity-90 disabled:opacity-50';

  const fields = (
    <>
      {light ? (
        <div className="space-y-8">
          <div>
            <label htmlFor={nameId} className={labelClass}>
              Name
            </label>
            <input
              id={nameId}
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={state === 'loading'}
              className={fieldClass}
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor={emailId} className={labelClass}>
              Email
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={state === 'loading'}
              className={fieldClass}
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label htmlFor={companyId} className={labelClass}>
              Company / brand
            </label>
            <input
              id={companyId}
              name="company"
              type="text"
              autoComplete="organization"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={state === 'loading'}
              className={fieldClass}
              placeholder="Company name (optional)"
            />
          </div>
          <div>
            <label htmlFor={messageId} className={labelClass}>
              Project summary
            </label>
            <textarea
              id={messageId}
              name="message"
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={state === 'loading'}
              placeholder="Goals, timeline, budget…"
              className={`${fieldClass} min-h-[120px] resize-y`}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={nameId} className={labelClass}>
                Name
              </label>
              <input
                id={nameId}
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={state === 'loading'}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor={emailId} className={labelClass}>
                Email
              </label>
              <input
                id={emailId}
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={state === 'loading'}
                className={fieldClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor={companyId} className={labelClass}>
              Company / brand
            </label>
            <input
              id={companyId}
              name="company"
              type="text"
              autoComplete="organization"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={state === 'loading'}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor={messageId} className={labelClass}>
              Project summary
            </label>
            <textarea
              id={messageId}
              name="message"
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={state === 'loading'}
              placeholder="Goals, timeline, budget…"
              className={`${fieldClass} min-h-[140px] resize-y`}
            />
          </div>
        </>
      )}

      <div className={`${light ? 'pt-8' : 'pt-2'} ${centered && light ? 'flex justify-center' : ''}`}>
        <button type="submit" disabled={state === 'loading'} className={submitClass}>
          {state === 'loading' ? 'Sending…' : 'Send'}
        </button>
      </div>

      {feedback ? (
        <p
          id={statusId}
          role={state === 'error' ? 'alert' : 'status'}
          className={`text-sm tracking-wide ${centered ? 'text-center' : ''} ${feedbackClass}`}
        >
          {feedback}
        </p>
      ) : null}
    </>
  );

  if (light) {
    return (
      <LightFormShell centered={centered}>
        <form className="contact-form-light" onSubmit={onSubmit} noValidate>
          <div className={`space-y-10 ${centered ? 'text-center' : ''}`}>
            {sectionIntro ? (
              <header className={centered ? 'mx-auto max-w-xl' : 'max-w-xl'}>
                <p className={LIGHT_LABEL_CLASS}>{sectionIntro.kicker}</p>
                <p className="mt-4 text-sm leading-7 text-black/60 md:text-[15px]">{sectionIntro.description}</p>
              </header>
            ) : null}
            <div className={sectionIntro ? 'pt-10' : ''}>{fields}</div>
          </div>
        </form>
      </LightFormShell>
    );
  }

  return (
    <form className={`space-y-5 ${centered ? 'mx-auto w-full text-left' : ''}`} onSubmit={onSubmit} noValidate>
      {fields}
    </form>
  );
}
