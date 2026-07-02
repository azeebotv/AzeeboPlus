import {
  ApiVersioningConfig,
  createVersionedResponse,
  API_VERSION_HEADER,
  DEFAULT_API_VERSION,
  API_VERSION_METADATA_KEY,
} from './api-versioning';

describe('ApiVersioningConfig', () => {
  describe('parseVersion', () => {
    it('should return default version for undefined header', () => {
      expect(ApiVersioningConfig.parseVersion(undefined)).toBe(DEFAULT_API_VERSION);
    });

    it('should parse version number string', () => {
      expect(ApiVersioningConfig.parseVersion('2')).toBe('2');
    });

    it('should strip v prefix', () => {
      expect(ApiVersioningConfig.parseVersion('v2')).toBe('2');
    });

    it('should lowercase version', () => {
      expect(ApiVersioningConfig.parseVersion('V2')).toBe('2');
    });

    it('should trim whitespace', () => {
      expect(ApiVersioningConfig.parseVersion('  3  ')).toBe('3');
    });
  });

  describe('validateVersion', () => {
    it('should return true for supported version', () => {
      expect(ApiVersioningConfig.validateVersion('1', ['1', '2', '3'])).toBe(true);
    });

    it('should return false for unsupported version', () => {
      expect(ApiVersioningConfig.validateVersion('4', ['1', '2', '3'])).toBe(false);
    });
  });

  describe('isDeprecated', () => {
    it('should return true for deprecated version', () => {
      expect(ApiVersioningConfig.isDeprecated('1', ['1', '2'])).toBe(true);
    });

    it('should return false for non-deprecated version', () => {
      expect(ApiVersioningConfig.isDeprecated('3', ['1', '2'])).toBe(false);
    });
  });

  it('should have correct static constants', () => {
    expect(ApiVersioningConfig.DEFAULT_VERSION).toBe(DEFAULT_API_VERSION);
    expect(ApiVersioningConfig.HEADER).toBe(API_VERSION_HEADER);
  });
});

describe('createVersionedResponse', () => {
  it('should create a versioned response with default version', () => {
    const result = createVersionedResponse({ id: 1 });
    expect(result.version).toBe(DEFAULT_API_VERSION);
    expect(result.data).toEqual({ id: 1 });
    expect(result.meta).toBeUndefined();
  });

  it('should use custom version', () => {
    const result = createVersionedResponse('data', '2');
    expect(result.version).toBe('2');
  });

  it('should include deprecation meta when deprecated', () => {
    const depDate = new Date('2025-01-01');
    const result = createVersionedResponse('data', '1', {
      deprecated: true,
      deprecationDate: depDate,
      deprecationMessage: 'Use v2 instead',
    });
    expect(result.meta?.deprecated).toBe(true);
    expect(result.meta?.deprecationDate).toBe(depDate.toISOString());
    expect(result.meta?.deprecationMessage).toBe('Use v2 instead');
  });

  it('should not include meta when not deprecated', () => {
    const result = createVersionedResponse('data', '1', { deprecated: false });
    expect(result.meta).toBeUndefined();
  });
});

describe('Constants', () => {
  it('should export API_VERSION_HEADER', () => {
    expect(API_VERSION_HEADER).toBe('X-API-Version');
  });

  it('should export DEFAULT_API_VERSION', () => {
    expect(DEFAULT_API_VERSION).toBe('1');
  });

  it('should export API_VERSION_METADATA_KEY', () => {
    expect(API_VERSION_METADATA_KEY).toBe('api:version');
  });
});
