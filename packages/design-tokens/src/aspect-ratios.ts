/**
 * Formal Aspect-Ratio Token Manifest (PMR Task DD-05)
 * Defines canonical display and card aspect ratios across Azeebo+ surfaces.
 */

export const aspectRatios = {
  /** 3:4 (0.75) — Key art, movie cards, vertical posters */
  poster: '3:4',
  /** 4:5 (0.80) — Social feed cards, influencer features */
  feed: '4:5',
  /** 16:9 (1.777) — Video player heroes, stream thumbnails, TV backdrops */
  landscape: '16:9',
  /** 1:1 (1.00) — Avatar thumbnails, badges, album covers */
  square: '1:1',
  /** 9:16 (0.5625) — Agbala vertical story episodes, mobile full-screen reels */
  story: '9:16',
} as const;

export const aspectRatioValues = {
  poster: 3 / 4,
  feed: 4 / 5,
  landscape: 16 / 9,
  square: 1,
  story: 9 / 16,
} as const;

export type AspectRatioName = keyof typeof aspectRatios;
