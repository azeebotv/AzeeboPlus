import {
  ApiResponseWrapper,
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  createCreatedResponse,
  createNoContentResponse,
} from './api-response';

describe('ApiResponseWrapper', () => {
  describe('success', () => {
    it('should create a success response with data', () => {
      const result = ApiResponseWrapper.success({ id: 1, name: 'test' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 1, name: 'test' });
      expect(result.meta).toBeUndefined();
    });

    it('should include meta when provided', () => {
      const meta = { page: 1, limit: 10, total: 50, totalPages: 5 };
      const result = ApiResponseWrapper.success([1, 2, 3], meta);
      expect(result.meta).toEqual(meta);
    });
  });

  describe('error', () => {
    it('should create an error response', () => {
      const result = ApiResponseWrapper.error('VALIDATION_ERROR', 'Invalid input');
      expect(result.success).toBe(false);
      expect(result.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
      });
    });

    it('should include details when provided', () => {
      const details = { field: 'email' };
      const result = ApiResponseWrapper.error('INVALID', 'bad', details);
      expect(result.error?.details).toEqual(details);
    });
  });

  describe('created', () => {
    it('should create a created response', () => {
      const result = ApiResponseWrapper.created({ id: 1 });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 1 });
    });
  });

  describe('paginated', () => {
    it('should create a paginated response with correct meta', () => {
      const data = [1, 2, 3];
      const result = ApiResponseWrapper.paginated(data, 1, 10, 25);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });
  });

  describe('noContent', () => {
    it('should create a no-content response', () => {
      const result = ApiResponseWrapper.noContent();
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });
});

describe('Helper functions', () => {
  it('createSuccessResponse should wrap data', () => {
    const result = createSuccessResponse('hello');
    expect(result.success).toBe(true);
    expect(result.data).toBe('hello');
  });

  it('createErrorResponse should create error envelope', () => {
    const result = createErrorResponse('NOT_FOUND', 'Item not found');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NOT_FOUND');
  });

  it('createPaginatedResponse should compute totalPages', () => {
    const result = createPaginatedResponse([1, 2], 2, 5, 12);
    expect(result.meta?.totalPages).toBe(3);
    expect(result.meta?.page).toBe(2);
  });

  it('createCreatedResponse should create success response', () => {
    const result = createCreatedResponse({ id: 1 });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: 1 });
  });

  it('createNoContentResponse should return null data', () => {
    const result = createNoContentResponse();
    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });
});
