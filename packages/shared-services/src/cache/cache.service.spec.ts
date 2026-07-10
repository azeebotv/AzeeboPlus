import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { RedisService } from '../redis/redis.service';

jest.mock('../redis/redis.service');

describe('CacheService', () => {
  let service: CacheService;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            ttl: jest.fn(),
            keys: jest.fn(),
            getClient: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return cached value when key exists', async () => {
      const mockValue = JSON.stringify({ data: 'test' });
      redisService.get.mockResolvedValue(mockValue);

      const result = await service.get('test-key');

      expect(result).toEqual({ data: 'test' });
      expect(redisService.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      redisService.get.mockResolvedValue(null);

      const result = await service.get('non-existent-key');

      expect(result).toBeNull();
    });

    it('should handle JSON parsing errors gracefully', async () => {
      redisService.get.mockResolvedValue('invalid-json');

      const result = await service.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store value with default TTL', async () => {
      await service.set('test-key', { data: 'test' });

      expect(redisService.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ data: 'test' }),
        300
      );
    });

    it('should store value with custom TTL', async () => {
      await service.set('test-key', { data: 'test' }, 600);

      expect(redisService.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ data: 'test' }),
        600
      );
    });

    it('should handle errors gracefully', async () => {
      redisService.set.mockRejectedValue(new Error('Redis error'));

      // Should not throw
      await expect(service.set('test-key', { data: 'test' })).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete cached value', async () => {
      await service.delete('test-key');

      expect(redisService.del).toHaveBeenCalledWith('test-key');
    });

    it('should handle errors gracefully', async () => {
      redisService.del.mockRejectedValue(new Error('Redis error'));

      await expect(service.delete('test-key')).resolves.not.toThrow();
    });
  });

  describe('has', () => {
    it('should return true when key exists', async () => {
      redisService.ttl.mockResolvedValue(100);

      const result = await service.has('test-key');

      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      redisService.ttl.mockResolvedValue(-2);

      const result = await service.has('test-key');

      expect(result).toBe(false);
    });

    it('should return false when TTL is -1 (persistent)', async () => {
      redisService.ttl.mockResolvedValue(-1);

      const result = await service.has('test-key');

      expect(result).toBe(false);
    });
  });

  describe('deleteByPattern', () => {
    it('should delete multiple keys matching pattern', async () => {
      const mockClient = {
        keys: jest.fn().mockResolvedValue(['key1', 'key2', 'key3']),
        del: jest.fn().mockResolvedValue(3),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      redisService.getClient.mockResolvedValue(mockClient as any);

      await service.deleteByPattern('prefix:*');

      expect(mockClient.keys).toHaveBeenCalledWith('prefix:*');
      expect(mockClient.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
    });

    it('should handle empty key list', async () => {
      const mockClient = {
        keys: jest.fn().mockResolvedValue([]),
        del: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      redisService.getClient.mockResolvedValue(mockClient as any);

      await service.deleteByPattern('prefix:*');

      expect(mockClient.keys).toHaveBeenCalled();
      expect(mockClient.del).not.toHaveBeenCalled();
    });
  });

  describe('invalidate', () => {
    it('should call deleteByPattern', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const deleteByPatternSpy = jest.spyOn(service as any, 'deleteByPattern');

      await service.invalidate('prefix:*');

      expect(deleteByPatternSpy).toHaveBeenCalledWith('prefix:*');
    });
  });
});
