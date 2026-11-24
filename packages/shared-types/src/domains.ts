/**
 * Platform domain registry.
 *
 * `domains.json` is the single source of truth for the base domain and its
 * subdomains. Runtime env vars (e.g. CDN_BASE_URL) still take precedence so
 * staging and local environments can override individual origins.
 */
import domainMap from './platform-domains.json';

export const BASE_DOMAIN: string = domainMap.baseDomain;

const sub = (key: keyof typeof domainMap.subdomains): string => {
  const label = domainMap.subdomains[key];
  return label ? `${label}.${BASE_DOMAIN}` : BASE_DOMAIN;
};

/** Hostnames for each platform surface (no scheme). */
export const DOMAINS = {
  root: BASE_DOMAIN,
  app: sub('app'),
  api: sub('api'),
  admin: sub('admin'),
  creator: sub('creator'),
  cdn: sub('cdn'),
  media: sub('media'),
  stream: sub('stream'),
  runbooks: sub('runbooks'),
  stagingRoot: sub('stagingRoot'),
  stagingApi: sub('stagingApi'),
} as const;

/**
 * Staging hostnames live under the staging namespace: `<label>.staging.<base>`.
 * `stagingRoot` and `stagingApi` are flat labels by design (`staging.<base>`,
 * `staging-api.<base>`), so the API host is not `api.staging.<base>`.
 */
const stagingSub = (key: keyof typeof domainMap.stagingSubdomains): string => {
  const label = domainMap.stagingSubdomains[key];
  return `${label}.${DOMAINS.stagingRoot}`;
};

/** Hostnames for the staging environment (no scheme). */
export const STAGING_DOMAINS = {
  root: DOMAINS.stagingRoot,
  api: DOMAINS.stagingApi,
  app: stagingSub('app'),
  www: stagingSub('www'),
  admin: stagingSub('admin'),
  creator: stagingSub('creator'),
  cdn: stagingSub('cdn'),
  media: stagingSub('media'),
  stream: stagingSub('stream'),
} as const;

/** Origins (https://host) for each platform surface. */
export const ORIGINS = {
  root: `https://${DOMAINS.root}`,
  app: `https://${DOMAINS.app}`,
  api: `https://${DOMAINS.api}`,
  admin: `https://${DOMAINS.admin}`,
  creator: `https://${DOMAINS.creator}`,
  cdn: `https://${DOMAINS.cdn}`,
  media: `https://${DOMAINS.media}`,
  stream: `https://${DOMAINS.stream}`,
  runbooks: `https://${DOMAINS.runbooks}`,
  stagingRoot: `https://${DOMAINS.stagingRoot}`,
  stagingApi: `https://${DOMAINS.stagingApi}`,
} as const;

/** Staging origins (https://host) for each staging surface. */
export const STAGING_ORIGINS = {
  root: `https://${STAGING_DOMAINS.root}`,
  api: `https://${STAGING_DOMAINS.api}`,
  app: `https://${STAGING_DOMAINS.app}`,
  www: `https://${STAGING_DOMAINS.www}`,
  admin: `https://${STAGING_DOMAINS.admin}`,
  creator: `https://${STAGING_DOMAINS.creator}`,
  cdn: `https://${STAGING_DOMAINS.cdn}`,
  media: `https://${STAGING_DOMAINS.media}`,
  stream: `https://${STAGING_DOMAINS.stream}`,
} as const;

/** Returns the CDN base URL, honoring the CDN_BASE_URL override. */
export function getCdnBaseUrl(): string {
  return process.env.CDN_BASE_URL || ORIGINS.cdn;
}

/** Returns the public web base URL, honoring NEXT_PUBLIC_BASE_URL. */
export function getPublicBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || ORIGINS.root).replace(/\/+$/, '');
}
