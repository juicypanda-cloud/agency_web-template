/**
 * Buyer settings
 *
 * This is the main place to personalize the template. Replace the demo values
 * below before publishing your own site.
 */
export const SITE_NAME = 'Studio Nova';
export const SITE_LOGO_MARK = 'SN';
export const SITE_TAGLINE = 'Independent creative studio';
export const SITE_DESCRIPTION =
  'Studio Nova is a modern creative studio for brands, campaigns, and digital experiences.';
export const SITE_EMAIL = 'hello@example.com';
export const SITE_PHONE = '+1 (555) 010-2026';
export const SITE_PHONE_HREF = 'tel:+15550102026';
export const SITE_ADDRESSES = ['123 Creative Street, Your City', 'Available worldwide'] as const;

export const SITE_SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://instagram.com/' },
  { label: 'LinkedIn', href: 'https://linkedin.com/' },
  { label: 'Behance', href: 'https://behance.net/' },
] as const;

export const NAV_LINKS = [
  { label: 'Services', to: '/#services' },
  { label: 'Work', to: '/#work' },
  { label: 'Studio', to: '/#studio' },
  { label: 'Journal', to: '/#journal' },
  { label: 'Contact', to: '/contact' },
] as const;

export const SERVICE_CARDS = [
  { title: 'Brand Strategy', imageKey: 'strategySession' },
  { title: 'Creative Direction', imageKey: 'creativeReview' },
  { title: 'Digital Experiences', imageKey: 'studioTeam' },
  { title: 'Campaigns & Events', imageKey: 'liveEvent' },
  { title: 'Content Systems', imageKey: 'clientMeeting' },
] as const;

export const SITE_COPYRIGHT = `© ${SITE_NAME} ${new Date().getFullYear()}`;
