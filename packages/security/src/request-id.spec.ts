import { RequestIdMiddleware } from './request-id.middleware';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
    mockReq = {
      headers: {},
    };
    mockRes = {
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should generate a UUID when no x-request-id header present', () => {
    middleware.use(mockReq, mockRes, mockNext);

    expect(mockReq.headers['x-request-id']).toBeDefined();
    expect(typeof mockReq.headers['x-request-id']).toBe('string');
    expect(mockReq.headers['x-request-id']).toHaveLength(36); // UUID format
  });

  it('should use existing x-request-id header', () => {
    mockReq.headers['x-request-id'] = 'existing-request-id';

    middleware.use(mockReq, mockRes, mockNext);

    expect(mockReq.headers['x-request-id']).toBe('existing-request-id');
  });

  it('should set X-Request-ID response header', () => {
    middleware.use(mockReq, mockRes, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', mockReq.headers['x-request-id']);
  });

  it('should call next()', () => {
    middleware.use(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should set response header with the same value as request', () => {
    mockReq.headers['x-request-id'] = 'custom-id-123';

    middleware.use(mockReq, mockRes, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', 'custom-id-123');
  });
});
