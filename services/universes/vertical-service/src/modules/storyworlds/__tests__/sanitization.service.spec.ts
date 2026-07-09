import { Test, TestingModule } from '@nestjs/testing';
import { SanitizationService, SpoilerLevel, AccessLevel } from '../agbala/sanitization.service';

describe('SanitizationService', () => {
  let service: SanitizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SanitizationService],
    }).compile();

    service = module.get<SanitizationService>(SanitizationService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sanitizeContent', () => {
    it('should strip script tags', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = service.sanitizeContent(input);
      expect(result).toBe('Hello  World');
    });

    it('should strip event handlers', () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      const result = service.sanitizeContent(input);
      expect(result).not.toContain('onclick');
    });

    it('should preserve safe HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const result = service.sanitizeContent(input);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });

    it('should strip disallowed tags', () => {
      const input = '<p>Hello</p><script>Bad</script><div>Also bad</div>';
      const result = service.sanitizeContent(input);
      expect(result).toContain('<p>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<div>');
    });

    it('should handle empty input', () => {
      expect(service.sanitizeContent('')).toBe('');
      expect(service.sanitizeContent(null as any)).toBe('');
      expect(service.sanitizeContent(undefined as any)).toBe('');
    });

    it('should strip javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">Click</a>';
      const result = service.sanitizeContent(input);
      expect(result).not.toContain('javascript:');
    });
  });

  describe('validateUnlockCode', () => {
    it('should accept valid alphanumeric codes', () => {
      expect(service.validateUnlockCode('ABC123')).toBe(true);
      expect(service.validateUnlockCode('unlock123')).toBe(true);
      expect(service.validateUnlockCode('a1b2c3')).toBe(true);
    });

    it('should reject codes that are too short', () => {
      expect(service.validateUnlockCode('ABC')).toBe(false);
    });

    it('should reject codes that are too long', () => {
      expect(service.validateUnlockCode('A'.repeat(13))).toBe(false);
    });

    it('should reject codes with special characters', () => {
      expect(service.validateUnlockCode('ABC-123')).toBe(false);
      expect(service.validateUnlockCode('ABC 123')).toBe(false);
    });

    it('should reject empty or invalid input', () => {
      expect(service.validateUnlockCode('')).toBe(false);
      expect(service.validateUnlockCode(null as any)).toBe(false);
    });
  });

  describe('validateSpoilerLevel', () => {
    it('should return valid spoiler levels', () => {
      expect(service.validateSpoilerLevel('none')).toBe(SpoilerLevel.NONE);
      expect(service.validateSpoilerLevel('minor')).toBe(SpoilerLevel.MINOR);
      expect(service.validateSpoilerLevel('moderate')).toBe(SpoilerLevel.MODERATE);
      expect(service.validateSpoilerLevel('major')).toBe(SpoilerLevel.MAJOR);
    });

    it('should default to NONE for invalid levels', () => {
      expect(service.validateSpoilerLevel('invalid')).toBe(SpoilerLevel.NONE);
      expect(service.validateSpoilerLevel('')).toBe(SpoilerLevel.NONE);
    });

    it('should be case insensitive', () => {
      expect(service.validateSpoilerLevel('NONE')).toBe(SpoilerLevel.NONE);
      expect(service.validateSpoilerLevel('Major')).toBe(SpoilerLevel.MAJOR);
    });
  });

  describe('validateAccessLevel', () => {
    it('should return valid access levels', () => {
      expect(service.validateAccessLevel('public')).toBe(AccessLevel.PUBLIC);
      expect(service.validateAccessLevel('members')).toBe(AccessLevel.MEMBERS);
      expect(service.validateAccessLevel('premium')).toBe(AccessLevel.PREMIUM);
      expect(service.validateAccessLevel('admin')).toBe(AccessLevel.ADMIN);
    });

    it('should default to PUBLIC for invalid levels', () => {
      expect(service.validateAccessLevel('invalid')).toBe(AccessLevel.PUBLIC);
      expect(service.validateAccessLevel('')).toBe(AccessLevel.PUBLIC);
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      expect(service.checkRateLimit('user1', 'theory', 5, 60000)).toBe(true);
      expect(service.checkRateLimit('user1', 'theory', 5, 60000)).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      for (let i = 0; i < 5; i++) {
        service.checkRateLimit('user2', 'post', 5, 60000);
      }
      expect(service.checkRateLimit('user2', 'post', 5, 60000)).toBe(false);
    });

    it('should track different users separately', () => {
      for (let i = 0; i < 5; i++) {
        service.checkRateLimit('userA', 'theory', 5, 60000);
      }
      expect(service.checkRateLimit('userA', 'theory', 5, 60000)).toBe(false);
      expect(service.checkRateLimit('userB', 'theory', 5, 60000)).toBe(true);
    });
  });

  describe('rateLimitKey', () => {
    it('should generate correct key format', () => {
      expect(service.rateLimitKey('user1', 'theory')).toBe('rate_limit:theory:user1');
    });
  });
});
