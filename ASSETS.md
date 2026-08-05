# Asset replacement guide

The included images and videos are demo content. Do not assume they are licensed for resale in a marketplace product.

Before publishing, replace them with files you own or have explicit rights to redistribute:

- `public/images/posters/` — gallery and service-card images
- `public/images/posters/hero/` — hero carousel images
- `public/videos/reels/` — seven reel clips
- `src/assets/` — bundled image used by the hero slide

Keep the current dimensions and filenames where possible. If you rename a video, update `REEL_CLIP_FILES` in `src/reelVideos.ts`. If you replace image paths, update `src/siteImages.ts`.

For a marketplace preview, use low-resolution demo media or assets whose resale license explicitly permits inclusion in a downloadable template.
