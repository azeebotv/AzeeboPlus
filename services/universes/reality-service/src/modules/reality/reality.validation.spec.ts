import { validate } from 'class-validator';
import {
  CreateShowDto,
  UpdateShowDto,
  CreateEpisodeDto,
  CreateSeasonDto,
  CreateContestantDto,
  ShowStatus,
} from './dto/show.dto';
import { CastVoteDto, BuyVoteDto, MakePredictionDto } from './dto/vote.dto';

describe('Reality Service Validation Tests', () => {
  describe('CreateShowDto', () => {
    it('should validate valid show creation', async () => {
      const dto = new CreateShowDto();
      dto.title = 'Test Show';
      dto.description = 'A test reality show';
      dto.thumbnail = 'https://example.com/thumb.jpg';
      dto.universeId = 'universe-123';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when title is missing', async () => {
      const dto = new CreateShowDto();
      dto.title = '';
      dto.thumbnail = 'https://example.com/thumb.jpg';
      dto.universeId = 'universe-123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('title');
    });

    it('should fail validation when thumbnail is missing', async () => {
      const dto = new CreateShowDto();
      dto.title = 'Test Show';
      dto.thumbnail = '';
      dto.universeId = 'universe-123';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('thumbnail');
    });

    it('should fail validation when universeId is missing', async () => {
      const dto = new CreateShowDto();
      dto.title = 'Test Show';
      dto.thumbnail = 'https://example.com/thumb.jpg';
      dto.universeId = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('universeId');
    });

    it('should allow optional description to be undefined', async () => {
      const dto = new CreateShowDto();
      dto.title = 'Test Show';
      dto.thumbnail = 'https://example.com/thumb.jpg';
      dto.universeId = 'universe-123';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('UpdateShowDto', () => {
    it('should validate valid update with status', async () => {
      const dto = new UpdateShowDto();
      dto.status = ShowStatus.ACTIVE;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate empty update (all optional fields)', async () => {
      const dto = new UpdateShowDto();

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with invalid status', async () => {
      const dto = new UpdateShowDto();
      // @ts-expect-error Testing invalid enum value
      dto.status = 'invalid';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('status');
    });
  });

  describe('CreateEpisodeDto', () => {
    it('should validate valid episode creation', async () => {
      const dto = new CreateEpisodeDto();
      dto.title = 'Episode 1';
      dto.number = 1;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when title is missing', async () => {
      const dto = new CreateEpisodeDto();
      dto.title = '';
      dto.number = 1;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('title');
    });

    it('should fail validation when number is missing', async () => {
      const dto = new CreateEpisodeDto();
      dto.title = 'Episode 1';
      // @ts-expect-error Testing missing property
      dto.number = undefined;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('CreateSeasonDto', () => {
    it('should validate valid season creation', async () => {
      const dto = new CreateSeasonDto();
      dto.title = 'Season 1';
      dto.number = 1;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when title is missing', async () => {
      const dto = new CreateSeasonDto();
      dto.title = '';
      dto.number = 1;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('title');
    });
  });

  describe('CreateContestantDto', () => {
    it('should validate valid contestant creation', async () => {
      const dto = new CreateContestantDto();
      dto.name = 'John Doe';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when name is missing', async () => {
      const dto = new CreateContestantDto();
      dto.name = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });
  });

  describe('Vote DTOs', () => {
    describe('CastVoteDto', () => {
      it('should validate valid vote', async () => {
        const dto = new CastVoteDto();
        dto.contestantId = 'contestant-123';
        dto.showId = 'show-456';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation when contestantId is missing', async () => {
        const dto = new CastVoteDto();
        dto.contestantId = '';
        dto.showId = 'show-456';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('contestantId');
      });
    });

    describe('BuyVoteDto', () => {
      it('should validate valid vote purchase', async () => {
        const dto = new BuyVoteDto();
        dto.contestantId = 'contestant-123';
        dto.showId = 'show-456';
        dto.quantity = 5;

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation when quantity is zero', async () => {
        const dto = new BuyVoteDto();
        dto.contestantId = 'contestant-123';
        dto.showId = 'show-456';
        dto.quantity = 0;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('quantity');
      });

      it('should fail validation when quantity is negative', async () => {
        const dto = new BuyVoteDto();
        dto.contestantId = 'contestant-123';
        dto.showId = 'show-456';
        dto.quantity = -1;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('quantity');
      });
    });

    describe('MakePredictionDto', () => {
      it('should validate valid prediction', async () => {
        const dto = new MakePredictionDto();
        dto.showId = 'show-123';
        dto.prediction = { winner: 'contestant-1', runnerUp: 'contestant-2' };

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation when showId is missing', async () => {
        const dto = new MakePredictionDto();
        dto.showId = '';
        dto.prediction = { winner: 'contestant-1' };

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('showId');
      });
    });
  });
});
