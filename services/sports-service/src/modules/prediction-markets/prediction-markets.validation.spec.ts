import { validate } from 'class-validator';
import { CreatePredictionDto, SubmitPredictionDto, ResolvePredictionDto } from './dto/prediction.dto';

describe('Prediction Markets Validation Tests', () => {
  describe('CreatePredictionDto', () => {
    it('should validate valid prediction creation', async () => {
      const dto = new CreatePredictionDto();
      dto.userId = 'user-123';
      dto.fixtureId = 'fixture-456';
      dto.selectedOption = 'Team A';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when userId is missing', async () => {
      const dto = new CreatePredictionDto();
      dto.userId = '';
      dto.fixtureId = 'fixture-456';
      dto.selectedOption = 'Team A';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('userId');
    });

    it('should fail validation when fixtureId is missing', async () => {
      const dto = new CreatePredictionDto();
      dto.userId = 'user-123';
      dto.fixtureId = '';
      dto.selectedOption = 'Team A';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('fixtureId');
    });

    it('should fail validation when selectedOption is missing', async () => {
      const dto = new CreatePredictionDto();
      dto.userId = 'user-123';
      dto.fixtureId = 'fixture-456';
      dto.selectedOption = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('selectedOption');
    });
  });

  describe('SubmitPredictionDto', () => {
    it('should validate valid prediction submission', async () => {
      const dto = new SubmitPredictionDto();
      dto.userId = 'user-123';
      dto.predictionId = 'prediction-456';
      dto.selectedOption = 'Team A';
      dto.stake = 100;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when stake is negative', async () => {
      const dto = new SubmitPredictionDto();
      dto.userId = 'user-123';
      dto.predictionId = 'prediction-456';
      dto.selectedOption = 'Team A';
      dto.stake = -10;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('stake');
    });

    it('should fail validation when userId is not a string', async () => {
      const dto = new SubmitPredictionDto();
      // @ts-expect-error Testing invalid type
      dto.userId = 123;
      dto.predictionId = 'prediction-456';
      dto.selectedOption = 'Team A';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('userId');
    });

    it('should allow optional stake to be undefined', async () => {
      const dto = new SubmitPredictionDto();
      dto.userId = 'user-123';
      dto.predictionId = 'prediction-456';
      dto.selectedOption = 'Team A';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('ResolvePredictionDto', () => {
    it('should validate valid resolution', async () => {
      const dto = new ResolvePredictionDto();
      dto.predictionId = 'prediction-123';
      dto.winningOption = 'Team A';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when predictionId is missing', async () => {
      const dto = new ResolvePredictionDto();
      dto.predictionId = '';
      dto.winningOption = 'Team A';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('predictionId');
    });

    it('should fail validation when winningOption is missing', async () => {
      const dto = new ResolvePredictionDto();
      dto.predictionId = 'prediction-123';
      dto.winningOption = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('winningOption');
    });
  });
});