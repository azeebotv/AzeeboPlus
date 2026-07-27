import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../agbala/cache.service';

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
};

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    mockRedis.get.mockReset();
    mockRedis.set.mockReset();
    mockRedis.del.mockReset();
    mockRedis.keys.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheService, { provide: 'default_IORedisModuleConnectionToken', useValue: mockRedis }],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('set and get', () => {
    it('should store and retrieve values', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify('value1'));
      const result = await service.get<string>('key1');
      expect(result).toBe('value1');
      expect(mockRedis.get).toHaveBeenCalledWith('agbala:key1');
    });

    it('should store objects', async () => {
      const obj = { name: 'test', count: 42 };
      mockRedis.get.mockResolvedValue(JSON.stringify(obj));
      const result = await service.get<typeof obj>('obj1');
      expect(result).toEqual(obj);
    });

    it('should return null for missing keys', async () => {
      mockRedis.get.mockResolvedValue(null);
      const result = await service.get('missing');
      expect(result).toBeUndefined();
    });
  });

  describe('invalidate', () => {
    it('should invalidate entries matching pattern', async () => {
      mockRedis.keys.mockResolvedValue(['agbala:titles:list:1', 'agbala:titles:list:2']);
      mockRedis.del.mockResolvedValue(2);

      const count = await service.invalidate('titles:');
      expect(count).toBe(2);
      expect(mockRedis.keys).toHaveBeenCalledWith('agbala:titles:*');
    });

    it('should return 0 when no entries match', async () => {
      mockRedis.keys.mockResolvedValue([]);
      const count = await service.invalidate('titles:');
      expect(count).toBe(0);
    });
  });
});
