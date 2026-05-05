import {
  ApiVersioningConfig,
  createVersionedResponse,
  DEFAULT_API_VERSION,
  VersionedResponse,
} from '../api-versioning';

describe('API Versioning', () => {
  describe('ApiVersioningConfig.parseVersion', () => {
    it('should get version from header', () => {
      const result = ApiVersioningConfig.parseVersion('2');
      expect(result).toBe('2');
    });

    it('should return default version when header is undefined', () => {
      const result = ApiVersioningConfig.parseVersion(undefined);
      expect(result).toBe(DEFAULT_API_VERSION);
    });

    it('should parse version with v prefix', () => {
      const result = ApiVersioningConfig.parseVersion('v2');
      expect(result).toBe('2');
    });
  });

  describe('createVersionedResponse', () => {
    it('should create versioned response', () => {
      const data = { id: '123', name: 'Test' };
      const response: VersionedResponse<typeof data> = createVersionedResponse(data, '2');

      expect(response.version).toBe('2');
      expect(response.data).toEqual(data);
    });

    it('should use default version when not specified', () => {
      const data = { id: '123' };
      const response = createVersionedResponse(data);

      expect(response.version).toBe(DEFAULT_API_VERSION);
    });

    it('should include meta for deprecated versions', () => {
      const data = { id: '123' };
      const deprecationDate = new Date();
      const response = createVersionedResponse(data, '1', {
        deprecated: true,
        deprecationDate,
        deprecationMessage: 'Use version 2 instead',
      });

      expect(response.meta?.deprecated).toBe(true);
      expect(response.meta?.deprecationDate).toBe(deprecationDate.toISOString());
      expect(response.meta?.deprecationMessage).toBe('Use version 2 instead');
    });
  });
});
