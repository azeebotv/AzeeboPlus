import { Test, TestingModule } from '@nestjs/testing';
import { ACDPValidationService } from './content-acdp-validation.service';

describe('ACDPValidationService', () => {
  let service: ACDPValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ACDPValidationService],
    }).compile();

    service = module.get<ACDPValidationService>(ACDPValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateContentMetadata', () => {
    it('should return valid for complete content', () => {
      const result = service.validateContentMetadata({
        title: 'My Movie',
        description: 'A great movie',
        thumbnail: 'thumb.jpg',
        universeId: 'movie',
        metadata: { ageRating: 'PG-13', contentDescriptors: ['violence'] },
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.classification).toEqual({
        ageRating: 'PG-13',
        contentDescriptors: ['violence'],
        parentalAdvisory: false,
      });
    });

    it('should fail when required fields are missing', () => {
      const result = service.validateContentMetadata({});

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
      expect(result.errors).toContain('Missing required field: title');
      expect(result.errors).toContain('Missing required field: description');
      expect(result.errors).toContain('Missing required field: thumbnail');
      expect(result.errors).toContain('Missing required field: universeId');
    });

    it('should fail when title is too short', () => {
      const result = service.validateContentMetadata({
        title: 'AB',
        description: 'Desc',
        thumbnail: 'thumb.jpg',
        universeId: 'movie',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title must be at least 3 characters');
    });

    it('should fail when title is too long', () => {
      const result = service.validateContentMetadata({
        title: 'A'.repeat(201),
        description: 'Desc',
        thumbnail: 'thumb.jpg',
        universeId: 'movie',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title must not exceed 200 characters');
    });

    it('should warn when description is too long', () => {
      const result = service.validateContentMetadata({
        title: 'My Content',
        description: 'A'.repeat(2001),
        thumbnail: 'thumb.jpg',
        universeId: 'movie',
      });

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Description exceeds recommended length of 2000 characters');
    });

    it('should fail for invalid age rating', () => {
      const result = service.validateContentMetadata({
        title: 'My Movie',
        description: 'Desc',
        thumbnail: 'thumb.jpg',
        universeId: 'movie',
        metadata: { ageRating: 'INVALID' },
      });

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid age rating');
    });

    it('should warn for unknown content descriptors', () => {
      const result = service.validateContentMetadata({
        title: 'My Movie',
        description: 'Desc',
        thumbnail: 'thumb.jpg',
        universeId: 'movie',
        metadata: { contentDescriptors: ['unknown-desc'] },
      });

      expect(result.warnings).toContain('Unknown content descriptor: unknown-desc');
    });

    it('should warn for mature descriptors without age rating', () => {
      const result = service.validateContentMetadata({
        title: 'My Movie',
        description: 'Desc',
        thumbnail: 'thumb.jpg',
        universeId: 'movie',
        metadata: { contentDescriptors: ['violence'] },
      });

      expect(result.warnings).toContain('Content has mature descriptors but no age rating — will default to PG-13');
    });

    it('should set parentalAdvisory for R, NC-17, and 18+', () => {
      for (const rating of ['R', 'NC-17', '18+']) {
        const result = service.validateContentMetadata({
          title: 'My Movie',
          description: 'Desc',
          thumbnail: 'thumb.jpg',
          universeId: 'movie',
          metadata: { ageRating: rating },
        });

        expect(result.classification!.parentalAdvisory).toBe(true);
      }
    });

    it('should not set parentalAdvisory for G, PG, PG-13', () => {
      for (const rating of ['G', 'PG', 'PG-13']) {
        const result = service.validateContentMetadata({
          title: 'My Movie',
          description: 'Desc',
          thumbnail: 'thumb.jpg',
          universeId: 'movie',
          metadata: { ageRating: rating },
        });

        expect(result.classification!.parentalAdvisory).toBe(false);
      }
    });
  });

  describe('validateUniverseFit', () => {
    it('should return valid when rating meets universe minimum', () => {
      const result = service.validateUniverseFit(
        { metadata: { ageRating: 'PG' } },
        'comedy'
      );

      expect(result.valid).toBe(true);
    });

    it('should fail when rating is below universe minimum', () => {
      const result = service.validateUniverseFit(
        { metadata: { ageRating: 'G' } },
        'comedy'
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('below minimum PG');
    });

    it('should fail for G-rated content in lifestyle universe', () => {
      const result = service.validateUniverseFit(
        { metadata: { ageRating: 'G' } },
        'lifestyle'
      );

      // G is the minimum for lifestyle, so it should be valid
      expect(result.valid).toBe(true);
    });

    it('should allow any rating for unknown universe', () => {
      const result = service.validateUniverseFit(
        { metadata: { ageRating: 'G' } },
        'unknown-universe'
      );

      expect(result.valid).toBe(true);
    });
  });
});
