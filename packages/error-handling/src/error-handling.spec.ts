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

describe('AppError', () => {
  it('should create an error with correct properties', () => {
    const error = new AppError(500, 'Internal Server Error', 'Something went wrong');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(500);
    expect(error.error).toBe('Internal Server Error');
    expect(error.message).toBe('Something went wrong');
    expect(error.name).toBe('AppError');
  });

  it('should accept optional details', () => {
    const details = { field: 'email', reason: 'invalid' };
    const error = new AppError(400, 'Bad Request', 'Validation failed', details);
    expect(error.details).toEqual(details);
  });

  it('should be catchable as Error', () => {
    try {
      throw new AppError(400, 'Bad Request', 'test');
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(e).toBeInstanceOf(AppError);
    }
  });
});

describe('NotFoundError', () => {
  it('should format message with resource and id', () => {
    const error = new NotFoundError('User', '123');
    expect(error.statusCode).toBe(404);
    expect(error.error).toBe('Not Found');
    expect(error.message).toBe('User with id 123 not found');
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('UnauthorizedError', () => {
  it('should default to "Unauthorized" message', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.error).toBe('Unauthorized');
    expect(error.message).toBe('Unauthorized');
  });

  it('should accept custom message', () => {
    const error = new UnauthorizedError('Token expired');
    expect(error.message).toBe('Token expired');
  });
});

describe('ForbiddenError', () => {
  it('should default to "Forbidden" message', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.error).toBe('Forbidden');
    expect(error.message).toBe('Forbidden');
  });

  it('should accept custom message', () => {
    const error = new ForbiddenError('Insufficient permissions');
    expect(error.message).toBe('Insufficient permissions');
  });
});

describe('ValidationError', () => {
  it('should store field errors in details', () => {
    const details = { email: ['Invalid email'], password: ['Too short'] };
    const error = new ValidationError(details);
    expect(error.statusCode).toBe(422);
    expect(error.error).toBe('Validation Error');
    expect(error.message).toBe('Input validation failed');
    expect(error.details).toEqual(details);
  });
});

describe('BadRequestError', () => {
  it('should set message and status code', () => {
    const error = new BadRequestError('Invalid request body');
    expect(error.statusCode).toBe(400);
    expect(error.error).toBe('Bad Request');
    expect(error.message).toBe('Invalid request body');
  });
});

describe('ConflictError', () => {
  it('should set message and status code', () => {
    const error = new ConflictError('Email already exists');
    expect(error.statusCode).toBe(409);
    expect(error.error).toBe('Conflict');
    expect(error.message).toBe('Email already exists');
  });
});

describe('TooManyRequestsError', () => {
  it('should default to 429 with standard message', () => {
    const error = new TooManyRequestsError();
    expect(error.statusCode).toBe(429);
    expect(error.error).toBe('Too Many Requests');
    expect(error.message).toBe('Too many requests');
  });

  it('should accept custom message', () => {
    const error = new TooManyRequestsError('Rate limit exceeded');
    expect(error.message).toBe('Rate limit exceeded');
  });

  it('should include retryAfter in details when provided', () => {
    const error = new TooManyRequestsError('Rate limit exceeded', 60);
    expect(error.details).toEqual({ retryAfter: 60 });
  });

  it('should not include details when retryAfter not provided', () => {
    const error = new TooManyRequestsError('Rate limit exceeded');
    expect(error.details).toBeUndefined();
  });
});
