import {
  DOMAINS,
  ORIGINS,
  STAGING_DOMAINS,
  STAGING_ORIGINS,
  getCdnBaseUrl,
  getPublicBaseUrl,
} from './domains';

describe('domain registry', () => {
  const saved = { cdn: process.env.CDN_BASE_URL, pub: process.env.NEXT_PUBLIC_BASE_URL };

  afterEach(() => {
    process.env.CDN_BASE_URL = saved.cdn;
    process.env.NEXT_PUBLIC_BASE_URL = saved.pub;
  });

  it('derives hostnames from domains.json', () => {
    expect(DOMAINS.api).toBe('api.azeeboplus.com');
    expect(DOMAINS.root).toBe('azeeboplus.com');
    expect(DOMAINS.stagingApi).toBe('staging-api.azeeboplus.com');
    expect(ORIGINS.admin).toBe('https://admin.azeeboplus.com');
  });

  it('derives staging hostnames from the registry', () => {
    expect(STAGING_DOMAINS.root).toBe('staging.azeeboplus.com');
    // The canonical staging API host is a flat label, not api.staging.*.
    expect(STAGING_DOMAINS.api).toBe('staging-api.azeeboplus.com');
    expect(STAGING_DOMAINS.cdn).toBe('cdn.staging.azeeboplus.com');
    expect(STAGING_DOMAINS.media).toBe('media.staging.azeeboplus.com');
    expect(STAGING_DOMAINS.admin).toBe('admin.staging.azeeboplus.com');
    expect(STAGING_ORIGINS.api).toBe('https://staging-api.azeeboplus.com');
  });

  it('honors CDN_BASE_URL and falls back to the registry', () => {
    delete process.env.CDN_BASE_URL;
    expect(getCdnBaseUrl()).toBe(ORIGINS.cdn);
    process.env.CDN_BASE_URL = 'https://staging-cdn.example.com';
    expect(getCdnBaseUrl()).toBe('https://staging-cdn.example.com');
  });

  it('strips trailing slashes from NEXT_PUBLIC_BASE_URL', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://staging.azeeboplus.com///';
    expect(getPublicBaseUrl()).toBe('https://staging.azeeboplus.com');
  });
});
