/**
 * Site-wide marketing imagery — local art poster assets (no external URLs).
 *
 * Source files live in `public/images/posters/`.
 * Hero carousel uses optimized copies in `public/images/posters/hero/`.
 */

const POSTER = '/images/posters';
const HERO = '/images/posters/hero';

/** All ten art posters — graphic / editorial / design pieces. */
export const ART_POSTERS = [
  `${POSTER}/01-tv-wall.jpg`,
  `${POSTER}/02-film-spiral.jpg`,
  `${POSTER}/03-maven-scholarship.jpg`,
  `${POSTER}/04-film-set.jpg`,
  `${POSTER}/05-brand-intelligence.jpg`,
  `${POSTER}/06-idea-overload.jpg`,
  `${POSTER}/07-zurag-avalt-bts.png`,
  `${POSTER}/08-be-different.jpg`,
  `${POSTER}/09-procrastination.jpg`,
  `${POSTER}/10-dialogue-silhouettes.jpg`,
] as const;

/** Photo shoot slide — behind-the-scenes still. */
export const ZURAG_AVALT_POSTER = `${POSTER}/07-zurag-avalt-bts.png`;
export const ZURAG_AVALT_HERO_POSTER = `${HERO}/07-zurag-avalt-bts.png`;

const STOCK = {
  tvWall: ART_POSTERS[0],
  filmSpiral: ART_POSTERS[1],
  mavenScholarship: ART_POSTERS[2],
  filmSet: ART_POSTERS[3],
  brandIntelligence: ART_POSTERS[4],
  ideaOverload: ART_POSTERS[5],
  photoShoot: ART_POSTERS[6],
  beDifferent: ART_POSTERS[7],
  procrastination: ART_POSTERS[8],
  dialogueSilhouettes: ART_POSTERS[9],
} as const;

/** Poster cycle for reels, collage, and gallery strips. */
export const NEW_IMAGES = ART_POSTERS;
export const MARKETING_POSTER_CYCLE = [...ART_POSTERS];

/** Named poster slots used across the site. */
export const MARKETING_WORK_IMG = {
  strategySession: STOCK.tvWall,
  teamHuddle: STOCK.filmSpiral,
  creativeReview: STOCK.mavenScholarship,
  officeSync: STOCK.filmSet,
  workshopPlan: STOCK.brandIntelligence,
  studioTeam: STOCK.ideaOverload,
  remoteCall: STOCK.photoShoot,
  campaignDesk: STOCK.beDifferent,
  laptopFocus: STOCK.procrastination,
  liveEvent: STOCK.dialogueSilhouettes,
  collaborationRoom: STOCK.mavenScholarship,
  clientMeeting: STOCK.beDifferent,
} as const;

/** Hero carousel backgrounds — optimized hero art stills (r1–r7). Index 6 = photo shoot. */
export const HERO_CAROUSEL_IMAGES = [
  `${HERO}/01-tv-wall.jpg`,
  `${HERO}/02-film-spiral.jpg`,
  `${HERO}/03-maven-scholarship.jpg`,
  `${HERO}/04-film-set.jpg`,
  `${HERO}/05-brand-intelligence.jpg`,
  `${HERO}/06-idea-overload.jpg`,
  ZURAG_AVALT_HERO_POSTER,
] as const;

export const heroCarouselPoster = (index: number) =>
  index === 6 ? ZURAG_AVALT_HERO_POSTER : HERO_CAROUSEL_IMAGES[index % HERO_CAROUSEL_IMAGES.length]!;

/** Hero opens on film-set art — index 3. */
export const HERO_INITIAL_CAROUSEL_INDEX = 3;
