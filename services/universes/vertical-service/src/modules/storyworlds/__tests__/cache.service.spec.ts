import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../agbala/cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheService],
    }).compile();

    service = module.get<CacheService>(CacheService);
    service.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      service.set('key1', 'value1');
      expect(service.get('key1')).toBe('value1');
    });

    it('should store objects', () => {
      const obj = { name: 'test', count: 42 };
      service.set('obj1', obj);
      expect(service.get('obj1')).toEqual(obj);
    });

    it('should return undefined for missing keys', () => {
      expect(service.get('missing')).toBeUndefined();
    });
  });

  describe('expiration', () => {
    it('should expire entries after TTL', () => {
      service.set('short', 'value', 1); // 1ms TTL
      // Wait for expiration
      return new Promise((resolve) => setTimeout(resolve, 10)).then(() => {
        expect(service.get('short')).toBeUndefined();
      });
    });

    it('should keep entries within TTL', () => {
      service.set('long', 'value', 60000); // 60s TTL
      expect(service.get('long')).toBe('value');
    });
  });

  describe('invalidate', () => {
    it('should invalidate entries matching pattern', () => {
      service.set('titles:list:1', 'data1');
      service.set('titles:list:2', 'data2');
      service.set('characters:list:1', 'data3');

      const count = service.invalidate('titles:*');
      expect(count).toBe(2);
      expect(service.get('titles:list:1')).toBeUndefined();
      expect(service.get('characters:list:1')).toBe('data3');
    });

    it('should return 0 when no entries match', () => {
      service.set('other:key', 'value');
      const count = service.invalidate('titles:*');
      expect(count).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      service.clear();
      expect(service.get('key1')).toBeUndefined();
      expect(service.get('key2')).toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      service.set('a', 1);
      service.set('b', 2);
      const stats = service.getStats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('a');
      expect(stats.keys).toContain('b');
    });
  });
});
