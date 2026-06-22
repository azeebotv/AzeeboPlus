import { validate } from 'class-validator';
import { JoinContestDto, SubmitContestScoreDto } from './dto/contest.dto';

describe('Fan Contests Validation Tests', () => {
  describe('JoinContestDto', () => {
    it('should validate valid contest join request', async () => {
      const dto = new JoinContestDto();
      dto.userId = 'user-123';
      dto.entryData = { picks: ['Team A', 'Team B'], bonus: 10 };

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when userId is missing', async () => {
      const dto = new JoinContestDto();
      dto.userId = '';
      dto.entryData = { picks: ['Team A'] };

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('userId');
    });

    it('should fail validation when entryData is not an object', async () => {
      const dto = new JoinContestDto();
      dto.userId = 'user-123';
      // @ts-expect-error Testing invalid type
      dto.entryData = 'invalid';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('entryData');
    });

    it('should fail validation when entryData is missing', async () => {
      const dto = new JoinContestDto();
      dto.userId = 'user-123';
      // @ts-expect-error Testing missing property
      dto.entryData = undefined;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('entryData');
    });
  });

  describe('SubmitContestScoreDto', () => {
    it('should validate valid score submission', async () => {
      const dto = new SubmitContestScoreDto();
      dto.userId = 'user-123';
      dto.score = 100;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when userId is missing', async () => {
      const dto = new SubmitContestScoreDto();
      dto.userId = '';
      dto.score = 100;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('userId');
    });

    it('should fail validation when score is not a number', async () => {
      const dto = new SubmitContestScoreDto();
      dto.userId = 'user-123';
      // @ts-expect-error Testing invalid type
      dto.score = 'invalid';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('score');
    });

    it('should fail validation when score is missing', async () => {
      const dto = new SubmitContestScoreDto();
      dto.userId = 'user-123';
      // @ts-expect-error Testing missing property
      dto.score = undefined;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('score');
    });

    it('should allow zero score', async () => {
      const dto = new SubmitContestScoreDto();
      dto.userId = 'user-123';
      dto.score = 0;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
