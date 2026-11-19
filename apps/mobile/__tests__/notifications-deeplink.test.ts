import {
  parseDeepLink,
  generateShareUrl,
  generateContentShareUrl,
  openDeepLink,
  DEEP_LINK_ROUTES,
} from '../src/lib/deep-linking';

describe('Mobile Critical Path 9: Push Notifications & Deep-Link Dispatch', () => {
  it('parses incoming standard deep link URLs and extracts route info', () => {
    const parsed = parseDeepLink('azeebo://content/movie-123?autoplay=true&t=120');

    expect(parsed.handled).toBe(true);
    expect(parsed.screen).toBe('ContentDetail');
    expect(parsed.params?.['id']).toBe('movie-123');
    expect(parsed.query?.['autoplay']).toBe('true');
    expect(parsed.query?.['t']).toBe('120');
  });

  it('matches deep link path to route and extracts route parameters', () => {
    const match = parseDeepLink('azeebo://reality/show-77/contestant/cnt-44');

    expect(match.handled).toBe(true);
    expect(match.screen).toBe('ContestantDetail');
    expect(match.params?.['showId']).toBe('show-77');
    expect(match.params?.['id']).toBe('cnt-44');
  });

  it('generates shareable deep link and content share payloads', () => {
    const url = generateShareUrl('/content/the-arbitration');
    expect(url).toBe('https://azeebo.com/content/the-arbitration');

    const share = generateContentShareUrl('the-arbitration', 'The Arbitration');
    expect(share.url).toBe('https://azeebo.com/content/the-arbitration');
    expect(share.message).toContain('The Arbitration');
  });

  it('dispatches openDeepLink cleanly via Linking', async () => {
    const result = await openDeepLink('/content/the-arbitration');
    expect(result).toBe(true);
  });
});
