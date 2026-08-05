Creative Studio Template

A responsive React/Vite website template for creative studios, agencies, freelancers, and portfolio-led brands. It includes an animated hero, service cards, a video reel, contact page, newsletter, optional analytics, and accessible navigation.

## Quick start

**Requirement:** Node.js 18 or later.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` if you want forms or analytics.
3. Start the local server: `npm run dev`
4. Build for production: `npm run build`

## Customize the template

Start with `src/brand.ts`. It contains the demo business name, logo initials, tagline, contact information, social links, navigation labels, and service cards.

Then update these files:

| What to change | Where |
| --- | --- |
| Main page copy and section headings | `src/App.tsx` |
| Contact page copy and footer links | `src/pages/ContactPage.tsx` |
| Hero/reel labels and video filenames | `src/reelVideos.ts` |
| Browser title and description | `index.html` |
| Colors and global typography | `src/index.css` |

## Replace assets

- Replace images in `public/images/posters/` and matching hero images in `public/images/posters/hero/`.
- Replace the seven demo videos in `public/videos/reels/`, keeping the existing filenames, or update `REEL_CLIP_FILES` in `src/reelVideos.ts`.
- Use only assets you own or are licensed to redistribute. See `ASSETS.md` before publishing a marketplace package.

## Forms and analytics

Forms are optional. Without a Formspree ID, the site remains functional and tells visitors that the form is not configured.

Set any of these in `.env` or in your deployment host:

```env
VITE_FORMSPREE_CONTACT_ID=
VITE_FORMSPREE_NEWSLETTER_ID=
VITE_GA4_MEASUREMENT_ID=
VITE_PLAUSIBLE_DOMAIN=
```

Never commit `.env` files.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create the production bundle in `dist/` |
| `npm run lint` | Run the TypeScript check |
| `npm run fetch:posters` | Fetch poster assets configured by the project |
| `npm run optimize:hero` | Create optimized hero images |
| `npm run compress:videos` | Re-encode reel clips |

## Before publishing

Follow the checklist in `MARKETPLACE-CHECKLIST.md`. In particular, replace every demo asset, test the contact fallback, build the project, and include only files buyers need.
