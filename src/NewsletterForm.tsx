import { useId, useState, type FormEvent } from 'react';
import { trackEvent } from './analytics';
import { SITE_NAME } from './brand';

const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_NEWSLETTER_ID?.trim();

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export function NewsletterForm() {
  const emailId = useId();
  const statusId = useId();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<SubmitState>('idle');
  const [message, setMessage] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    const trimmed = email.trim();
    if (!trimmed) {
      setState('error');
      setMessage('Please enter your email address.');
      return;
    }

    if (!FORMSPREE_ID) {
      setState('error');
      setMessage('Newsletter signup is not configured yet. (VITE_FORMSPREE_NEWSLETTER_ID)');
      return;
    }

    setState('loading');

    try {
      const response = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmed,
          _subject: `${SITE_NAME} — Newsletter signup`,
        }),
      });

      if (!response.ok) {
        throw new Error('submit failed');
      }

      setState('success');
      setMessage('Thank you. We will send updates to your inbox.');
      setEmail('');
      trackEvent('newsletter_signup', { method: 'formspree' });
    } catch {
      setState('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <section id="newsletter" className="border-t border-gray-100 bg-white px-6 py-24" aria-labelledby="newsletter-heading">
      <div className="container mx-auto max-w-xl text-center">
        <h3 id="newsletter-heading" className="mb-4 text-sm font-medium tracking-[0.3em]">
          Newsletter
        </h3>
        <p className="mb-8 text-xs tracking-widest text-[#888]">
          A short, occasional note about ideas, projects, and new work.
        </p>
        <form className="flex flex-col gap-4 md:flex-row" onSubmit={onSubmit} noValidate>
          <label htmlFor={emailId} className="sr-only">
            Work email
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Work email"
            disabled={state === 'loading'}
            aria-describedby={message ? statusId : undefined}
            aria-invalid={state === 'error'}
            className="flex-1 border-b border-black px-1 py-2 text-xs tracking-widest placeholder:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={state === 'loading'}
            className="border-b border-black pb-1 text-[11px] font-medium tracking-[0.2em] transition-opacity hover:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black disabled:opacity-50"
          >
            {state === 'loading' ? 'Sending…' : 'Subscribe'}
          </button>
        </form>
        {message ? (
          <p
            id={statusId}
            role={state === 'error' ? 'alert' : 'status'}
            className={`mt-6 text-xs tracking-wide ${state === 'error' ? 'text-red-700' : 'text-emerald-800'}`}
          >
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
