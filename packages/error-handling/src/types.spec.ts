import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  BadRequestError,
  ConflictError,
  TooManyRequestsError,
} from './types';

describe('Error Types', () => {
  describe('AppError', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError(500, 'Server Error', 'Something went wrong', { key: 'value' });

      expect(error.statusCode).toBe(500);
      expect(error.error).toBe('Server Error');
      expect(error.message).toBe('Something went wrong');
      expect(error.details).toEqual({ key: 'value' });
      expect(error.name).toBe('AppError');
    });

    it('should create AppError without details', () => {
      const error = new AppError(400, 'Bad Request', 'Invalid input');

      expect(error.statusCode).toBe(400);
      expect(error.details).toBeUndefined();
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with correct properties', () => {
      const error = new NotFoundError('User', '123');

      expect(error.statusCode).toBe(404);
      expect(error.error).toBe('Not Found');
      expect(error.message).toBe('User with id 123 not found');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create UnauthorizedError with default message', () => {
      const error = new UnauthorizedError();

      expect(error.statusCode).toBe(401);
      expect(error.error).toBe('Unauthorized');
      expect(error.message).toBe('Unauthorized');
    });

    it('should create UnauthorizedError with custom message', () => {
      const error = new UnauthorizedError('Token expired');

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Token expired');
    });
  });

  describe('ForbiddenError', () => {
    it('should create ForbiddenError with default message', () => {
      const error = new ForbiddenError();

      expect(error.statusCode).toBe(403);
      expect(error.error).toBe('Forbidden');
      expect(error.message).toBe('Forbidden');
    });

    it('should create ForbiddenError with custom message', () => {
      const error = new ForbiddenError('Insufficient permissions');

      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Insufficient permissions');
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with details', () => {
      const details = { email: ['Invalid email format'], password: ['Too short'] };
      const error = new ValidationError(details);

      expect(error.statusCode).toBe(422);
      expect(error.error).toBe('Validation Error');
      expect(error.message).toBe('Input validation failed');
      expect(error.details).toEqual(details);
    });
  });

  describe('BadRequestError', () => {
    it('should create BadRequestError with correct properties', () => {
      const error = new BadRequestError('Invalid request body');

      expect(error.statusCode).toBe(400);
      expect(error.error).toBe('Bad Request');
      expect(error.message).toBe('Invalid request body');
    });
  });

  describe('ConflictError', () => {
    it('should create ConflictError with correct properties', () => {
      const error = new ConflictError('Email already exists');

      expect(error.statusCode).toBe(409);
      expect(error.error).toBe('Conflict');
      expect(error.message).toBe('Email already exists');
    });
  });

  describe('TooManyRequestsError', () => {
    it('should create TooManyRequestsError with default message', () => {
      const error = new TooManyRequestsError();

      expect(error.statusCode).toBe(429);
      expect(error.error).toBe('Too Many Requests');
      expect(error.message).toBe('Too many requests');
      expect(error.details).toBeUndefined();
    });

    it('should create TooManyRequestsError with retryAfter', () => {
      const error = new TooManyRequestsError('Rate limit exceeded', 60);

      expect(error.statusCode).toBe(429);
      expect(error.details).toEqual({ retryAfter: 60 });
    });
  });
});
